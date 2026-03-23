import asyncio
from bson import ObjectId
from app.db import database
from scripts.malachowsky_cise_directory import MALACHOWSKY_CISE_DIRECTORY
from scripts.malachowsky_events import MALACHOWSKY_EVENTS
from scripts.malachowsky_opportunities import MALACHOWSKY_OPPORTUNITIES
from scripts.malachowsky_research_opportunities import MALACHOWSKY_RESEARCH_OPPORTUNITIES
from scripts.new_physics_directory import NEW_PHYSICS_DIRECTORY
from scripts.new_physics_events import NEW_PHYSICS_EVENTS
from scripts.new_physics_research_opportunities import NEW_PHYSICS_RESEARCH_OPPORTUNITIES

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
            "lat": 29.647921,
            "lng": -82.343946,
            "departments": [
                "Computer & Information Science & Engineering",
                "Electrical & Computer Engineering",
                "Engineering Education",
                "Artificial Intelligence & Machine Learning",
                "Data Science & Big Data Analytics",
                "Cybersecurity & Privacy Engineering",
                "Digital Health & Biomedical Informatics",
                "Semiconductor & Microelectronics Research",
                "Internet of Things & Connected Systems",
                "High-Performance Computing & Research Computing"
            ],
            "description": "Malachowsky Hall for Data Science & Information Technology at the University of Florida is a multidisciplinary research and teaching facility that serves as the university’s central hub for artificial intelligence, data science, and advanced computing innovation. Opened in 2023 and named after NVIDIA co-founder Chris Malachowsky, the building was designed to unite computing, engineering, medicine, and health sciences in a single collaborative environment.",
            "image_url": "https://www.eng.ufl.edu/wp-content/uploads/2023/10/malachowsky-exterior.jpg",
            "professors": MALACHOWSKY_CISE_DIRECTORY
        },
        {
            "name": "Reitz Union",
            "short_name": "REITZ",
            "lat": 29.6465,
            "lng": -82.3478,
            "departments": ["Student Affairs", "Campus Programs", "Student Organizations"],
            "description": "The central hub of student life, events, and community programming, used as a placeholder building for student-life recommendations in the AR experience.",
            "image_url": "https://walker-arch.com/wp-content/uploads/2018/01/reitz_front-elevation.jpg",
            "professors": [
                {
                    "id": "reitz-p1",
                    "name": "Dr. Alicia Brooks",
                    "department": "Student Engagement",
                    "focus": "Leadership development and student-centered programming.",
                    "email": "alicia.brooks@ufl.edu",
                    "linkedin_url": "https://www.linkedin.com/in/alicia-brooks-uf",
                    "image_url": "https://placehold.co/400x400/111827/F8FAFC?text=AB"
                },
                {
                    "id": "reitz-p2",
                    "name": "Prof. Samir Coleman",
                    "department": "Campus Community",
                    "focus": "Belonging, peer networks, and student organization growth.",
                    "email": "samir.coleman@ufl.edu",
                    "linkedin_url": "https://www.linkedin.com/in/samir-coleman-uf",
                    "image_url": "https://placehold.co/400x400/0F172A/F8FAFC?text=SC"
                }
            ]
        },
        {
            "name": "New Physics Building",
            "short_name": "NPB",
            "lat": 29.6438,
            "lng": -82.3503,
            "departments": [
                "Physics",
                "Astrophysics",
                "High Energy Physics",
                "Fundamental Theory",
                "Biological Physics",
                "Condensed Matter Physics",
                "Research Seminars",
            ],
            "description": "The New Physics Building at the University of Florida serves as a core hub for physics research, seminars, and interdisciplinary scientific collaboration. It hosts activity across high energy physics, astrophysics, theoretical physics, and biological physics, while also supporting colloquia, faculty-led research groups, and student-facing academic events.",
            "image_url": "https://www.phys.ufl.edu/wp/wp-content/uploads/2018/06/physics-building.jpg",
            "professors": NEW_PHYSICS_DIRECTORY
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
        *[
            {
                "building_id": str(building_ids["Malachowsky Hall"]),
                **opportunity,
            }
            for opportunity in MALACHOWSKY_RESEARCH_OPPORTUNITIES
        ],
        *[
            {
                "building_id": str(building_ids["Malachowsky Hall"]),
                **event,
            }
            for event in MALACHOWSKY_EVENTS
        ],
        *[
            {
                "building_id": str(building_ids["Malachowsky Hall"]),
                **opportunity,
            }
            for opportunity in MALACHOWSKY_OPPORTUNITIES
        ],
        {
            "building_id": str(building_ids["Reitz Union"]),
            "type": "student_org",
            "title": "Hackathon Club",
            "description": "Weekly workshops, project hacking sessions, and peer collaboration for students at all levels.",
            "summary": "A student-led builder community.",
            "professor": "Dr. Alicia Brooks",
            "professor_id": "reitz-p1",
            "tags": ["Coding", "Community"],
            "contact": "hack@example.edu",
            "hourly_commitment": "2 hrs/week",
            "pay": "Unpaid",
            "goal_tags": ["career", "social_support"]
        },
        {
            "building_id": str(building_ids["Reitz Union"]),
            "type": "event",
            "title": "Student Leadership Mixer",
            "description": "Meet student leaders, mentors, and campus organizations in one place.",
            "summary": "Networking and belonging event.",
            "professor": "Prof. Samir Coleman",
            "professor_id": "reitz-p2",
            "tags": ["Leadership", "Community"],
            "hourly_commitment": "90 minutes",
            "pay": "N/A",
            "goal_tags": ["social_support", "career"]
        },
        {
            "building_id": str(building_ids["Reitz Union"]),
            "type": "research",
            "title": "Student Experience Research Fellow",
            "description": "Support surveys and analysis focused on student engagement and campus belonging.",
            "summary": "Entry-level research role in student experience.",
            "professor": "Dr. Alicia Brooks",
            "professor_id": "reitz-p1",
            "tags": ["Research", "Community"],
            "hourly_commitment": "5-6 hrs/week",
            "pay": "$14/hr",
            "goal_tags": ["research", "social_support"]
        },
        {
            "building_id": str(building_ids["New Physics Building"]),
            **NEW_PHYSICS_RESEARCH_OPPORTUNITIES[0]
        },
        {
            "building_id": str(building_ids["New Physics Building"]),
            **NEW_PHYSICS_RESEARCH_OPPORTUNITIES[1]
        },
        {
            "building_id": str(building_ids["New Physics Building"]),
            **NEW_PHYSICS_RESEARCH_OPPORTUNITIES[2]
        },
        {
            "building_id": str(building_ids["New Physics Building"]),
            **NEW_PHYSICS_EVENTS[0]
        },
        {
            "building_id": str(building_ids["New Physics Building"]),
            **NEW_PHYSICS_EVENTS[1]
        },
        {
            "building_id": str(building_ids["New Physics Building"]),
            **NEW_PHYSICS_EVENTS[2]
        },
    ]

    for o in opportunities_data:
        await opportunities_collection.insert_one(o)
        print(f"Inserted: {o['title']}")

    print(f"\nSummary: {len(buildings_data)} buildings and {len(opportunities_data)} opportunities inserted.")

if __name__ == "__main__":
    asyncio.run(main())
