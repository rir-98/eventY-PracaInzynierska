from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.trip_details import TripDetails
from app.schemas.trip_details import TripDetailsCreate, TripDetailsUpdate, TripDetailsResponse
import app.crud as crud

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{event_id}", response_model=TripDetailsResponse)
def get_tripDetails(event_id: int, db: Session = Depends(get_db)):
    # Sprawdzenie, czy event istnieje
    event = crud.get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Pobranie lub utworzenie TripDetails
    tripDetails = crud.get_or_create_tripDetails(db, event_id)
    
    return tripDetails

@router.put("/{event_id}", response_model=TripDetailsResponse)
def update_tripDetails(event_id: int, trip_details_data: TripDetailsUpdate, db: Session = Depends(get_db)):
    updated_trip_details = crud.update_tripDetails(db, event_id, trip_details_data)
    if not updated_trip_details:
        raise HTTPException(status_code=404, detail="TripDetails not found")
    return updated_trip_details

@router.delete("/{event_id}", response_model=TripDetailsResponse)
def delete_tripDetails(event_id: int, db: Session = Depends(get_db)):
    deleted_trip_details = crud.delete_tripDetails(db, event_id)
    if not deleted_trip_details:
        raise HTTPException(status_code=404, detail="TripDetails not found")
    return deleted_trip_details