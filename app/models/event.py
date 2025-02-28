from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref
from app.database import Base
from datetime import datetime

event_users = Table(
    'event_users',
    Base.metadata,
    Column('event_id', Integer, ForeignKey('events.id'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
)

class Event(Base):
    __tablename__ = 'events'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    location = Column(String, nullable=False) #miasto/miejscowosc
    description = Column(String, nullable=True)
    start_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    organizer_id = Column(Integer, ForeignKey('users.id'))

    organizer = relationship("User", back_populates="organized_events")
    participants = relationship("User", secondary=event_users, back_populates="joined_events")  
    invitation_codes = relationship("InvitationCode", back_populates="event", cascade="all, delete-orphan")
    trip_details = relationship("TripDetails", back_populates="event", uselist=False)

   