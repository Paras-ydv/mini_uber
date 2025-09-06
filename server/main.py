from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from . import models
from .db import SessionLocal, engine

# create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def home():
    return {"message": "🚖 Welcome to Mini-Uber Backend"}

@app.get("/queue")
def get_queue(db: Session = Depends(get_db)):
    return db.query(models.RideQueue).order_by(models.RideQueue.id).all()

@app.post("/book-ride")
def book_ride(user_id: int, start: str, destination: str, db: Session = Depends(get_db)):
    ride = models.RideQueue(user_id=user_id, start=start, destination=destination)
    db.add(ride)
    db.commit()
    db.refresh(ride)
    return {"message": "Ride added to queue 🚖", "ride_id": ride.id, "status": ride.status}

@app.get("/next-ride")
def next_ride(db: Session = Depends(get_db)):
    ride = db.query(models.RideQueue).filter(models.RideQueue.status == "pending").order_by(models.RideQueue.id).first()
    if not ride:
        return {"message": "No pending rides"}
    return {"ride_id": ride.id, "user_id": ride.user_id, "start": ride.start, "destination": ride.destination}
