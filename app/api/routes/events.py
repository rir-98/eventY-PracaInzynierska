from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session, joinedload
from app.database import SessionLocal
from app.models.event import Event, event_users
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app.crud import create_event, get_event, get_events, update_event, delete_event, leave_event
from app.api.routes.users import get_current_user
from app.models.user import User
#from app.api.routes.dependencies import get_current_user
from app.core.security import *
from typing import Union


router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=EventResponse)
def create_event_api(event_data: EventCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    event = create_event(db, event_data, user.id)

    db.execute(event_users.insert().values(event_id=event.id, user_id=user.id))
    db.commit()
    
    return event

@router.get("/{event_id}", response_model=EventResponse)
def get_event_api(event_id: int, db: Session = Depends(get_db)):
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event

@router.get("/", response_model=list[EventResponse])
def get_events_api(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_events(db, skip, limit)

@router.get("/all/{event_id}", response_model=Union[EventResponse, list[EventResponse]])
def get_event_api(event_id: Union[int, str], db: Session = Depends(get_db), user=Depends(get_current_user)):
    if event_id == "all":
        # Pobranie wszystkich wydarzeń + tych, w których użytkownik uczestniczy
        all_events = get_events(db, 0, 100)
        user_events = db.query(Event).join(event_users).filter(event_users.c.user_id == user.id).all()
        
        # Usunięcie duplikatów
        unique_events = {event.id: event for event in all_events + user_events}.values()

        # Konwersja do formatu Pydantic
        return [EventResponse.from_orm(event) for event in unique_events]
    
    # Pobranie pojedynczego eventu
    try:
        event_id = int(event_id)  # Konwersja stringa na int (jeśli możliwe)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event_id format")

    event = get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    return EventResponse.from_orm(event)


@router.put("/{event_id}", response_model=EventResponse)
def update_event_api(event_id: int, event_data: EventUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    event = update_event(db, event_id, event_data)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if event.organizer_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not the organizer of this event")
    return event

@router.delete("/{event_id}") 
def delete_event_api(event_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if event.organizer_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not the organizer of this event")
    delete_event(db, event_id, user.id)  # Przekazujemy user.id jako user_id
    return {"detail": "Event deleted successfully"}



@router.get("/my-events/", response_model=list[EventResponse])
def get_user_events_api(db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_events = (
        db.query(Event)
        .join(event_users, Event.id == event_users.c.event_id)
        .filter(event_users.c.user_id == user.id)
        .options(joinedload(Event.participants))  # Pobieramy uczestników wydarzenia
        .all()
    )
    return user_events  # FastAPI automatycznie zwróci je w odpowiednim formacie

@router.get("/events/{event_id}/users", response_model=list[dict])
def get_users_in_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    print("Event found:", event.id, event.name)
    print("Participants:", event.participants)

    return [{"id": user.id, "username": user.username, "email": user.email} for user in event.participants]