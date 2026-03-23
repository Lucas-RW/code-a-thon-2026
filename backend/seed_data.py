import pymongo
import bson
import os

def seed():
    # Read from environment or .env file
    try:
        from dotenv import load_dotenv
        env_path = os.path.join(os.path.dirname(__file__), "backend", ".env")
        if not os.path.exists(env_path):
            env_path = os.path.join(os.path.dirname(__file__), ".env")
        load_dotenv(env_path)
    except ImportError:
        pass  # dotenv not installed, rely on env vars

    mongo_uri = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.environ.get("MONGODB_DB_NAME", "campuslens")
    
    print(f"Connecting to: {mongo_uri[:40]}...")
    client = pymongo.MongoClient(mongo_uri)
    db = client[db_name]
    
    # 1. Clear existing to start fresh and avoid duplicates for this test
    db.opportunities.delete_many({})
    db.buildings.delete_many({})
    
    # 2. Add Buildings
    buildings = [
        {
            "_id": "bldg_malachowsky",
            "name": "Malachowsky Hall",
            "short_name": "MAL",
            "lat": 28.348632, "lng": -81.237896,
            "departments": ["Computer Science", "Electrical Engineering"],
            "description": "UF's state-of-the-art AI and Data Science hub.",
            "source": "manual"
        },
        {
            "_id": "bldg_cse",
            "name": "CSE Building",
            "short_name": "CSE",
            "lat": 29.6481, "lng": -82.3440,
            "departments": ["Computer Science", "Information Systems"],
            "description": "Main hub for Computer Science and Engineering courses.",
            "source": "manual"
        },
        {
            "_id": "bldg_innovation",
            "name": "UF Innovation Square",
            "short_name": "INV",
            "lat": 29.6515, "lng": -82.3270,
            "departments": ["Entrepreneurship", "Tech Transfer"],
            "description": "Collaborative space for startups and research spin-offs.",
            "source": "manual"
        },
        {
            "_id": "bldg_neb",
            "name": "New Engineering Building",
            "short_name": "NEB",
            "lat": 29.6435, "lng": -82.3475,
            "departments": ["Precision Engineering", "Robotics"],
            "description": "Focuses on advanced prototyping and robotics research.",
            "source": "manual"
        },
        {
            "_id": "bldg_digital",
            "name": "Digital Worlds Institute",
            "short_name": "DW",
            "lat": 29.6515, "lng": -82.3275,
            "departments": ["Digital Media", "HCI"],
            "description": "Multidisciplinary research in AR/VR and interaction design.",
            "source": "manual"
        },
        # ── Career Hub ──
        {
            "_id": "bldg_reitz",
            "name": "Reitz Union",
            "short_name": "REITZ",
            "lat": 29.6462, "lng": -82.3479,
            "departments": ["Student Affairs", "Career Connections Center"],
            "description": "Central hub for student life, career services, and campus-wide events.",
            "source": "manual"
        },
        # ── Business ──
        {
            "_id": "bldg_warrington",
            "name": "Warrington College of Business",
            "short_name": "WCB",
            "lat": 29.6509, "lng": -82.3408,
            "departments": ["Finance", "Marketing", "Management", "Information Systems"],
            "description": "UF's top-ranked business school housing finance, marketing, and entrepreneurship programs.",
            "source": "manual"
        },
        # ── Liberal Arts ──
        {
            "_id": "bldg_turlington",
            "name": "Turlington Hall",
            "short_name": "TUR",
            "lat": 29.6494, "lng": -82.3439,
            "departments": ["English", "History", "Philosophy", "Political Science"],
            "description": "Home to the College of Liberal Arts and Sciences humanities departments.",
            "source": "manual"
        },
    ]
    db.buildings.insert_many(buildings)
    
    # 3. Add Opportunities
    opps = [
        # ═══════════════════════════════════════════════════════════════════
        #  ML / AI  (Malachowsky Hall)
        # ═══════════════════════════════════════════════════════════════════
        {
            "building_id": "bldg_malachowsky",
            "type": "course",
            "title": "CAP 6610: Machine Learning",
            "description": "Graduate level foundation for ML algorithms and neural networks.",
            "tags": ["AI", "ML", "Python", "Research"],
            "goal_tags": ["career", "research"]
        },
        {
            "building_id": "bldg_malachowsky",
            "type": "research",
            "title": "AI Research Assistant",
            "description": "Work on deep learning models for medical image analysis.",
            "tags": ["AI", "ML", "Research", "PyTorch"],
            "goal_tags": ["research"]
        },
        {
            "building_id": "bldg_malachowsky",
            "type": "job",
            "title": "NLP Lab Associate",
            "description": "Assist in building large language models for campus-wide insights.",
            "tags": ["NLP", "AI", "Software Engineering"],
            "goal_tags": ["career", "research"]
        },

        # ═══════════════════════════════════════════════════════════════════
        #  HCI / Digital Media  (Digital Worlds Institute)
        # ═══════════════════════════════════════════════════════════════════
        {
            "building_id": "bldg_digital",
            "type": "job",
            "title": "HCI Immersive Lab Assistant",
            "description": "Develop VR interfaces for educational simulators.",
            "tags": ["HCI", "Unity", "UI/UX", "Research"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_digital",
            "type": "research",
            "title": "VR Discovery Fellow",
            "description": "Investigate spatial audio in augmented reality environments.",
            "tags": ["VR", "AR", "Research", "Audio"],
            "goal_tags": ["research"]
        },

        # ═══════════════════════════════════════════════════════════════════
        #  Software Engineering / Systems  (CSE Building)
        # ═══════════════════════════════════════════════════════════════════
        {
            "building_id": "bldg_cse",
            "type": "job",
            "title": "Optima Lab Associate",
            "description": "Optimize high-performance computing clusters for engineering teams.",
            "tags": ["Software Engineering", "C++", "Performance", "Optimization"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_cse",
            "type": "job",
            "title": "Software Engineering TA",
            "description": "Mentor undergraduates in data structures, algorithm design, and software engineering principles.",
            "tags": ["Software Engineering", "Java", "Teaching", "Algorithms", "Data Structures"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_cse",
            "type": "job",
            "title": "Open Source Developer – GatorOS Project",
            "description": "Contribute to an open-source operating system project. Write kernel modules, debug system calls, and collaborate via Git.",
            "tags": ["Software Engineering", "C", "Linux", "Git", "Open Source"],
            "goal_tags": ["career"]
        },

        # ═══════════════════════════════════════════════════════════════════
        #  Robotics / Security  (New Engineering Building)
        # ═══════════════════════════════════════════════════════════════════
        {
            "building_id": "bldg_neb",
            "type": "research",
            "title": "Cybersecurity Research Assistant",
            "description": "Analyzing edge device vulnerabilities in smart city grids.",
            "tags": ["Security", "Systems", "Networking"],
            "goal_tags": ["research"]
        },
        {
            "building_id": "bldg_neb",
            "type": "job",
            "title": "Robotics Prototype Developer",
            "description": "Build firmware for autonomous delivery rovers.",
            "tags": ["Robotics", "Embedded", "C", "Software Engineering"],
            "goal_tags": ["career"]
        },

        # ═══════════════════════════════════════════════════════════════════
        #  Industry / Startups  (Innovation Square)
        # ═══════════════════════════════════════════════════════════════════
        {
            "building_id": "bldg_innovation",
            "type": "job",
            "title": "Full Stack Intern (Innovation Hub)",
            "description": "Build web applications for the newest campus startups. Work with React, Node.js, and PostgreSQL in an agile team.",
            "tags": ["Software Engineering", "Web", "JavaScript", "React", "SQL"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_innovation",
            "type": "job",
            "title": "Software Engineer Intern – GatorTech Startup",
            "description": "Join a 4-person engineering team building a SaaS product from scratch. Design APIs, write tests, and ship production code weekly.",
            "tags": ["Software Engineering", "Python", "REST API", "Docker", "Agile"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_innovation",
            "type": "job",
            "title": "Mobile App Developer – Campus Delivery App",
            "description": "Build and maintain a React Native mobile app used by 5,000+ students. Implement features, fix bugs, and optimize performance.",
            "tags": ["Software Engineering", "React Native", "Mobile", "JavaScript", "TypeScript"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_innovation",
            "type": "job",
            "title": "DevOps Intern – Cloud Infrastructure",
            "description": "Manage CI/CD pipelines, containerize services with Docker, and monitor AWS infrastructure for a growing campus startup.",
            "tags": ["DevOps", "AWS", "Docker", "CI/CD", "Software Engineering"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_innovation",
            "type": "job",
            "title": "BoA Technology Analyst",
            "description": "Analyze technical debt and optimize enterprise banking systems.",
            "tags": ["Software Engineering", "Banking", "Java", "SQL"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_innovation",
            "type": "job",
            "title": "Blockchain Protocol Intern",
            "description": "Research layer 2 scaling solutions for Ethereum.",
            "tags": ["Blockchain", "Web3", "Solidity"],
            "goal_tags": ["career", "research"]
        },

        # ═══════════════════════════════════════════════════════════════════
        #  Career Hub  (Reitz Union)
        # ═══════════════════════════════════════════════════════════════════
        {
            "building_id": "bldg_reitz",
            "type": "event",
            "title": "UF Career Showcase – Engineering & Tech",
            "description": "UF's largest career fair for engineering and tech students. Meet recruiters from Google, Amazon, Microsoft, JPMorgan, and 100+ companies. Bring resumes and dress professionally.",
            "tags": ["Career Fair", "Networking", "Software Engineering", "Internship", "Resume"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_reitz",
            "type": "event",
            "title": "Tech Interview Prep Workshop",
            "description": "Practice coding interviews with industry mentors. Covers data structures, algorithms, system design, and behavioral questions. Hosted by UF ACM.",
            "tags": ["Interview Prep", "Algorithms", "Data Structures", "Software Engineering", "LeetCode"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_reitz",
            "type": "event",
            "title": "Google Software Engineering Info Session",
            "description": "Learn about Google's internship and new-grad SWE programs. Engineers share their experience, project culture, and application tips.",
            "tags": ["Software Engineering", "Google", "Internship", "Industry"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_reitz",
            "type": "student_org",
            "title": "Society of Software Engineers",
            "description": "Student-run org focused on software engineering skills. Weekly coding workshops, hackathons, mock interviews, and industry speaker panels.",
            "tags": ["Software Engineering", "Hackathon", "Coding", "Professional Development"],
            "goal_tags": ["career", "social_support"]
        },
        {
            "building_id": "bldg_reitz",
            "type": "event",
            "title": "Resume & LinkedIn Workshop",
            "description": "Career Connections Center workshop on crafting technical resumes and optimizing your LinkedIn profile for software roles.",
            "tags": ["Resume", "LinkedIn", "Professional Development", "Career"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_reitz",
            "type": "student_org",
            "title": "UF Open Source Club",
            "description": "Contribute to real open-source projects, learn Git workflow, and build a public portfolio. Great for aspiring software engineers.",
            "tags": ["Open Source", "Git", "Software Engineering", "Portfolio"],
            "goal_tags": ["career"]
        },

        # ═══════════════════════════════════════════════════════════════════
        #  Business  (Warrington) — deliberately NON-CS for filtering tests
        # ═══════════════════════════════════════════════════════════════════
        {
            "building_id": "bldg_warrington",
            "type": "student_org",
            "title": "Finance & Investment Club",
            "description": "Manage a student-run portfolio, attend Wall Street speaker events, and prepare for finance internships.",
            "tags": ["Finance", "Investment", "Wall Street", "Portfolio Management"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_warrington",
            "type": "event",
            "title": "Marketing Analytics Case Competition",
            "description": "Team-based competition analyzing consumer data for a real brand partner. Prizes for top-performing teams.",
            "tags": ["Marketing", "Analytics", "Case Competition", "Branding"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_warrington",
            "type": "course",
            "title": "GEB 3373: International Business",
            "description": "Study global trade, cross-cultural management, and international supply chain dynamics.",
            "tags": ["International Business", "Trade", "Supply Chain", "Management"],
            "goal_tags": ["academic_aid"]
        },

        # ═══════════════════════════════════════════════════════════════════
        #  Liberal Arts  (Turlington) — deliberately NON-CS for filtering tests
        # ═══════════════════════════════════════════════════════════════════
        {
            "building_id": "bldg_turlington",
            "type": "student_org",
            "title": "Model United Nations",
            "description": "Debate global policy, practice diplomacy, and compete at national Model UN conferences.",
            "tags": ["Public Speaking", "Debate", "Diplomacy", "Political Science"],
            "goal_tags": ["social_support"]
        },
        {
            "building_id": "bldg_turlington",
            "type": "event",
            "title": "Creative Writing Workshop Series",
            "description": "Weekly workshop for fiction, poetry, and creative nonfiction. Open to all majors, led by English department faculty.",
            "tags": ["Creative Writing", "Fiction", "Poetry", "English"],
            "goal_tags": ["social_support"]
        },
        {
            "building_id": "bldg_turlington",
            "type": "research",
            "title": "Historical Archives Digitization Project",
            "description": "Help digitize and catalog UF's historical archives. Learn archival methods and metadata standards.",
            "tags": ["History", "Archives", "Digitization", "Humanities"],
            "goal_tags": ["research", "academic_aid"]
        },
    ]
    db.opportunities.insert_many(opps)
    print("Seeding successful!")

if __name__ == "__main__":
    seed()
