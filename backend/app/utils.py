from bson import ObjectId


def _serialize_value(value):
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [_serialize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _serialize_value(item) for key, item in value.items()}
    return value


def serialize_mongo_document(doc: dict) -> dict:
    """
    Converts MongoDB documents into JSON-safe dictionaries by:
    - mapping `_id` -> `id`
    - recursively converting nested ObjectIds to strings
    """
    if not doc:
        return doc

    serialized = {key: _serialize_value(value) for key, value in doc.items()}
    if "_id" in serialized:
        serialized["id"] = str(serialized["_id"])
        del serialized["_id"]
    return serialized
