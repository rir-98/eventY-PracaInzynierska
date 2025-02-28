from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref
from app.database import Base
from datetime import datetime


class TripDetails(Base):
    __tablename__ = 'trip_details'

    #plan wycieczki, rzeczy do zabrania  i budzet
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey('events.id'), unique=True)
    plan = Column(String, index=True, nullable=False) # Opis planu wycieczki
    packing_list = Column(String, nullable=True) # Lista rzeczy do zabrania
    budget = Column(Float, nullable=True) # Budzet

    event = relationship("Event", back_populates="trip_details")
   
