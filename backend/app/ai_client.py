import json
import logging
import re
import httpx
from .config import settings

logger = logging.getLogger(__name__)

async def extract_skills_for_opportunity(
    title: str,
    type: str,
    description: str | None,
    department: str | None,
) -> list[str]:
    if not settings.AI_API_KEY:
        logger.warning("AI_API_KEY is not configured. Falling back to empty skills list.")
        return []

    prompt = f"""
Given this opportunity at the University of Florida:
Title: {title}
Type: {type}
Description: {description or 'N/A'}
Department: {department or 'N/A'}

Extract exactly 5 specific, concrete skills or knowledge items a student would gain from this opportunity. Be specific (not "communication skills" but "technical presentation to research committees"). 
Return ONLY a valid JSON array of strings, with no additional text or markdown formatting.
    """.strip()

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": settings.AI_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            content = data["choices"][0]["message"]["content"].strip()
            
            # Sometimes models return ```json ... ``` formatting
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
                
            content = content.strip()
            
            skills = json.loads(content)
            if isinstance(skills, list):
                # Ensure we return strings
                return [str(s) for s in skills][:5]
            else:
                logger.error(f"AI response was not a JSON array: {content}")
                return []
                
    except httpx.TimeoutException:
        logger.error("AI request timed out.")
        return []
    except httpx.HTTPStatusError as e:
        logger.error(f"AI API error: {e.response.status_code} - {e.response.text}")
        return []
    except json.JSONDecodeError:
        logger.error(f"Failed to parse AI response as JSON. Raw content: {content}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error calling AI: {e}")
        return []

async def generate_step_reason(
    user_profile: dict,
    goal_type: str,
    goal_text: str | None,
    opportunity_title: str,
    building_name: str,
) -> str:
    """
    Generates a personalized reason for a Golden Path step using AI.
    """
    if not settings.AI_API_KEY:
        return f"This {opportunity_title} at {building_name} is a great next step toward your {goal_type} goals."

    # Serialize profile for the prompt
    profile_summary = (
        f"Name: {user_profile.get('name', 'N/A')}, "
        f"Major: {user_profile.get('major', 'N/A')}, "
        f"Year: {user_profile.get('year', 'N/A')}, "
        f"Goals: {', '.join(user_profile.get('goals', []))}"
    )
    
    prompt = f"""
You are helping a UF student plan a path toward {goal_type}.
Student profile: {profile_summary}.
Goal text: {goal_text or "not specified"}.
Recommended step: {opportunity_title} at {building_name}.

In 1–2 sentences, explain why this is a good next step given their background and goal. Be specific and concrete. Return ONLY the explanation string, no markdown.
    """.strip()

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": settings.AI_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            reason = data["choices"][0]["message"]["content"].strip()
            return reason
    except Exception as e:
        logger.error(f"Error generating AI step reason: {e}")
        return f"A strong choice to advance your {goal_type} journey at {building_name}."


# ── Batched relevance scoring ────────────────────────────────────────────────

def _local_relevance_score(
    opp: dict,
    goal_type: str,
    goal_keywords: list[str],
) -> dict:
    """
    CPU-only fallback scorer based on keyword / tag overlap.
    Returns {"opportunity_id", "relevance_score" (0-100), "short_reason"}.
    """
    score = 0
    title = (opp.get("title") or "").lower()
    desc = (opp.get("description") or "").lower()
    tags = [t.lower() for t in opp.get("tags", [])]
    goal_tags = [g.lower() for g in (opp.get("goal_tags") or [])]

    # goal_type match is a strong signal
    if goal_type.lower() in goal_tags:
        score += 30

    # keyword overlap with title/desc/tags
    for kw in goal_keywords:
        kw_lower = kw.lower()
        if kw_lower in title:
            score += 15
        if kw_lower in desc:
            score += 8
        if kw_lower in tags:
            score += 12

    # Tag diversity bonus (more tags matched = broader relevance)
    matched_tags = sum(1 for kw in goal_keywords if kw.lower() in tags)
    score += min(matched_tags * 5, 15)

    opp_title = opp.get("title", "this opportunity")
    opp_type = opp.get("type", "opportunity")
    matched = [kw for kw in goal_keywords if kw.lower() in title or kw.lower() in tags]
    matched_str = ", ".join(matched[:3]) if matched else goal_type

    return {
        "opportunity_id": str(opp.get("id", opp.get("_id", ""))),
        "relevance_score": min(score, 100),
        "short_reason": (
            f"This {opp_type} builds skills in {matched_str} that directly support your {goal_type} trajectory. "
            f"Engaging with {opp_title} will strengthen your portfolio and expand your professional network in this area."
        )
    }


