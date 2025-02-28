from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta    
import uuid

from app.database import Base

class InvitationCode(Base):
    __tablename__ = 'invitation_codes'

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, index=True, unique=True, default=lambda: str(uuid.uuid4())[:8])
    event_id = Column(Integer, ForeignKey('events.id'))
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow())
    expires_at = Column(DateTime, nullable=False, default=datetime.utcnow() + timedelta(minutes=5))

    event = relationship("Event", back_populates="invitation_codes")