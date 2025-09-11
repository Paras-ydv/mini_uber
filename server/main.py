from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import threading, time
from . import models, schemas
from .db import SessionLocal, engine

# create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# ✅ CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",  
        "http://192.168.0.106:8000",  
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------ DRIVERS ------------------

@app.post("/register-driver")
def register_driver(name: str, location: str, db: Session = Depends(get_db)):
    driver = models.Driver(name=name, location=location, status="offline", last_seen=datetime.utcnow())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return {"message": "Driver registered 🚖", "driver_id": driver.id}

@app.post("/go-online")
def go_online(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        return {"error": "Driver not found"}
    driver.status = "online"
    driver.last_seen = datetime.utcnow()
    db.commit()
    assign_pending_rides(db)
    return {"message": f"Driver {driver.name} is now online ✅"}

@app.post("/go-offline")
def go_offline(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        return {"error": "Driver not found"}
    driver.status = "offline"
    db.commit()
    return {"message": f"Driver {driver.name} is now offline ❌"}

@app.post("/heartbeat")
def heartbeat(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
    if not driver:
        return {"error": "Driver not found"}
    driver.last_seen = datetime.utcnow()
    db.commit()
    return {"message": "Driver is alive"}

@app.get("/available-drivers")
def available_drivers(db: Session = Depends(get_db)):
    return db.query(models.Driver).filter(models.Driver.status == "online").all()

# ------------------ RIDES ------------------

@app.get("/")
def home():
    return {"message": "🚖 Welcome to Mini-Uber Backend"}

@app.get("/queue")
def get_queue(db: Session = Depends(get_db)):
    """Returns all rides in queue (pending, assigned, completed)."""
    return db.query(models.RideQueue).order_by(models.RideQueue.id).all()

@app.post("/book-ride")
def book_ride(ride: schemas.RideCreate, db: Session = Depends(get_db)):
    user_id = ride.user_id
    start = ride.start
    destination = ride.destination

    driver = db.query(models.Driver).filter(models.Driver.status == "online").first()
    
    if driver:
        status = "assigned"
        driver.status = "on_trip"
        assigned_driver_id = driver.id
    else:
        status = "pending"
        assigned_driver_id = None

    ride_db = models.RideQueue(
        user_id=user_id,
        start=start,
        destination=destination,
        status=status,
        driver_id=assigned_driver_id
    )
    db.add(ride_db)
    db.commit()
    db.refresh(ride_db)

    # Trip simulation if assigned
    if driver:
        import threading, time
        def finish_trip(driver_id, ride_id, duration=1):
            time.sleep(duration * 60)
            driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
            ride_db = db.query(models.RideQueue).filter(models.RideQueue.id == ride_id).first()
            if driver and ride_db:
                driver.status = "online"
                ride_db.status = "completed"
                db.commit()
                assign_pending_rides(db)

        threading.Thread(target=finish_trip, args=(driver.id, ride_db.id)).start()

    return {"message": "Ride booked 🚖", "ride_id": ride_db.id, "driver": driver.name if driver else None}

# ------------------ HELPER ------------------

def assign_pending_rides(db: Session):
    """Assign pending rides to available drivers."""
    pending_rides = db.query(models.RideQueue).filter(models.RideQueue.status == "pending").all()
    for ride in pending_rides:
        driver = db.query(models.Driver).filter(models.Driver.status == "online").first()
        if driver:
            ride.driver_id = driver.id
            ride.status = "assigned"
            driver.status = "on_trip"
            db.commit()

            def finish_trip(driver_id, ride_id, duration=1):
                time.sleep(duration * 60)
                driver = db.query(models.Driver).filter(models.Driver.id == driver_id).first()
                ride = db.query(models.RideQueue).filter(models.RideQueue.id == ride_id).first()
                if driver and ride:
                    driver.status = "online"
                    ride.status = "completed"
                    db.commit()
                    assign_pending_rides(db)

            threading.Thread(target=finish_trip, args=(driver.id, ride.id)).start()
