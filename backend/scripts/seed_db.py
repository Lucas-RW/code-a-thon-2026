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

    # ═══════════════════════════════════════════════════════════════════════
    #  BUILDINGS
    # ═══════════════════════════════════════════════════════════════════════
    print("Seeding buildings...")
    buildings_data = [
        # ── Malachowsky Hall (from scripts) ──
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
            "description": "Malachowsky Hall for Data Science & Information Technology at the University of Florida is a multidisciplinary research and teaching facility that serves as the university's central hub for artificial intelligence, data science, and advanced computing innovation. Opened in 2023 and named after NVIDIA co-founder Chris Malachowsky, the building was designed to unite computing, engineering, medicine, and health sciences in a single collaborative environment.",
            "image_url": "https://www.eng.ufl.edu/wp-content/uploads/2023/10/malachowsky-exterior.jpg",
            "professors": MALACHOWSKY_CISE_DIRECTORY
        },
        # ── Reitz Union (from scripts) ──
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
        # ── New Physics Building (from scripts) ──
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
        },
        # ── CSE Building (from seed_data) ──
        {
            "name": "CSE Building",
            "short_name": "CSE",
            "lat": 29.6481,
            "lng": -82.3440,
            "departments": ["Computer Science", "Information Systems"],
            "description": "Main hub for Computer Science and Engineering courses.",
            "image_url": "https://www.mainstreetdailynews.com/wp-content/uploads/2022/08/UF-Department-of-Computer-Information-Science-Engineering-CISE-building.jpg",
            "source": "manual"
        },
        # ── UF Innovation Square (from seed_data) ──
        {
            "name": "UF Innovation Square",
            "short_name": "INV",
            "lat": 29.6515,
            "lng": -82.3270,
            "departments": ["Entrepreneurship", "Tech Transfer"],
            "description": "Collaborative space for startups and research spin-offs.",
            "image_url": "https://innovationdistrictgainesville.com/storage/spaces/8/uf-innovate-hub.jpg",
            "source": "manual"
        },
        # ── New Engineering Building (from seed_data) ──
        {
            "name": "New Engineering Building",
            "short_name": "NEB",
            "lat": 29.6435,
            "lng": -82.3475,
            "departments": ["Precision Engineering", "Robotics"],
            "description": "Focuses on advanced prototyping and robotics research.",
            "image_url": "https://www.eng.ufl.edu/news/wp-content/uploads/sites/249/2021/10/hero-hwlee.jpg",
            "source": "manual"
        },
        # ── Digital Worlds Institute (from seed_data) ──
        {
            "name": "Digital Worlds Institute",
            "short_name": "DW",
            "lat": 29.6515,
            "lng": -82.3275,
            "departments": ["Digital Media", "HCI"],
            "description": "Multidisciplinary research in AR/VR and interaction design.",
            "image_url": "https://digitalworlds.ufl.edu/app/uploads/2025/08/1W5A0796-scaled.jpg",
            "source": "manual"
        },
        # ── Warrington College of Business (from seed_data) ──
        {
            "name": "Warrington College of Business",
            "short_name": "WCB",
            "lat": 29.6509,
            "lng": -82.3408,
            "departments": ["Finance", "Marketing", "Management", "Information Systems"],
            "description": "UF's top-ranked business school housing finance, marketing, and entrepreneurship programs.",
            "image_url": "https://v9d5g3j5.delivery.rocketcdn.me/wp-content/uploads/2021/07/College-of-Business_resize-scaled-1.jpg",
            "source": "manual"
        },
        # ── Turlington Hall (from seed_data) ──
        {
            "name": "Turlington Hall",
            "short_name": "TUR",
            "lat": 29.6494,
            "lng": -82.3439,
            "departments": ["English", "History", "Philosophy", "Political Science"],
            "description": "Home to the College of Liberal Arts and Sciences humanities departments.",
            "source": "manual"
        },
    ]

    building_ids = {}
    for b in buildings_data:
        result = await buildings_collection.insert_one(b)
        building_ids[b["name"]] = result.inserted_id
        print(f"Inserted building: {b['name']} ({result.inserted_id})")

    # ═══════════════════════════════════════════════════════════════════════
    #  OPPORTUNITIES
    # ═══════════════════════════════════════════════════════════════════════
    print("\nSeeding opportunities...")
    opportunities_data = [
        # ─────────────────────────────────────────────────────────────────
        #  Malachowsky Hall — imported data (from scripts)
        # ─────────────────────────────────────────────────────────────────
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
        # ─────────────────────────────────────────────────────────────────
        #  Malachowsky Hall — additional entries (from seed_data)
        # ─────────────────────────────────────────────────────────────────
        {
            "building_id": str(building_ids["Malachowsky Hall"]),
            "type": "course",
            "title": "CAP 6610: Machine Learning",
            "description": "Graduate level foundation for ML algorithms and neural networks.",
            "tags": ["AI", "ML", "Python", "Research"],
            "goal_tags": ["career", "research"]
        },
        {
            "building_id": str(building_ids["Malachowsky Hall"]),
            "type": "research",
            "title": "AI Research Assistant",
            "description": "Work on deep learning models for medical image analysis.",
            "tags": ["AI", "ML", "Research", "PyTorch"],
            "goal_tags": ["research"]
        },
        {
            "building_id": str(building_ids["Malachowsky Hall"]),
            "type": "job",
            "title": "NLP Lab Associate",
            "description": "Assist in building large language models for campus-wide insights.",
            "tags": ["NLP", "AI", "Software Engineering"],
            "goal_tags": ["career", "research"]
        },

        # ─────────────────────────────────────────────────────────────────
        #  Reitz Union — imported data (from scripts)
        # ─────────────────────────────────────────────────────────────────
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
        # ─────────────────────────────────────────────────────────────────
        #  Reitz Union — additional entries (from seed_data)
        # ─────────────────────────────────────────────────────────────────
        {
            "building_id": str(building_ids["Reitz Union"]),
            "type": "event",
            "title": "UF Career Showcase – Engineering & Tech",
            "description": "UF's largest career fair for engineering and tech students. Meet recruiters from Google, Amazon, Microsoft, JPMorgan, and 100+ companies. Bring resumes and dress professionally.",
            "tags": ["Career Fair", "Networking", "Software Engineering", "Internship", "Resume"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["Reitz Union"]),
            "type": "event",
            "title": "Tech Interview Prep Workshop",
            "description": "Practice coding interviews with industry mentors. Covers data structures, algorithms, system design, and behavioral questions. Hosted by UF ACM.",
            "tags": ["Interview Prep", "Algorithms", "Data Structures", "Software Engineering", "LeetCode"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["Reitz Union"]),
            "type": "event",
            "title": "Google Software Engineering Info Session",
            "description": "Learn about Google's internship and new-grad SWE programs. Engineers share their experience, project culture, and application tips.",
            "tags": ["Software Engineering", "Google", "Internship", "Industry"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["Reitz Union"]),
            "type": "student_org",
            "title": "Society of Software Engineers",
            "description": "Student-run org focused on software engineering skills. Weekly coding workshops, hackathons, mock interviews, and industry speaker panels.",
            "tags": ["Software Engineering", "Hackathon", "Coding", "Professional Development"],
            "goal_tags": ["career", "social_support"]
        },
        {
            "building_id": str(building_ids["Reitz Union"]),
            "type": "event",
            "title": "Resume & LinkedIn Workshop",
            "description": "Career Connections Center workshop on crafting technical resumes and optimizing your LinkedIn profile for software roles.",
            "tags": ["Resume", "LinkedIn", "Professional Development", "Career"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["Reitz Union"]),
            "type": "student_org",
            "title": "UF Open Source Club",
            "description": "Contribute to real open-source projects, learn Git workflow, and build a public portfolio. Great for aspiring software engineers.",
            "tags": ["Open Source", "Git", "Software Engineering", "Portfolio"],
            "goal_tags": ["career"]
        },

        # ─────────────────────────────────────────────────────────────────
        #  New Physics Building — imported data (from scripts)
        # ─────────────────────────────────────────────────────────────────
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

        # ─────────────────────────────────────────────────────────────────
        #  Digital Worlds Institute — HCI / Digital Media (from seed_data)
        # ─────────────────────────────────────────────────────────────────
        {
            "building_id": str(building_ids["Digital Worlds Institute"]),
            "type": "job",
            "title": "HCI Immersive Lab Assistant",
            "description": "Develop VR interfaces for educational simulators.",
            "tags": ["HCI", "Unity", "UI/UX", "Research"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["Digital Worlds Institute"]),
            "type": "research",
            "title": "VR Discovery Fellow",
            "description": "Investigate spatial audio in augmented reality environments.",
            "tags": ["VR", "AR", "Research", "Audio"],
            "goal_tags": ["research"]
        },

        # ─────────────────────────────────────────────────────────────────
        #  CSE Building — Software Engineering / Systems (from seed_data)
        # ─────────────────────────────────────────────────────────────────
        {
            "building_id": str(building_ids["CSE Building"]),
            "type": "job",
            "title": "Optima Lab Associate",
            "description": "Optimize high-performance computing clusters for engineering teams.",
            "tags": ["Software Engineering", "C++", "Performance", "Optimization"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["CSE Building"]),
            "type": "job",
            "title": "Software Engineering TA",
            "description": "Mentor undergraduates in data structures, algorithm design, and software engineering principles.",
            "tags": ["Software Engineering", "Java", "Teaching", "Algorithms", "Data Structures"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["CSE Building"]),
            "type": "job",
            "title": "Open Source Developer – GatorOS Project",
            "description": "Contribute to an open-source operating system project. Write kernel modules, debug system calls, and collaborate via Git.",
            "tags": ["Software Engineering", "C", "Linux", "Git", "Open Source"],
            "goal_tags": ["career"]
        },

        # ─────────────────────────────────────────────────────────────────
        #  New Engineering Building — Robotics / Security (from seed_data)
        # ─────────────────────────────────────────────────────────────────
        {
            "building_id": str(building_ids["New Engineering Building"]),
            "type": "research",
            "title": "Cybersecurity Research Assistant",
            "description": "Analyzing edge device vulnerabilities in smart city grids.",
            "tags": ["Security", "Systems", "Networking"],
            "goal_tags": ["research"]
        },
        {
            "building_id": str(building_ids["New Engineering Building"]),
            "type": "job",
            "title": "Robotics Prototype Developer",
            "description": "Build firmware for autonomous delivery rovers.",
            "tags": ["Robotics", "Embedded", "C", "Software Engineering"],
            "goal_tags": ["career"]
        },

        # ─────────────────────────────────────────────────────────────────
        #  UF Innovation Square — Industry / Startups (from seed_data)
        # ─────────────────────────────────────────────────────────────────
        {
            "building_id": str(building_ids["UF Innovation Square"]),
            "type": "job",
            "title": "Full Stack Intern (Innovation Hub)",
            "description": "Build web applications for the newest campus startups. Work with React, Node.js, and PostgreSQL in an agile team.",
            "tags": ["Software Engineering", "Web", "JavaScript", "React", "SQL"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["UF Innovation Square"]),
            "type": "job",
            "title": "Software Engineer Intern – GatorTech Startup",
            "description": "Join a 4-person engineering team building a SaaS product from scratch. Design APIs, write tests, and ship production code weekly.",
            "tags": ["Software Engineering", "Python", "REST API", "Docker", "Agile"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["UF Innovation Square"]),
            "type": "job",
            "title": "Mobile App Developer – Campus Delivery App",
            "description": "Build and maintain a React Native mobile app used by 5,000+ students. Implement features, fix bugs, and optimize performance.",
            "tags": ["Software Engineering", "React Native", "Mobile", "JavaScript", "TypeScript"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["UF Innovation Square"]),
            "type": "job",
            "title": "DevOps Intern – Cloud Infrastructure",
            "description": "Manage CI/CD pipelines, containerize services with Docker, and monitor AWS infrastructure for a growing campus startup.",
            "tags": ["DevOps", "AWS", "Docker", "CI/CD", "Software Engineering"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["UF Innovation Square"]),
            "type": "job",
            "title": "BoA Technology Analyst",
            "description": "Analyze technical debt and optimize enterprise banking systems.",
            "tags": ["Software Engineering", "Banking", "Java", "SQL"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["UF Innovation Square"]),
            "type": "job",
            "title": "Blockchain Protocol Intern",
            "description": "Research layer 2 scaling solutions for Ethereum.",
            "tags": ["Blockchain", "Web3", "Solidity"],
            "goal_tags": ["career", "research"]
        },

        # ─────────────────────────────────────────────────────────────────
        #  Warrington College of Business (from seed_data)
        # ─────────────────────────────────────────────────────────────────
        {
            "building_id": str(building_ids["Warrington College of Business"]),
            "type": "student_org",
            "title": "Finance & Investment Club",
            "description": "Manage a student-run portfolio, attend Wall Street speaker events, and prepare for finance internships.",
            "tags": ["Finance", "Investment", "Wall Street", "Portfolio Management"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["Warrington College of Business"]),
            "type": "event",
            "title": "Marketing Analytics Case Competition",
            "description": "Team-based competition analyzing consumer data for a real brand partner. Prizes for top-performing teams.",
            "tags": ["Marketing", "Analytics", "Case Competition", "Branding"],
            "goal_tags": ["career"]
        },
        {
            "building_id": str(building_ids["Warrington College of Business"]),
            "type": "course",
            "title": "GEB 3373: International Business",
            "description": "Study global trade, cross-cultural management, and international supply chain dynamics.",
            "tags": ["International Business", "Trade", "Supply Chain", "Management"],
            "goal_tags": ["academic_aid"]
        },

        # ─────────────────────────────────────────────────────────────────
        #  Turlington Hall — Liberal Arts (from seed_data)
        # ─────────────────────────────────────────────────────────────────
        {
            "building_id": str(building_ids["Turlington Hall"]),
            "type": "student_org",
            "title": "Model United Nations",
            "description": "Debate global policy, practice diplomacy, and compete at national Model UN conferences.",
            "tags": ["Public Speaking", "Debate", "Diplomacy", "Political Science"],
            "goal_tags": ["social_support"]
        },
        {
            "building_id": str(building_ids["Turlington Hall"]),
            "type": "event",
            "title": "Creative Writing Workshop Series",
            "description": "Weekly workshop for fiction, poetry, and creative nonfiction. Open to all majors, led by English department faculty.",
            "tags": ["Creative Writing", "Fiction", "Poetry", "English"],
            "goal_tags": ["social_support"]
        },
        {
            "building_id": str(building_ids["Turlington Hall"]),
            "type": "research",
            "title": "Historical Archives Digitization Project",
            "description": "Help digitize and catalog UF's historical archives. Learn archival methods and metadata standards.",
            "tags": ["History", "Archives", "Digitization", "Humanities"],
            "goal_tags": ["research", "academic_aid"]
        },
    ]

    for o in opportunities_data:
        await opportunities_collection.insert_one(o)
        print(f"Inserted: {o['title']}")

    print(f"\nSummary: {len(buildings_data)} buildings and {len(opportunities_data)} opportunities inserted.")

if __name__ == "__main__":
    asyncio.run(main())
