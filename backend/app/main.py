from fastapi import FastAPI
from .db import database
from .utils import serialize_mongo_document

app = FastAPI(title="CampusLens API")

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
