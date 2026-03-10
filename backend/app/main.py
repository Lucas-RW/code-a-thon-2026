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

    count = len(result.get("interested_opportunities", []))
    return {"status": "ok", "interested_opportunities_count": count}
