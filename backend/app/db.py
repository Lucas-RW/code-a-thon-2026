from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client = AsyncIOMotorClient(settings.MONGODB_URI)
database = client[settings.MONGODB_DB_NAME]

def get_database():
    return database

