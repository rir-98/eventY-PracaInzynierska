from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import users, events, invite
import app.models
from app.database import Base, engine
from app.api.routes import trip_details
from app.api.routes import friends

app = FastAPI(title="EventY API")

origins = [
    "https://ririt.org",
    "https://www.ririt.org"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

app.include_router(users.router, tags=["Users"])
app.include_router(events.router, prefix="/events", tags=["Events"])
app.include_router(invite.router, prefix="/invite", tags=["Invite"])
app.include_router(trip_details.router, prefix="/trip_details", tags=["TripDetails"])
app.include_router(friends.router, prefix="/friends", tags=["Friends"])





@app.on_event("startup")
async def startup_event():
    routes = [route.path for route in app.router.routes]
    print("Dostępne endpointy:", routes)







      