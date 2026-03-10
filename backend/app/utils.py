from bson import ObjectId

def serialize_mongo_document(doc: dict) -> dict:
    """
    Converts MongoDB _id (ObjectId) to string id and removes _id.
    """
    if doc:
        if "_id" in doc:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
    return doc
