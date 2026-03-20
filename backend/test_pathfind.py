import asyncio
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        # Mocking the payload
        payload = {
            "goal_type": "career",
            "goal_text": "ML Research"
        }
        # Note: We need a valid token or skip auth if testing locally with a modified main.py
        # But for now, I'll just check if the logic in a standalone script works with the DB
        import pymongo
        import re
        from bson import ObjectId

        mongo_client = pymongo.MongoClient('mongodb://localhost:27017')
        db = mongo_client['campuslens']
        opps_collection = db['opportunities']
        
        goal_text = "ML Research"
        keywords = [re.escape(k) for k in goal_text.split() if len(k) > 1]
        print(f"Keywords: {keywords}")
        
        search_filter = {
            "$or": [
                {"title": {"$regex": "|".join(keywords), "$options": "i"}},
                {"description": {"$regex": "|".join(keywords), "$options": "i"}},
                {"tags": {"$in": [re.compile(k, re.I) for k in keywords]}}
            ]
        }
        
        cursor = opps_collection.find(search_filter)
        results = list(cursor)
        print(f"Found {len(results)} initial results")
        for r in results:
            print(f" - {r['title']} (Tags: {r.get('tags')})")

        if len(results) < 10:
            found_tags = set()
            for cand in results:
                found_tags.update(cand.get("tags", []))
            
            if found_tags:
                tag_filter = {
                    "tags": {"$in": list(found_tags)},
                    "_id": {"$nin": [r["_id"] for r in results]}
                }
                cursor = opps_collection.find(tag_filter).limit(15 - len(results))
                more_results = list(cursor)
                print(f"Found {len(more_results)} additional tag-based results")
                for r in more_results:
                     print(f" + {r['title']} (Tags: {r.get('tags')})")
                results.extend(more_results)

        print(f"Total results: {len(results)}")

if __name__ == "__main__":
    asyncio.run(test())
