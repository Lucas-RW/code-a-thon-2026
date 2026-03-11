from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ReturnDocument
from .db import database
from .utils import serialize_mongo_document
from .models import UserCreateOrUpdate, InterestRequest
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="CampusLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

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
    from bson import ObjectId
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
    from bson import ObjectId
    
    try:
        bldg_query = {"_id": ObjectId(building_id)}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id format")
        
    bldg_doc = await buildings_collection.find_one(bldg_query)
    if not bldg_doc:
        raise HTTPException(status_code=404, detail="Building not found")
        
    b_obj_id = ObjectId(building_id)
    opp_query = {"$or": [{"building_id": building_id}, {"building_id": b_obj_id}]}
        
    cursor = opportunities_collection.find(opp_query)
    opportunities = []
    async for doc in cursor:
        opportunities.append(serialize_mongo_document(doc))
        
    return opportunities


@app.get("/users/{clerk_user_id}")
async def get_user(clerk_user_id: str):
    users_collection = database.get_collection("users")
    doc = await users_collection.find_one({"clerk_user_id": clerk_user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_mongo_document(doc)

@app.post("/users")
async def upsert_user(payload: UserCreateOrUpdate):
    """Create or update a user profile keyed by clerk_user_id."""
    users_collection = database.get_collection("users")

    # Fields to set on every upsert (profile data).
    set_fields = {
        "name": payload.name,
        "major": payload.major,
        "year": payload.year,
        "interests": payload.interests,
    }

    # Fields to initialise only on insert (never overwrite existing graphs).
    set_on_insert = {
        "clerk_user_id": payload.clerk_user_id,
        "interested_opportunities": [],
        "skill_graph": {"nodes": [], "edges": []},
        "network_graph": {"nodes": [], "edges": []},
    }

    await users_collection.update_one(
        {"clerk_user_id": payload.clerk_user_id},
        {"$set": set_fields, "$setOnInsert": set_on_insert},
        upsert=True,
    )

    logger.info(f"Upserted user profile for clerk_user_id: {payload.clerk_user_id}")
    return {"status": "ok", "clerk_user_id": payload.clerk_user_id}


@app.post("/interest")
async def toggle_interest(payload: InterestRequest):
    """Add or remove an opportunity from a user's interested_opportunities list."""
    users_collection = database.get_collection("users")

    if payload.interested:
        update_op = {"$addToSet": {"interested_opportunities": payload.opportunity_id}}
    else:
        update_op = {"$pull": {"interested_opportunities": payload.opportunity_id}}

    result = await users_collection.find_one_and_update(
        {"clerk_user_id": payload.clerk_user_id},
        update_op,
        return_document=ReturnDocument.AFTER,
    )

    if result is None:
        raise HTTPException(status_code=404, detail="User not found")

    action = "marked" if payload.interested else "unmarked"
    logger.info(f"User {payload.clerk_user_id} {action} interest for opportunity {payload.opportunity_id}")

    extracted_skills = []

    if payload.interested:
        opportunities_collection = database.get_collection("opportunities")
        buildings_collection = database.get_collection("buildings")
        
        from bson import ObjectId
        
        try:
            # Handle both ObjectId strings and plain string IDs gracefully (depending on the seed data setup)
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


@app.get("/users/{clerk_user_id}/interested-opportunities")
async def get_interested_opportunities(clerk_user_id: str):
    users_collection = database.get_collection("users")
    user_doc = await users_collection.find_one({"clerk_user_id": clerk_user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
        
    interested_ids = user_doc.get("interested_opportunities", [])
    if not interested_ids:
        return []
        
    opportunities_collection = database.get_collection("opportunities")
    buildings_collection = database.get_collection("buildings")
    from bson import ObjectId
    
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
        from .utils import serialize_mongo_document
        s_bldg = serialize_mongo_document(bldg)
        bldg_map[s_bldg["id"]] = s_bldg
        bldg_map[str(bldg["_id"])] = s_bldg
        
    results = []
    for opp in ops:
        from .utils import serialize_mongo_document
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
            "deadline": s_opp.get("deadline", None)
        })
        
    logger.info(f"Returned {len(results)} interested opportunities for user {clerk_user_id}")
    return results
