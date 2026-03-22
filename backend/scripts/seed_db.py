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
            "lat": 28.348565,
            "lng": -81.237858,
            "departments": ["Computer Science", "Electrical Engineering", "Data Science"],
            "description": "A high-tech academic hub used here as the live AR test building, seeded with placeholder details for engineering, AI, and student project discovery.",
            "image_url": "https://www.eng.ufl.edu/wp-content/uploads/2023/10/malachowsky-exterior.jpg",
            "professors": [
                {
                    "id": "mal-p1",
                    "name": "Dr. Maya Alvarez",
                    "department": "Emerging Technologies",
                    "focus": "AI systems, product engineering, and applied machine learning.",
                    "email": "maya.alvarez@ufl.edu",
                    "linkedin_url": "https://www.linkedin.com/in/maya-alvarez-uf",
                    "image_url": "https://placehold.co/400x400/1F1B3A/F8FAFC?text=MA"
                },
                {
                    "id": "mal-p2",
                    "name": "Prof. Jordan Patel",
                    "department": "Applied Innovation",
                    "focus": "Project mentorship, cross-functional collaboration, and opportunity design.",
                    "email": "jordan.patel@ufl.edu",
                    "linkedin_url": "https://www.linkedin.com/in/jordan-patel-uf",
                    "image_url": "https://placehold.co/400x400/111827/F8FAFC?text=JP"
                }
            ]
        },
        {
            "name": "Reitz Union",
            "short_name": "REITZ",
            "lat": 29.6465,
            "lng": -82.3478,
            "departments": ["Student Affairs", "Campus Programs", "Student Organizations"],
            "description": "The central hub of student life, events, and community programming, used as a placeholder building for student-life recommendations in the AR experience.",
            "image_url": "https://placehold.co/1200x700/111827/F8FAFC?text=Reitz+Union",
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
            "departments": ["Physics", "Astronomy", "Research Labs"],
            "description": "A science-focused building seeded with placeholder content for research pathways, faculty connections, and lab-oriented opportunities.",
            "image_url": "https://placehold.co/1200x700/0F172A/F8FAFC?text=New+Physics+Building",
            "professors": [
                {
                    "id": "npb-p1",
                    "name": "Dr. Elena Sato",
                    "department": "Astrophysics",
                    "focus": "Observational astronomy and data-intensive space research.",
                    "email": "elena.sato@ufl.edu",
                    "linkedin_url": "https://www.linkedin.com/in/elena-sato-uf",
                    "image_url": "https://placehold.co/400x400/1A1A2E/F8FAFC?text=ES"
                },
                {
                    "id": "npb-p2",
                    "name": "Prof. Marcus Liu",
                    "department": "Applied Physics",
                    "focus": "Instrumentation, experimental systems, and lab mentorship.",
                    "email": "marcus.liu@ufl.edu",
                    "linkedin_url": "https://www.linkedin.com/in/marcus-liu-uf",
                    "image_url": "https://placehold.co/400x400/14182A/F8FAFC?text=ML"
                }
            ]
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
            "description": "Contribute to a live faculty-led project connected to generative models and data workflows.",
            "summary": "Open position in a faculty-led lab.",
            "professor": "Dr. Maya Alvarez",
            "professor_id": "mal-p1",
            "tags": ["AI", "ML", "Python"],
            "contact": "smith@example.edu",
            "url": "https://example.com/ml-job",
            "deadline": "2026-05-01",
            "hourly_commitment": "8-10 hrs/week",
            "pay": "$16-18/hr",
            "goal_tags": ["research", "career"]
        },
        {
            "building_id": str(building_ids["Malachowsky Hall"]),
            "type": "job",
            "title": "Cybersecurity Intern",
            "description": "Help secure campus infrastructure and participate in security operations workflows.",
            "summary": "Hands-on systems and security role.",
            "professor": "Prof. Jordan Patel",
            "professor_id": "mal-p2",
            "tags": ["Security", "Linux"],
            "contact": "hr@example.edu",
            "hourly_commitment": "10-12 hrs/week",
            "pay": "$18/hr",
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["Malachowsky Hall"]),
            "type": "event",
            "title": "Open Lab Night",
            "description": "A guided walk-through of spaces, mentors, and tools inside the building.",
            "summary": "Guided event for students exploring the space.",
            "professor": "Prof. Jordan Patel",
            "professor_id": "mal-p2",
            "tags": ["Community", "Labs"],
            "hourly_commitment": "One evening",
            "pay": "N/A",
            "goal_tags": ["career", "research", "social_support"]
        },
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
            "type": "course",
            "title": "Advanced Quantum Mechanics",
            "description": "In-depth study of quantum field theory and advanced modeling techniques.",
            "summary": "Advanced course for physics pathway students.",
            "professor": "Dr. Elena Sato",
            "professor_id": "npb-p1",
            "tags": ["Quantum", "Physics"],
            "deadline": "2026-08-20",
            "hourly_commitment": "4 hrs class + study",
            "pay": "N/A",
            "goal_tags": ["academic_aid", "research"]
        },
        {
            "building_id": str(building_ids["New Physics Building"]),
            "type": "research",
            "title": "Applied AI Pathway",
            "description": "A curated sequence of people, skills, and opportunities that helps students move toward applied research.",
            "summary": "Structured path for student researchers.",
            "professor": "Dr. Elena Sato",
            "professor_id": "npb-p1",
            "tags": ["Research", "Data"],
            "hourly_commitment": "6-8 hrs/week",
            "pay": "$15/hr if funded",
            "goal_tags": ["research", "career"]
        },
        {
            "building_id": str(building_ids["New Physics Building"]),
            "type": "event",
            "title": "Physics Lab Open House",
            "description": "Explore experimental setups, meet faculty, and learn about lab opportunities.",
            "summary": "Open-house event for new researchers.",
            "professor": "Prof. Marcus Liu",
            "professor_id": "npb-p2",
            "tags": ["Labs", "Physics"],
            "hourly_commitment": "One evening",
            "pay": "N/A",
            "goal_tags": ["research", "academic_aid"]
        }
    ]

    for o in opportunities_data:
        await opportunities_collection.insert_one(o)
        print(f"Inserted: {o['title']}")

    print(f"\nSummary: {len(buildings_data)} buildings and {len(opportunities_data)} opportunities inserted.")

if __name__ == "__main__":
    asyncio.run(main())
