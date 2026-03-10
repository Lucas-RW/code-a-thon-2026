from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ReturnDocument
from .db import database
from .utils import serialize_mongo_document
from .models import UserCreateOrUpdate, InterestRequest

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

    extracted_skills = []

    if payload.interested:
        opportunities_collection = database.get_collection("opportunities")
        buildings_collection = database.get_collection("buildings")
        
        from bson import ObjectId
        import logging
        
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
            logging.error(f"Error updating graphs or calling AI: {e}", exc_info=True)

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
