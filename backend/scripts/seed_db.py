import asyncio
from bson import ObjectId
from app.db import database

async def main():
    buildings_collection = database.get_collection("buildings")
    opportunities_collection = database.get_collection("opportunities")

    # Clear existing data
    print("Clearing existing data...")
    await buildings_collection.delete_many({})
    await opportunities_collection.delete_many({})

    # Seed Buildings
    print("Seeding buildings...")
    buildings_data = [
        {
            "name": "Malachowsky Hall",
            "short_name": "MAL",
            "lat": 29.6481,
            "lng": -82.3437,
            "departments": ["Computer Science", "Electrical Engineering"],
            "description": "State-of-the-art building for data science and AI.",
            "image_url": "https://example.com/malachowsky.jpg"
        },
        {
            "name": "Reitz Union",
            "short_name": "REITZ",
            "lat": 29.6465,
            "lng": -82.3478,
            "departments": ["Student Affairs"],
            "description": "The hub of student life on campus.",
            "image_url": "https://example.com/reitz.jpg"
        },
        {
            "name": "New Physics Building",
            "short_name": "NPB",
            "lat": 29.6438,
            "lng": -82.3503,
            "departments": ["Physics"],
            "description": "Home to the physics department.",
            "image_url": "https://example.com/npb.jpg"
        }
    ]
    
    building_ids = {}
    for b in buildings_data:
        result = await buildings_collection.insert_one(b)
        building_ids[b["name"]] = result.inserted_id
        print(f"Inserted: {b['name']} ({result.inserted_id})")

    # Seed Opportunities
    print("\nSeeding opportunities...")
    opportunities_data = [
        {
            "building_id": str(building_ids["Malachowsky Hall"]),
            "type": "research",
            "title": "Machine Learning Research Assistant",
            "description": "Research assistant role focusing on generative models.",
            "professor": "Dr. Smith",
            "tags": ["AI", "ML", "Python"],
            "contact": "smith@example.edu",
            "url": "https://example.com/ml-job",
            "deadline": "2026-05-01"
        },
        {
            "building_id": str(building_ids["Malachowsky Hall"]),
            "type": "job",
            "title": "Cybersecurity Intern",
            "description": "Help secure campus infrastructure.",
            "tags": ["Security", "Linux"],
            "contact": "hr@example.edu"
        },
        {
            "building_id": str(building_ids["Reitz Union"]),
            "type": "student_org",
            "title": "Hackathon Club",
            "description": "Weekly workshops and project hacking.",
            "tags": ["Coding", "Community"],
            "contact": "hack@example.edu"
        },
        {
            "building_id": str(building_ids["New Physics Building"]),
            "type": "course",
            "title": "Advanced Quantum Mechanics",
            "description": "In-depth study of quantum field theory.",
            "professor": "Dr. Einstein",
            "tags": ["Quantum", "Physics"],
            "deadline": "2026-08-20"
        }
    ]

    for o in opportunities_data:
        # Convert building_id to actual ObjectId for the field storage
        o["building_id_obj"] = ObjectId(o["building_id"])
        await opportunities_collection.insert_one(o)
        print(f"Inserted: {o['title']}")

    print(f"\nSummary: {len(buildings_data)} buildings and {len(opportunities_data)} opportunities inserted.")

if __name__ == "__main__":
    asyncio.run(main())
