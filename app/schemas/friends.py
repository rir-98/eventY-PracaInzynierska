from pydantic import BaseModel
from datetime import datetime

class FriendRequestBase(BaseModel):
    sender_id: int
    receiver_id: int

class FriendRequestCreate(FriendRequestBase):
    pass

class FriendRequestResponse(FriendRequestBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        orm_mode = True