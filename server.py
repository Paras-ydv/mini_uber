# server/main.py
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from db import SessionLocal, engine
import models

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency for DB session
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
    ride = models.RideQueue(user_id=user_id, start_location=start, dest_location=destination)
    db.add(ride)
    db.commit()
    db.refresh(ride)
    return {"message": "Ride added to queue 🚖", "ride_id": ride.id, "status": ride.status}

@app.put("/update-ride/{ride_id}")
def update_ride(ride_id: int, status: models.StatusEnum, db: Session = Depends(get_db)):
    ride = db.query(models.RideQueue).filter(models.RideQueue.id == ride_id).first()
    if not ride:
        return {"error": "Ride not found"}
    ride.status = status
    db.commit()
    return {"message": f"Ride {ride_id} marked as {status}"}

@app.get("/next-ride")
def next_ride(db: Session = Depends(get_db)):
    ride = db.query(models.RideQueue).filter(models.RideQueue.status == models.StatusEnum.pending).order_by(models.RideQueue.id).first()
    if not ride:
        return {"message": "No pending rides"}
    return {
        "ride_id": ride.id,
        "user_id": ride.user_id,
        "start": ride.start_location,
        "destination": ride.dest_location
    }
