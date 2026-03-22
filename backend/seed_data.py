import pymongo
import bson

def seed():
    client = pymongo.MongoClient('mongodb://localhost:27017')
    db = client['campuslens']
    
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
        }
    ]
    db.buildings.insert_many(buildings)
    
    # 3. Add Opportunities
    opps = [
        # ML Path
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
            "tags": ["NLP", "AI", "Software"],
            "goal_tags": ["career", "research"]
        },
        # HCI Path
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
        # Software Engineering Path
        {
            "building_id": "bldg_cse",
            "type": "job",
            "title": "Optima Lab Associate",
            "description": "Optimize high-performance computing clusters for engineering teams.",
            "tags": ["Software", "C++", "Performance", "Optimization"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_cse",
            "type": "job",
            "title": "Software Engineering TA",
            "description": "Mentor undergraduates in data structures and algorithm design.",
            "tags": ["Software", "Java", "Teaching", "Algorithms"],
            "goal_tags": ["career"]
        },
        # Networking / Systems
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
            "tags": ["Robotics", "Embedded", "C", "Software"],
            "goal_tags": ["career"]
        },
        # General tech
        {
            "building_id": "bldg_innovation",
            "type": "job",
            "title": "Full Stack Intern (Innovation Hub)",
            "description": "Build web applications for the newest campus startups.",
            "tags": ["Software", "Web", "JavaScript", "SQL"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_innovation",
            "type": "job",
            "title": "BoA Technology Analyst",
            "description": "Analyze technical debt and optimize enterprise banking systems.",
            "tags": ["Software", "Banking", "Java", "SQL"],
            "goal_tags": ["career"]
        },
        {
            "building_id": "bldg_innovation",
            "type": "job",
            "title": "Blockchain Protocol Intern",
            "description": "Research layer 2 scaling solutions for Ethereum.",
            "tags": ["Blockchain", "Web3", "Solidity"],
            "goal_tags": ["career", "research"]
        }
    ]
    db.opportunities.insert_many(opps)
    print("Seeding successful!")

if __name__ == "__main__":
    seed()
