from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


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

    class Config:
        populate_by_name = True

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    clerk_user_id: str
    name: str
    major: str
    year: str
    interests: List[str] = []
    interested_opportunities: List[str] = []
    skill_graph: Dict[str, Any] = {}
    network_graph: Dict[str, Any] = {}

    class Config:
        populate_by_name = True


# ── Request schemas for API endpoints ────────────────────────────────────────

class UserCreateOrUpdate(BaseModel):
    """Payload for POST /users — upserts a user profile."""
    clerk_user_id: str
    name: str
    major: str
    year: str
    interests: List[str] = []


class InterestRequest(BaseModel):
    """Payload for POST /interest — toggles opportunity interest."""
    clerk_user_id: str
    opportunity_id: str
    interested: bool
