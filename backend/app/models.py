from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

GoalType = Literal["career", "research", "academic_aid", "social_support"]


class Building(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    short_name: str
    lat: float
    lng: float
    departments: List[str]
    description: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        populate_by_name = True

class Opportunity(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    building_id: str
    type: str  # "student_org" | "research" | "job" | "course" | "event"
    title: str
    description: Optional[str] = None
    professor: Optional[str] = None
    tags: List[str] = []
    contact: Optional[str] = None
    url: Optional[str] = None
    deadline: Optional[str] = None
    goal_tags: Optional[List[GoalType]] = None

    class Config:
        populate_by_name = True

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str = ""
    year: Optional[str] = None  # "Freshman | Sophomore | Junior | Senior | Grad"
    major: str = ""
    is_first_gen: bool = False
    is_transfer: bool = False
    goals: List[str] = []
    goal_preferences: Dict[str, Any] = {}
    interested_opportunities: List[str] = []
    skill_graph: Dict[str, Any] = {"nodes": [], "edges": []}
    network_graph: Dict[str, Any] = {"nodes": [], "edges": []}

    class Config:
        populate_by_name = True


# ── Auth schemas ─────────────────────────────────────────────────────────────

class UserAuth(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: str
    hashed_password: str
    profile_id: str  # Link to the User profile document
    created_at: Any
    last_login_at: Optional[Any] = None

    class Config:
        populate_by_name = True

class AuthRegister(BaseModel):
    email: str
    password: str

class AuthLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


# ── Request schemas for API endpoints ────────────────────────────────────────

class UserUpdate(BaseModel):
    """Payload for updating a user profile."""
    name: Optional[str] = None
    year: Optional[str] = None
    major: Optional[str] = None
    is_first_gen: Optional[bool] = None
    is_transfer: Optional[bool] = None
    goals: Optional[List[GoalType]] = None
    goal_preferences: Optional[Dict[str, Any]] = None


class InterestRequest(BaseModel):
    """Payload for POST /interest — toggles opportunity interest."""
    opportunity_id: str
    interested: bool


# ── Pathfinding schemas ──────────────────────────────────────────────────────

class PathfindRequest(BaseModel):
    goal_type: GoalType
    goal_text: Optional[str] = None

class PathStep(BaseModel):
    order: int
    goal_type: GoalType
    building_id: str
    building_name: str
    opportunity_id: str
    opportunity_title: str
    short_reason: Optional[str] = None
    skills: List[str] = []
    skill_node_ids: Optional[List[str]] = None
    network_node_ids: Optional[List[str]] = None
    cta_label: Optional[str] = None
    cta_url: Optional[str] = None

class PathfindResponse(BaseModel):
    steps: List[PathStep]
