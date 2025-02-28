from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin, TokenData
from jwt import PyJWTError
from datetime import timedelta
from app.core.security import *





def get_db():
    db = SessionLocal()
    try:                
        yield db
    finally:
        db.close()



#async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):
#    print(f"Received token: {token}")
#    credentials_exception = HTTPException(
#        status_code=status.HTTP_401_UNAUTHORIZED,
#        detail="Could not validate credentials",
#        headers={"WWW-Authenticate": "Bearer"},
#    )
#    try:
#        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#        email: str = payload.get("sub")
#        if email is None:
#            raise credentials_exception
#        token_data = TokenData(username=email)
#    except PyJWTError:
#        raise credentials_exception
#
#    user = get_user(token_data.username, db)  # Teraz poprawne argumenty
#    if user is None:
#        raise credentials_exception
#    return user
def get_user(username: str, db: Session):
    """Pobiera użytkownika na podstawie adresu e-mail"""
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(username, db)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


