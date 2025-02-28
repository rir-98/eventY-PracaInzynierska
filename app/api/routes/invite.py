from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.models.invitationCode import InvitationCode
from app.models.event import Event
from datetime import datetime, timedelta
from app.api.routes.users import get_current_user
from app.models.event import event_users, Event
from app.models.user import User
from app.database import SessionLocal



router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def delete_expired_invites(db: Session):
    now_utc = datetime.utcnow()
    db.query(InvitationCode).filter(InvitationCode.expires_at < now_utc).delete()
    db.commit()
    

@router.post("/invite/events/{event_id}/generate-invite")
def generate_invite(event_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    event = db.query(Event).filter(Event.id == event_id, Event.organizer_id == user_id.id).first()
    if not event:
        raise HTTPException(status_code=403, detail="Nie jesteś organizatorem tego wydarzenia")

    invite = InvitationCode(event_id=event_id)
    invite.expires_at = datetime.utcnow() + timedelta(hours=1)
    db.add(invite)
    db.commit()
    db.refresh(invite)

    background_tasks.add_task(delete_expired_invites, db)
    return {"code": invite.code, "expires_at": invite.expires_at}


@router.get("/invite/events/join/{code}")
def join_event(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invite = db.query(InvitationCode).filter(InvitationCode.code == code).first()

    if not invite:
        raise HTTPException(status_code=400, detail="Kod nieprawidłowy lub wygasł")
    elif invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Kod wygasł")

    # Sprawdzenie, czy użytkownik już dołączył do wydarzenia
    existing_entry = db.execute(
        event_users.select().where(
            (event_users.c.event_id == invite.event_id) & 
            (event_users.c.user_id == current_user.id)
        )
    ).fetchone()

    if existing_entry:
        raise HTTPException(status_code=400, detail="Użytkownik już dołączył do wydarzenia")

    # Dodanie użytkownika do wydarzenia
    db.execute(event_users.insert().values(event_id=invite.event_id, user_id=current_user.id))
    db.commit()
    
    return {"event_id": invite.event_id, "message": "Dołączono do wydarzenia"}

@router.post("/invite/events/{event_id}/leave")
def leave_event(event_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Sprawdzamy, czy użytkownik jest uczestnikiem wydarzenia w tabeli event_users
    existing_entry = db.execute(
        event_users.select().where(
            event_users.c.event_id == event.id,
            event_users.c.user_id == current_user.id
        )
    ).fetchone()

    if not existing_entry:
        raise HTTPException(status_code=400, detail="You are not in this event")

    # Usuwamy użytkownika z listy uczestników
    db.execute(event_users.delete().where(event_users.c.event_id == event.id).where(event_users.c.user_id == current_user.id))
    db.commit()

    # Odświeżamy obiekt event, aby mieć pewność, że lista uczestników jest zaktualizowana
    db.refresh(event)

    # Można też pobrać ponownie z bazy danych, by mieć najnowszą wersję obiektu
    event = db.query(Event).filter(Event.id == event_id).first()

    return {"message": "You have left the event"}
