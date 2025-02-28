from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from app.schemas.event import EventResponse

class TripDetailsBase(BaseModel):
    plan: str
    packing_list: Optional[str] = None
    budget: Optional[float] = None    

class TripDetailsCreate(TripDetailsBase):
    event_id: int

class TripDetailsUpdate(BaseModel):
    name: Optional[str]
    location: Optional[str]
    description: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    plan: Optional[str]
    packing_list: Optional[str]
    budget: Optional[float]

class TripDetailsResponse(BaseModel):
    id: int
    event_id: int
    plan: str
    packing_list: Optional[str] = None
    budget: Optional[float] = None
    event: Optional[EventResponse] = None
    

    class Config:
        from_attributes = True