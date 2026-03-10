from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import database
from .utils import serialize_mongo_document

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
