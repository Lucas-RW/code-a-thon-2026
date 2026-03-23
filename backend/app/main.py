from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pymongo import ReturnDocument
from datetime import datetime
from bson import ObjectId
import logging
from pathlib import Path

from .db import database
from .utils import serialize_mongo_document
from .models import (
    User, UserAuth, AuthRegister, AuthLogin, Token, UserUpdate, InterestRequest,
    PathfindRequest, PathfindResponse, PathStep,
    AIBootstrapBuildingRequest, AIBootstrapBuildingResponse,
    SaveAIBootstrapRequest, Building, Opportunity,
)
from .auth import (
    get_password_hash, verify_password, create_access_token, get_current_user_profile
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
ASSETS_DIR = PROJECT_ROOT / "assets"

app = FastAPI(title="CampusLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["*"],
)

app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        import traceback
        print(f"🔥🔥 EXCEPTION CAUGHT BY MIDDLEWARE: {e}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "exception": str(e)}
        )

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# ── Auth Endpoints ───────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=Token)
async def register(payload: AuthRegister):
    users_auth_collection = database.get_collection("users_auth")
    users_collection = database.get_collection("users")

    # Check if email already exists
    existing_auth = await users_auth_collection.find_one({"email": payload.email})
    if existing_auth:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user profile first to get profile_id
    new_user = {
        "name": "",
        "year": None,
        "major": "",
        "is_first_gen": False,
        "is_transfer": False,
        "goals": [],
        "goal_preferences": {},
        "interested_opportunities": [],
        "skill_graph": {"nodes": [], "edges": []},
        "network_graph": {"nodes": [], "edges": []},
    }
    user_result = await users_collection.insert_one(new_user)
    profile_id = str(user_result.inserted_id)

    # Create auth document
    new_auth = {
        "email": payload.email,
        "hashed_password": get_password_hash(payload.password),
        "profile_id": profile_id,
        "created_at": datetime.utcnow(),
        "last_login_at": datetime.utcnow()
    }
    await users_auth_collection.insert_one(new_auth)

    access_token = create_access_token(data={"sub": profile_id})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token)
