from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from app.schemas.user import UserResponse

class EventBase(BaseModel):
    name: str
    location: str
    description: Optional[str]
    start_date: datetime
    end_date: datetime

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    name: Optional[str]
    location: Optional[str]
    descripton: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]

""" class EventResponse(EventBase):
    id: int
    organizer_id: int
    participants: List[int] = [] """

class EventResponse(BaseModel):
    id: int
    name: str
    location: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    participants: List[UserResponse] = []

    class Config:
        from_attributes = True
