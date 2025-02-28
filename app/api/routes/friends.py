from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
import app.crud as crud
from app.schemas.friends import FriendRequestCreate, FriendRequestResponse



router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Wysłanie zaproszenia do znajomych
@router.post("/", response_model=FriendRequestResponse)
def create_friend_request(request: FriendRequestCreate, db: Session = Depends(get_db)):
    if request.sender_id == request.receiver_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nie możesz wysłać zaproszenia do siebie!")
    
    return crud.send_friend_request(db=db, sender_id=request.sender_id, receiver_id=request.receiver_id)

# Pobranie wszystkich zaproszeń (wysłanych i otrzymanych)
@router.get("/", response_model=list[FriendRequestResponse])
def read_friend_requests(user_id: int, db: Session = Depends(get_db)):
    return crud.get_friend_requests(db=db, user_id=user_id)

# Akceptacja zaproszenia
@router.post("/{request_id}/accept", response_model=FriendRequestResponse)
def accept_request(request_id: int, db: Session = Depends(get_db)):
    return crud.accept_friend_request(db=db, request_id=request_id)

# Odrzucenie zaproszenia
@router.post("/{request_id}/reject", response_model=FriendRequestResponse)
def reject_request(request_id: int, db: Session = Depends(get_db)):
    return crud.reject_friend_request(db=db, request_id=request_id)

# Lista znajomych
@router.get("/list", response_model=list[FriendRequestResponse])
def read_friends_list(user_id: int, db: Session = Depends(get_db)):
    friends = crud.get_friends_list(db=db, user_id=user_id)
    return friends

# Usuwanie znajomego
@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_friend(friend_id: int, user_id: int, db: Session = Depends(get_db)):
    deleted = crud.remove_friend(db=db, user_id=user_id, friend_id=friend_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Znajomy nie znaleziony")
    return {"detail": "Znajomy usunięty"}