async def login(payload: AuthLogin):
    users_auth_collection = database.get_collection("users_auth")
    
    auth_doc = await users_auth_collection.find_one({"email": payload.email})
    if not auth_doc or not verify_password(payload.password, auth_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login
    await users_auth_collection.update_one(
        {"_id": auth_doc["_id"]},
        {"$set": {"last_login_at": datetime.utcnow()}}
    )

    access_token = create_access_token(data={"sub": auth_doc["profile_id"]})
    return {"access_token": access_token, "token_type": "bearer"}

# ── User Endpoints ───────────────────────────────────────────────────────────

@app.get("/users/me")
async def get_me(current_user: dict = Depends(get_current_user_profile)):
    return current_user

@app.put("/users/me")
async def update_me(payload: UserUpdate, current_user: dict = Depends(get_current_user_profile)):
    users_collection = database.get_collection("users")
    
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        return current_user

    result = await users_collection.find_one_and_update(
        {"_id": ObjectId(current_user["id"])},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )
    
    return serialize_mongo_document(result)

# ── Building Endpoints ───────────────────────────────────────────────────────

@app.get("/buildings")
async def get_buildings():
    buildings_collection = database.get_collection("buildings")
    cursor = buildings_collection.find()
    buildings = []
    async for doc in cursor:
        buildings.append(serialize_mongo_document(doc))
    return buildings

@app.get("/buildings/{building_id}")
async def get_building(building_id: str):
    buildings_collection = database.get_collection("buildings")
    try:
        query = {"_id": ObjectId(building_id)}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id format")
        
    doc = await buildings_collection.find_one(query)
    if not doc:
        raise HTTPException(status_code=404, detail="Building not found")
        
    return serialize_mongo_document(doc)

@app.get("/buildings/{building_id}/opportunities")
async def get_building_opportunities(building_id: str):
    buildings_collection = database.get_collection("buildings")
    opportunities_collection = database.get_collection("opportunities")
    
    try:
        b_obj_id = ObjectId(building_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id format")
        
    bldg_doc = await buildings_collection.find_one({"_id": b_obj_id})
    if not bldg_doc:
        raise HTTPException(status_code=404, detail="Building not found")
        
    opp_query = {"$or": [{"building_id": building_id}, {"building_id": b_obj_id}]}
        
    cursor = opportunities_collection.find(opp_query)
    opportunities = []
    async for doc in cursor:
        opportunities.append(serialize_mongo_document(doc))
        
    return opportunities

# ── Interest Endpoints ───────────────────────────────────────────────────────

@app.post("/interest")
async def toggle_interest(payload: InterestRequest, current_user: dict = Depends(get_current_user_profile)):
    """Add or remove an opportunity from a user's interested_opportunities list."""
    users_collection = database.get_collection("users")
    user_id = current_user["id"]

    if payload.interested:
        update_op = {"$addToSet": {"interested_opportunities": payload.opportunity_id}}
    else:
        update_op = {"$pull": {"interested_opportunities": payload.opportunity_id}}

    result = await users_collection.find_one_and_update(
        {"_id": ObjectId(user_id)},
        update_op,
        return_document=ReturnDocument.AFTER,
    )

    if result is None:
        raise HTTPException(status_code=404, detail="User not found")

    action = "marked" if payload.interested else "unmarked"
    logger.info(f"User {user_id} {action} interest for opportunity {payload.opportunity_id}")

    extracted_skills = []

    if payload.interested:
        opportunities_collection = database.get_collection("opportunities")
        buildings_collection = database.get_collection("buildings")
        
        try:
            try:
                opp_id_query = {"_id": ObjectId(payload.opportunity_id)}
            except Exception:
                opp_id_query = {"_id": payload.opportunity_id}

            opp_doc = await opportunities_collection.find_one(opp_id_query)
            
            if opp_doc:
                bldg_id = opp_doc.get("building_id")
                try:
                    bldg_id_query = {"_id": ObjectId(bldg_id)}
                except Exception:
                    bldg_id_query = {"_id": bldg_id}
                    
                bldg_doc = await buildings_collection.find_one(bldg_id_query)
                
                if bldg_doc:
                    title = opp_doc.get("title", "")
                    opp_type = opp_doc.get("type", "")
                    description = opp_doc.get("description")
                    departments = bldg_doc.get("departments", [])
                    department = departments[0] if departments else None
                    
                    from .ai_client import extract_skills_for_opportunity
                    extracted_skills = await extract_skills_for_opportunity(title, opp_type, description, department)
                    
                    from .graph_updates import update_skill_graph_for_interest, update_network_graph_for_interest
                    
                    user_skill_graph = result.get("skill_graph", {"nodes": [], "edges": []})
                    user_network_graph = result.get("network_graph", {"nodes": [], "edges": []})
                    
                    user_skill_graph = update_skill_graph_for_interest(user_skill_graph, str(opp_doc.get("_id", opp_doc.get("id"))), extracted_skills)
                    user_network_graph = update_network_graph_for_interest(user_network_graph, bldg_doc, opp_doc)
                    
                    await users_collection.update_one(
                        {"_id": result["_id"]},
                        {"$set": {
                            "skill_graph": user_skill_graph,
                            "network_graph": user_network_graph
                        }}
                    )
        except Exception as e:
            logger.error(f"Error updating graphs or calling AI: {e}", exc_info=True)

    count = len(result.get("interested_opportunities", []))
    response_payload = {
        "status": "ok",
        "interested": payload.interested,
        "opportunity_id": payload.opportunity_id,
        "interested_opportunities_count": count
    }
    
    if payload.interested:
        response_payload["skills"] = extracted_skills

    return response_payload

@app.get("/users/me/interested-opportunities")
async def get_interested_opportunities(current_user: dict = Depends(get_current_user_profile)):
    users_collection = database.get_collection("users")
    user_doc = await users_collection.find_one({"_id": ObjectId(current_user["id"])})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
        
    interested_ids = user_doc.get("interested_opportunities", [])
    if not interested_ids:
        return []
        
    opportunities_collection = database.get_collection("opportunities")
    buildings_collection = database.get_collection("buildings")
    
    query_ids = []
    for oid in interested_ids:
        try:
            query_ids.append(ObjectId(oid))
        except Exception:
            pass
        query_ids.append(oid)
        
    opp_cursor = opportunities_collection.find({"_id": {"$in": query_ids}})
    
    ops = []
    async for opp in opp_cursor:
        ops.append(opp)
        
    bldg_ids = list(set([opp.get("building_id") for opp in ops if opp.get("building_id")]))
    bldg_query_ids = []
    for bid in bldg_ids:
        try:
            bldg_query_ids.append(ObjectId(bid))
        except Exception:
            pass
        bldg_query_ids.append(bid)
        
    bldgs_cursor = buildings_collection.find({"_id": {"$in": bldg_query_ids}})
    bldg_map = {}
    async for bldg in bldgs_cursor:
        s_bldg = serialize_mongo_document(bldg)
        bldg_map[s_bldg["id"]] = s_bldg
        bldg_map[str(bldg["_id"])] = s_bldg
        
    results = []
    for opp in ops:
        s_opp = serialize_mongo_document(opp)
        b_id = s_opp.get("building_id")
        bldg_info = bldg_map.get(b_id, {})
        
        results.append({
            "id": s_opp.get("id"),
            "building_id": b_id,
            "building_name": bldg_info.get("name", "Unknown Building"),
            "building_short_name": bldg_info.get("short_name", ""),
            "type": s_opp.get("type", "unknown"),
            "title": s_opp.get("title", "Untitled"),
            "description": s_opp.get("description", ""),
            "professor": s_opp.get("professor", None),
            "tags": s_opp.get("tags", []),
            "contact": s_opp.get("contact", None),
            "url": s_opp.get("url", None),
            "deadline": s_opp.get("deadline", None),
            "goal_tags": s_opp.get("goal_tags", []),
        })
        
    logger.info(f"Returned {len(results)} interested opportunities for user {current_user['id']}")
    return results

# ── Pathfinding Endpoints ───────────────────────────────────────────────────

@app.post("/pathfind", response_model=PathfindResponse)
async def pathfind(payload: PathfindRequest, current_user: dict = Depends(get_current_user_profile)):
    """
    Generate a personalized 'Golden Path' of opportunities based on user goals and profile.
    Uses AI relevance scoring to filter and rank candidates.
    Robustness: Returns a fallback path if AI or DB lookup fails.
    """
    from .ai_client import score_opportunities_relevance
    from .graph_updates import slugify
    import re
    
    RELEVANCE_THRESHOLD = 60   # minimum score to appear as an alternative
    MAX_ALTERNATIVES = 8       # cap on alt nodes in the graph
    
    try:
        user_id = current_user["id"]
        goal = payload.goal_type
        goal_text = payload.goal_text
        
        opps_collection = database.get_collection("opportunities")
        bldgs_collection = database.get_collection("buildings")
        
        # ── 1. Broad candidate search (same as before) ──
        keywords = [re.escape(k) for k in (goal_text or goal).split() if len(k) > 1]
        if not keywords:
            keywords = [re.escape(goal_text or goal)]
        
        search_filter = {
            "$or": [
                {"title": {"$regex": "|".join(keywords), "$options": "i"}},
                {"description": {"$regex": "|".join(keywords), "$options": "i"}},
                {"tags": {"$in": [re.compile(k, re.I) for k in keywords]}}
            ]
        }
        
        cursor = opps_collection.find(search_filter).limit(20)
        all_candidates = []
        async for doc in cursor:
            all_candidates.append(serialize_mongo_document(doc))
            
        # Breadth expansion via tags of found results
        if all_candidates and len(all_candidates) < 15:
            found_tags = set()
            for cand in all_candidates:
                found_tags.update(cand.get("tags", []))
            
            existing_ids = []
            for c in all_candidates:
                try:
                    existing_ids.append(ObjectId(c["id"]))
                except Exception:
                    pass
                existing_ids.append(c["id"])
            
            tag_filter = {
                "tags": {"$in": list(found_tags)},
                "_id": {"$nin": existing_ids}
            }
            cursor = opps_collection.find(tag_filter).limit(20 - len(all_candidates))
            async for doc in cursor:
                all_candidates.append(serialize_mongo_document(doc))
        
        # Goal-type expansion
        if len(all_candidates) < 15:
            existing_ids = []
            for c in all_candidates:
                try:
                    existing_ids.append(ObjectId(c["id"]))
                except Exception:
                    pass
                existing_ids.append(c["id"])
            
            goal_filter = {
                "goal_tags": goal,
                "_id": {"$nin": existing_ids}
            }
            cursor = opps_collection.find(goal_filter).limit(20 - len(all_candidates))
            async for doc in cursor:
                all_candidates.append(serialize_mongo_document(doc))

        # Fallback to goal_tags if still empty
        if not all_candidates:
            cursor = opps_collection.find({"goal_tags": goal}).limit(15)
            async for doc in cursor:
                all_candidates.append(serialize_mongo_document(doc))
        
        # Absolute fallback if still empty
        if not all_candidates:
            return PathfindResponse(steps=get_static_fallback_path(goal), alternatives=[])

        # ── 2. Score all candidates for relevance ──
        profile_summary = (
            f"Name: {current_user.get('name', 'N/A')}, "
            f"Major: {current_user.get('major', 'N/A')}, "
            f"Year: {current_user.get('year', 'N/A')}, "
            f"Goals: {', '.join(current_user.get('goals', []))}"
        )
        
        scores = await score_opportunities_relevance(
            goal_type=goal,
            goal_text=goal_text,
            user_profile_summary=profile_summary,
            candidates=all_candidates,
        )
        
        # Build a score lookup: opportunity_id -> {score, reason}
        score_map = {}
        for s in scores:
            score_map[s["opportunity_id"]] = s
        
        # Attach scores to candidates and sort descending
        for c in all_candidates:
            cid = str(c.get("id", c.get("_id", "")))
            info = score_map.get(cid, {"relevance_score": 0, "short_reason": ""})
            c["_relevance_score"] = info["relevance_score"]
            c["_short_reason"] = info["short_reason"]
        
        all_candidates.sort(key=lambda c: c["_relevance_score"], reverse=True)
        
        # ── 3. Split into golden path + relevant alternatives ──
        path_opps = all_candidates[:3]
        alt_opps = [
            c for c in all_candidates[3:]
            if c["_relevance_score"] >= RELEVANCE_THRESHOLD
        ][:MAX_ALTERNATIVES]

        # ── 4. Build PathSteps ──
        async def build_step(opp, order, is_alt=False):
            b_id = opp.get("building_id")
            try:
                b_query = {"_id": ObjectId(b_id)} if len(str(b_id)) == 24 else {"_id": b_id}
                b_doc = await bldgs_collection.find_one(b_query)
            except:
                b_doc = None
            
            b_name = b_doc.get("name", "UF Campus") if b_doc else "UF Campus"
            
            # Use the reason from AI scoring (already computed)
            reason = opp.get("_short_reason") or f"Essential milestone for {goal_text or goal} development."

            skill_ids = [f"skill:{slugify(s)}" for s in opp.get("tags", [])[:2]]
            prefix = "alt" if is_alt else "opp"
            network_ids = [f"bldg:{b_id}", f"{prefix}:{str(opp['id'])}"]

            return PathStep(
                order=order,
                goal_type=goal,
                building_id=str(b_id),
                building_name=b_name,
                opportunity_id=str(opp["id"]),
                opportunity_title=opp["title"],
                short_reason=reason,
                skills=opp.get("tags", [])[:3],
                skill_node_ids=skill_ids,
                network_node_ids=network_ids,
                cta_label="View Details",
                cta_url=f"/building/{b_id}?opp={str(opp['id'])}"
            )

        steps = []
        for i, opp in enumerate(path_opps):
            steps.append(await build_step(opp, i + 1))
            
        alternatives = []
        for i, opp in enumerate(alt_opps):
            alternatives.append(await build_step(opp, len(steps) + i + 1, is_alt=True))
            
        logger.info(
            f"Pathfind for user {user_id}: "
            f"{len(steps)} golden steps + {len(alternatives)} relevant alts "
            f"(filtered from {len(all_candidates)} candidates)"
        )
        return PathfindResponse(steps=steps, alternatives=alternatives)

    except Exception as e:
        logger.error(f"Pathfind error, returning fallback: {e}")
        return PathfindResponse(steps=get_static_fallback_path(payload.goal_type))

def get_static_fallback_path(goal_type: str) -> list[PathStep]:
    """Static fallback for demo safety."""
    return [
        PathStep(
            order=1,
            goal_type=goal_type,
            building_id="reitz",
            building_name="Reitz Union",
            opportunity_id="opp1",
            opportunity_title="Student Involvement Fair",
            short_reason="Start by exploring student organizations at the Reitz.",
            skills=["Networking", "Leadership"],
            skill_node_ids=["skill:networking"],
            network_node_ids=["bldg:reitz"],
            cta_label="Navigate There",
            cta_url="/building/reitz"
        ),
        PathStep(
            order=2,
            goal_type=goal_type,
            building_id="marston",
            building_name="Marston Science Library",
            opportunity_id="opp2",
            opportunity_title="Study Group Session",
            short_reason="Collaborate with peers to strengthen your academic foundation.",
            skills=["Collaboration", "Python"],
            skill_node_ids=["skill:python"],
            network_node_ids=["bldg:marston"],
            cta_label="View Location",
            cta_url="/building/marston"
        ),
        PathStep(
            order=3,
            goal_type=goal_type,
            building_id="cse",
            building_name="CSE Building",
            opportunity_id="opp3",
            opportunity_title="AI Research Lab Tour",
            short_reason="Get direct exposure to cuting-edge research in your field.",
            skills=["Research", "Machine Learning"],
            skill_node_ids=["skill:ml"],
            network_node_ids=["bldg:cse"],
            cta_label="Go to Building",
            cta_url="/building/cse"
        )
    ]


# ── AI Bootstrap Endpoints ──────────────────────────────────────────────────

@app.post("/buildings/ai-bootstrap", response_model=AIBootstrapBuildingResponse)
async def ai_bootstrap_building(
    payload: AIBootstrapBuildingRequest,
    current_user: dict = Depends(get_current_user_profile),
):
    """
    Use AI to propose a building + opportunities for a campus.
    Does NOT write to Mongo; caller can inspect and decide to save.
    """
    from .ai_client import ai_generate_building_and_opportunities
    try:
        result = await ai_generate_building_and_opportunities(payload)
        return result
    except Exception as e:
        logger.error(f"AI bootstrap failed: {e}")
        # Fallback: simple generic building + 1 opportunity
        fallback_building = Building(
            name=payload.building_name,
            short_name=payload.building_name,
            lat=0.0,
            lng=0.0,
            departments=[],
            description=f"{payload.building_name} at {payload.campus_name}.",
            source="ai_fallback",
            confidence=0.3,
        )
        from .models import AIBootstrapOpportunity
        fallback_opp = AIBootstrapOpportunity(
            title=f"Explore {payload.building_name}",
            description="General academic and student resources.",
            type="general",
            goal_tags=["career"],
            contact=None,
            url=payload.building_url,
        )
        return AIBootstrapBuildingResponse(
            building=fallback_building,
            opportunities=[fallback_opp],
            source="ai_fallback",
            confidence=0.3,
        )

@app.post("/buildings/ai-bootstrap/save")
async def save_ai_bootstrap(
    payload: SaveAIBootstrapRequest,
    current_user: dict = Depends(get_current_user_profile),
):
    """
    Persist an AI-generated building + opportunities into Mongo.
    """
    buildings_col = database.get_collection("buildings")
    opps_col = database.get_collection("opportunities")

    # 1. Upsert building
    existing = await buildings_col.find_one({"name": payload.building.name})
    if existing:
        building_id = existing["_id"]
    else:
        building_doc = {
            "name": payload.building.name,
            "short_name": payload.building.short_name or payload.building.name,
            "lat": payload.building.lat,
            "lng": payload.building.lng,
            "departments": payload.building.departments or [],
            "description": payload.building.description,
            "image_url": payload.building.image_url,
            "source": payload.building.source or "ai_generated",
            "confidence": payload.building.confidence or 0.7,
        }
        result = await buildings_col.insert_one(building_doc)
        building_id = result.inserted_id

    # 2. Insert opportunities
    opp_docs = []
    for o in payload.opportunities:
        opp_docs.append(
            {
                "building_id": str(building_id),
                "type": o.type,
                "title": o.title,
                "description": o.description,
                "tags": [],
                "goal_tags": o.goal_tags,
                "contact": o.contact,
                "url": o.url,
                "deadline": None,
                "source": "ai_generated",
                "confidence": 0.7,
            }
        )

    if opp_docs:
        await opps_col.insert_many(opp_docs)

    return {
        "status": "ok", 
        "building_id": str(building_id), 
        "inserted_opportunities": len(opp_docs)
    }
