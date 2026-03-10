from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client = AsyncIOMotorClient(settings.MONGODB_URI)
database = client[settings.MONGODB_DB_NAME]

def get_database():
    return database

@property
def buildings_collection():
    return database.get_collection("buildings")

@property
def opportunities_collection():
    return database.get_collection("opportunities")

@property
def users_collection():
    return database.get_collection("users")
