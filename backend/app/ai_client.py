import json
import logging
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
