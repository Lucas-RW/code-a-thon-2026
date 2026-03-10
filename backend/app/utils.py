from bson import ObjectId

def serialize_mongo_document(doc: dict) -> dict:
    """
    Converts MongoDB _id (ObjectId) to string id.
    """
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
        # We don't remove _id here to keep it flexible, but usually /buildings will return this dict.
    return doc