async def score_opportunities_relevance(
    goal_type: str,
    goal_text: str | None,
    user_profile_summary: str,
    candidates: list[dict],
) -> list[dict]:
    """
    Score a batch of candidate opportunities for relevance to the user's goal.
    Returns a list of {"opportunity_id", "relevance_score" (0-100), "short_reason"}.
    Falls back to local heuristic scoring if AI is unavailable.
    """
    goal_keywords = [w for w in (goal_text or goal_type).split() if len(w) > 1]

    if not settings.AI_API_KEY or not candidates:
        logger.info("AI unavailable or no candidates — using local relevance scorer")
        return [_local_relevance_score(c, goal_type, goal_keywords) for c in candidates]

    # Build a compact list for the prompt
    opp_summaries = []
    for i, c in enumerate(candidates):
        opp_summaries.append(
            f'{i+1}. id="{c.get("id", c.get("_id", ""))}" '
            f'title="{c.get("title", "")}" '
            f'type="{c.get("type", "")}" '
            f'tags={c.get("tags", [])} '
            f'desc="{(c.get("description") or "")[:120]}"'
        )

    prompt = f"""You are a career advisor scoring campus opportunities for a student.

Student profile: {user_profile_summary}
Goal type: {goal_type}
Goal text: {goal_text or "not specified"}

Opportunities:
{chr(10).join(opp_summaries)}

For EACH opportunity:
1. Rate its relevance (0-100) to this student's specific goal.
2. Write a personalized 2-3 sentence "reason" explaining HOW this opportunity advances their trajectory toward "{goal_text or goal_type}". Reference their major, year, or existing skills where relevant. Explain the concrete skills or connections they'll gain and why those matter for their goal. Do NOT just say "this is relevant" — be specific and actionable.

Return ONLY a valid JSON array with objects: {{"id": "...", "score": 0-100, "reason": "..."}}.
Order should match the input order. Return nothing else.""".strip()

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": settings.AI_MODEL,
        "messages": [{"role": "user", "content": prompt}]
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()

            data = response.json()
            content = data["choices"][0]["message"]["content"].strip()

            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            scored = json.loads(content)
            if not isinstance(scored, list):
                raise ValueError("AI response is not a JSON array")

            # Normalize to our format
            results = []
            for item in scored:
                results.append({
                    "opportunity_id": str(item.get("id", "")),
                    "relevance_score": max(0, min(100, int(item.get("score", 0)))),
                    "short_reason": item.get("reason", "Relevant opportunity.")
                })
            return results

    except Exception as e:
        logger.error(f"AI relevance scoring failed, using local fallback: {e}")
        return [_local_relevance_score(c, goal_type, goal_keywords) for c in candidates]


async def ai_generate_building_and_opportunities(payload: any) -> any:
    """
    Call the AI model to generate a provisional building description
    and 2–4 opportunities for that building.
    This does NOT touch Mongo; it just returns structured data.
    """
    from .models import (
        AIBootstrapBuildingRequest,
        AIBootstrapBuildingResponse,
        AIBootstrapOpportunity,
        Building,
    )

    if not settings.AI_API_KEY:
        logger.warning("AI_API_KEY is not configured for bootstrap.")
        raise Exception("AI_API_KEY not configured")

    prompt = f"""
You are helping populate a campus map app.

Campus: {payload.campus_name}
Building: {payload.building_name}
Building URL (may be None): {payload.building_url}

1) Write a 1–2 sentence description of what this building is primarily known for.
2) Guess the main departments or functions in this building as a short list.
3) Propose 2–4 concrete student opportunities associated with this building.
   IMPORTANT: Ensure a balanced mix — include at least one industry/career opportunity
   (internship, job, career event) alongside any research positions where plausible.
   For each opportunity, return:
   - title
   - description (1–2 sentences)
   - type: one of "student_org", "research", "course", "event", or "job"
   - goal_tags: subset of ["career", "research", "academic_aid", "social_support"]
   - contact (email or NULL)
   - url (URL or NULL)

Return ONLY valid JSON with the shape:
{{
  "building": {{
    "description": "...",
    "departments": ["..."],
    "image_url": null
  }},
  "opportunities": [
    {{
      "title": "...",
      "description": "...",
      "type": "...",
      "goal_tags": ["career"],
      "contact": null,
      "url": null
    }}
  ]
}}
"""
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "Content-Type": "application/json"
    }
    api_payload = {
        "model": settings.AI_MODEL,
        "messages": [{"role": "user", "content": prompt}]
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(url, headers=headers, json=api_payload)
        response.raise_for_status()
        
        raw_data = response.json()
        content = raw_data["choices"][0]["message"]["content"].strip()
        
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        data = json.loads(content)

    building = Building(
        name=payload.building_name,
        short_name=payload.building_name,
        description=data["building"].get("description"),
        departments=data["building"].get("departments") or [],
        image_url=data["building"].get("image_url"),
        lat=0.0, # Default or to be filled by caller/UI
        lng=0.0,
        source="ai_generated",
        confidence=0.7,
    )

    opps: list[AIBootstrapOpportunity] = []
    for o in data.get("opportunities", []):
        opps.append(
            AIBootstrapOpportunity(
                title=o["title"],
                description=o["description"],
                type=o["type"],
                goal_tags=o.get("goal_tags", []),
                contact=o.get("contact"),
                url=o.get("url"),
            )
        )

    return AIBootstrapBuildingResponse(
        building=building,
        opportunities=opps,
        source="ai_generated",
        confidence=0.7,
    )
