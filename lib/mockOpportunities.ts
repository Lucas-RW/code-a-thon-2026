export type OpportunityType =
  | "student_org"
  | "research"
  | "job"
  | "course"
  | "event"
  | "professor";

export interface Opportunity {
  id: string;
  buildingId: string;
  type: OpportunityType;
  title: string;
  description?: string;
  professor?: string | null;
  tags: string[];
  contact?: string | null;
  url?: string | null;
  deadline?: string | null;
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  // Malachowsky Hall (MAL)
  {
    id: "m1",
    buildingId: "Malachowsky Hall", // Using name as ID if backend IDs are not stable or known yet
    type: "research",
    title: "Machine Learning Research Assistant",
    description: "Research assistant role focusing on generative models and computer vision.",
    professor: "Dr. Smith",
    tags: ["AI", "ML", "Python"],
    contact: "smith@example.edu",
    deadline: "2026-05-01"
  },
  {
    id: "m2",
    buildingId: "Malachowsky Hall",
    type: "job",
    title: "Cybersecurity Intern",
    description: "Help secure campus infrastructure and participate in threat hunting exercises.",
    tags: ["Security", "Linux", "Networking"],
    contact: "hr@example.edu"
  },
  {
    id: "m3",
    buildingId: "Malachowsky Hall",
    type: "professor",
    title: "Dr. Jane Chen",
    description: "Lead Researcher in Robotics and Human-Computer Interaction.",
    professor: "Dr. Jane Chen",
    tags: ["Robotics", "HCI"],
    contact: "jchen@example.edu"
  },
  {
    id: "m4",
    buildingId: "Malachowsky Hall",
    type: "course",
    title: "CAP4630: Intro to AI",
    description: "Foundational course covering search, logic, and neural networks.",
    professor: "Dr. Miller",
    tags: ["AI", "Core"],
    deadline: "2026-08-20"
  },

  // Reitz Union (REITZ)
  {
    id: "r1",
    buildingId: "Reitz Union",
    type: "student_org",
    title: "Hackathon Club",
    description: "Weekly workshops and project hacking sessions for all skill levels.",
    tags: ["Coding", "Community", "Workshops"],
    contact: "hack@example.edu"
  },
  {
    id: "r2",
    buildingId: "Reitz Union",
    type: "event",
    title: "Career Fair Spring 2026",
    description: "Connect with over 200 employers looking for interns and full-time hires.",
    tags: ["Career", "Networking"],
    deadline: "2026-03-25"
  },
  {
    id: "r3",
    buildingId: "Reitz Union",
    type: "student_org",
    title: "Student Government",
    description: "Get involved in campus leadership and represent your fellow students.",
    tags: ["Leadership", "Advocacy"],
    contact: "sg@example.edu"
  },

  // New Physics Building (NPB)
  {
    id: "n1",
    buildingId: "New Physics Building",
    type: "course",
    title: "PHY4604: Quantum Mechanics II",
    description: "In-depth study of quantum field theory and advanced perturbations.",
    professor: "Dr. Einstein",
    tags: ["Quantum", "Physics", "Advanced"],
    deadline: "2026-08-20"
  },
  {
    id: "n2",
    buildingId: "New Physics Building",
    type: "research",
    title: "Astrophysics Lab Assistant",
    description: "Work with data from the James Webb Space Telescope to model stellar evolution.",
    professor: "Dr. Sagan",
    tags: ["Space", "Data Analysis", "Python"],
    contact: "sagan@example.edu"
  }
];

// Note: In the real app, buildingId would be the MongoDB ObjectId string.
// For mock purposes, we'll try to match by name or common ID strings.
export function getMockOpportunitiesForBuilding(buildingId: string): Opportunity[] {
  return MOCK_OPPORTUNITIES.filter(opt => 
    opt.buildingId === buildingId || 
    buildingId.toLowerCase().includes(opt.buildingId.toLowerCase()) ||
    opt.buildingId.toLowerCase().includes(buildingId.toLowerCase())
  );
}
