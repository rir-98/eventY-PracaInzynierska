from sqlalchemy.orm import Session, joinedload
from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate
from app.models.friend import FriendRequest
from app.schemas.friends import FriendRequestCreate
from app.models.trip_details import TripDetails
from app.schemas.trip_details import TripDetailsCreate, TripDetailsUpdate
from app.models.event import Event
from app.models.trip_details import TripDetails


#Event CRUD
def create_event(db: Session, event_data: EventCreate, organizer_id: int):
    new_event = Event(**event_data.dict(), organizer_id=organizer_id)
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

def get_event(db: Session, event_id: int):
    return db.query(Event).filter(Event.id == event_id).first()

def get_events(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Event).offset(skip).limit(limit).all()

def is_event_organizer(db: Session, event_id: int, user_id: int) -> bool:
    event = db.query(Event).filter(Event.id == event_id).first()
    return event and event.organizer_id == user_id

def update_event(db: Session, event_id: int, event_data: EventUpdate, user_id: int):
    if not is_event_organizer(db, event_id, user_id):
        raise Exception("Tylko organizator może edytować to wydarzenie.")
    event = get_event(db, event_id)
    if not event:
        return None
    for key, value in event_data.dict(exclude_unset=True).items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event

def delete_event(db: Session, event_id: int, user_id: int):
    if not is_event_organizer(db, event_id, user_id):
        raise Exception("Tylko organizator może usunąć to wydarzenie.")
    event = get_event(db, event_id)
    if not event:
        return None
    # Usuwanie powiązanych TripDetails
    trip_details = db.query(TripDetails).filter(TripDetails.event_id == event_id).first()
    if trip_details:
        db.delete(trip_details)
    db.delete(event)
    db.commit()
    return event
#End CRUD

def leave_event(db: Session, event_id: int, user_id: int):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise Exception("Wydarzenie nie istnieje.")
    
    # Sprawdzenie, czy użytkownik jest uczestnikiem (ale nie organizatorem)
    if event.organizer_id == user_id:
        raise Exception("Organizator nie może opuścić wydarzenia.")
    
    # Sprawdzenie, czy użytkownik jest uczestnikiem
    if user_id not in [participant.id for participant in event.participants]:
        raise Exception("Użytkownik nie jest uczestnikiem tego wydarzenia.")
    
    # Usunięcie użytkownika z listy uczestników
    event.participants = [p for p in event.participants if p.id != user_id]
    
    db.commit()
    db.refresh(event)
    return event

# TripDetails CRUD
def get_or_create_tripDetails(db: Session, event_id: int):
    tripDetails = db.query(TripDetails).filter(TripDetails.event_id == event_id).options(joinedload(TripDetails.event)).first()
    
    if not tripDetails:
        # Automatycznie tworzymy pusty TripDetails dla eventu
        tripDetails = TripDetails(event_id=event_id, plan="", budget=0)
        db.add(tripDetails)
        db.commit()
        db.refresh(tripDetails)
    
    return tripDetails

def update_tripDetails(db: Session, event_id: int, tripDetails_data: TripDetailsUpdate):
    tripDetails = get_or_create_tripDetails(db, event_id)
    for key, value in tripDetails_data.dict(exclude_unset=True).items():
        setattr(tripDetails, key, value)
    db.commit()
    db.refresh(tripDetails)
    return tripDetails

def delete_tripDetails(db: Session, event_id: int):
    tripDetails = db.query(TripDetails).filter(TripDetails.event_id == event_id).first()
    if not tripDetails:
        return None
    db.delete(tripDetails)
    db.commit()
    return tripDetails

# Wysłanie zaproszenia do znajomych
def send_friend_request(db: Session, sender_id: int, receiver_id: int):
    new_request = FriendRequest(sender_id=sender_id, receiver_id=receiver_id)
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

# Pobranie zaproszeń dla użytkownika
def get_friend_requests(db: Session, user_id: int):
    return db.query(FriendRequest).filter(
        (FriendRequest.receiver_id == user_id) | (FriendRequest.sender_id == user_id)
    ).all()

# Akceptacja zaproszenia
def accept_friend_request(db: Session, request_id: int):
    request = db.query(FriendRequest).filter(FriendRequest.id == request_id).first()
    if request:
        request.status = 'accepted'
        db.commit()
        db.refresh(request)
    return request

# Odrzucenie zaproszenia
def reject_friend_request(db: Session, request_id: int):
    request = db.query(FriendRequest).filter(FriendRequest.id == request_id).first()
    if request:
        request.status = 'rejected'
        db.commit()
        db.refresh(request)
    return request

# Lista znajomych
def get_friends_list(db: Session, user_id: int):
    return db.query(FriendRequest).filter(
        ((FriendRequest.sender_id == user_id) | (FriendRequest.receiver_id == user_id)) &
        (FriendRequest.status == 'accepted')
    ).all()

# Usuwanie znajomego
def remove_friend(db: Session, user_id: int, friend_id: int):
    friendship = db.query(FriendRequest).filter(
        ((FriendRequest.sender_id == user_id) & (FriendRequest.receiver_id == friend_id)) |
        ((FriendRequest.sender_id == friend_id) & (FriendRequest.receiver_id == user_id)),
        FriendRequest.status == 'accepted'
    ).first()

    if friendship:
        db.delete(friendship)
        db.commit()
    return friendship



def user_belongs_to_trip(db: Session, trip_details_id: int, user_id: int) -> bool:
    trip_details = db.query(TripDetails).filter(TripDetails.id == trip_details_id).first()
    if not trip_details:
        return False
    
    event = db.query(Event).filter(Event.id == trip_details.event_id).first()
    if not event:
        return False
    
    # Sprawdź, czy użytkownik jest organizatorem
    if event.organizer_id == user_id:
        return True

    # Sprawdź, czy użytkownik jest uczestnikiem wydarzenia
    for participant in event.participants:
        if participant.id == user_id:
            return True
    
    return False
