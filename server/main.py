from fastapi import FastAPI, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import threading, time, subprocess, json

from db import SessionLocal, engine
import models, schemas

# Create tables
models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# ✅ CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Port management for ride containers
USED_PORTS = set()
BASE_PORT = 7000

def get_next_available_port():
    """Get the next available port starting from 7000"""
    import socket
    port = BASE_PORT
    while True:
        if port not in USED_PORTS:
            # Check if port is actually free
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(('', port))
                USED_PORTS.add(port)
                return port
            except OSError:
                pass  # Port is busy, try next
        port += 1

def release_port(port):
    """Release a port when ride is completed"""
    USED_PORTS.discard(port)

def create_ride_container(ride_id, port):
    """Create a Docker container for a specific ride"""
    try:
        container_name = f"ride-{ride_id}"
        
        # Remove existing container if it exists
        subprocess.run(["docker", "rm", "-f", container_name], capture_output=True)
        
        # Get the absolute path to the ride interface
        import os
        current_dir = os.path.dirname(os.path.abspath(__file__))
        ride_interface_path = os.path.join(os.path.dirname(current_dir), "ride-interface")
        
        # Create a container with nginx serving our ride interface
        cmd = [
            "docker", "run", "-d",
            "--name", container_name,
            "-p", f"{port}:80",
            "-v", f"{ride_interface_path}:/usr/share/nginx/html:ro",
            "-e", f"RIDE_ID={ride_id}",
            "-e", f"PORT={port}",
            "nginx:alpine"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Created ride container {container_name} on port {port}")
            print(f"🌐 Ride interface available at: http://localhost:{port}")
            return True
        else:
            print(f"❌ Failed to create container: {result.stderr}")
            release_port(port)
            return False
            
    except Exception as e:
        print(f"❌ Error creating container: {e}")
        release_port(port)
        return False

def remove_ride_container(ride_id, port):
    """Remove Docker container when ride is completed"""
    try:
        container_name = f"ride-{ride_id}"
        
        # Stop and remove container
        subprocess.run(["docker", "stop", container_name], capture_output=True)
        subprocess.run(["docker", "rm", container_name], capture_output=True)
        
        release_port(port)
        print(f"🗑️ Removed ride container {container_name} from port {port}")
        
    except Exception as e:
        print(f"❌ Error removing container: {e}")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------ USERS ------------------

@app.post("/register-user")
def register_user(name: str, email: str, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        return {"message": "User already exists", "user_id": existing.id}
    user = models.User(name=name, email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User registered 👤", "user_id": user.id}


# ------------------ DRIVERS ------------------

@app.post("/register-driver")
def register_driver(name: str, email: str, location: str, db: Session = Depends(get_db)):
    existing = db.query(models.Driver).filter(models.Driver.email == email).first()
    if existing:
        existing.status = "offline"
        existing.last_seen = datetime.utcnow()
        db.commit()
        return {"message": "Driver already exists", "driver_id": existing.id}
    driver = models.Driver(name=name, email=email, location=location, status="offline", last_seen=datetime.utcnow())
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
    from datetime import timedelta
    
    # Mark drivers as offline if they haven't sent heartbeat in 10 seconds
    timeout = datetime.utcnow() - timedelta(seconds=10)
    inactive_drivers = db.query(models.Driver).filter(
        models.Driver.status == "online",
        models.Driver.last_seen < timeout
    ).all()
    
    for driver in inactive_drivers:
        driver.status = "offline"
    db.commit()
    
    return db.query(models.Driver).filter(models.Driver.status == "online").all()


# ------------------ RIDES ------------------

@app.get("/")
def home():
    return {"message": "🚖 Welcome to Mini-Uber Backend"}


@app.get("/queue")
def get_queue(db: Session = Depends(get_db)):
    """Returns all rides in queue (pending, assigned, completed)."""
    return db.query(models.RideQueue).order_by(models.RideQueue.id).all()

@app.get("/ride/{ride_id}")
def get_ride(ride_id: int, db: Session = Depends(get_db)):
    """Get ride details by ID"""
    ride = db.query(models.RideQueue).filter(models.RideQueue.id == ride_id).first()
    if not ride:
        return {"error": "Ride not found"}
    
    user = db.query(models.User).filter(models.User.id == ride.user_id).first()
    driver = db.query(models.Driver).filter(models.Driver.id == ride.driver_id).first() if ride.driver_id else None
    
    return {
        "ride_id": ride.id,
        "user_name": user.name if user else "Unknown",
        "driver_name": driver.name if driver else "Not assigned",
        "start": ride.start,
        "destination": ride.destination,
        "status": ride.status
    }

@app.get("/ride-by-port/{port}")
def get_ride_by_port(port: int, db: Session = Depends(get_db)):
    """Get ride details by port number"""
    # Query for active rides (not completed) with this port
    ride = db.query(models.RideQueue).filter(
        models.RideQueue.port == port,
        models.RideQueue.status.in_(["pending", "assigned"])
    ).first()
    
    if not ride:
        return {"error": "Ride not found for this port"}
    
    user = db.query(models.User).filter(models.User.id == ride.user_id).first()
    driver = db.query(models.Driver).filter(models.Driver.id == ride.driver_id).first() if ride.driver_id else None
    
    print(f"📍 Fetching ride by port {port}: Ride ID={ride.id}, Container={ride.container_name}, User={user.name if user else 'Unknown'}, Driver={driver.name if driver else 'Not assigned'}")
    
    return {
        "ride_id": ride.id,
        "container_name": ride.container_name or f"ride-{ride.id}",
        "user_name": user.name if user else "Unknown",
        "driver_name": driver.name if driver else "Not assigned",
        "start": ride.start,
        "destination": ride.destination,
        "status": ride.status
    }

@app.get("/ride-containers")
def get_ride_containers():
    """Returns information about active ride containers"""
    try:
        # Get running containers with ride- prefix
        result = subprocess.run(
            ["docker", "ps", "--filter", "name=ride-", "--format", "json"],
            capture_output=True, text=True
        )
        
        if result.returncode == 0:
            containers = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    container_info = json.loads(line)
                    containers.append({
                        "name": container_info["Names"],
                        "ports": container_info["Ports"],
                        "status": container_info["Status"]
                    })
            return {"containers": containers, "used_ports": list(USED_PORTS)}
        else:
            return {"error": "Could not fetch containers", "containers": [], "used_ports": list(USED_PORTS)}
            
    except Exception as e:
        return {"error": str(e), "containers": [], "used_ports": list(USED_PORTS)}


@app.options("/book-ride")
def book_ride_options():
    return {"message": "OK"}

@app.post("/book-ride")
def book_ride(ride: schemas.RideCreate, response: Response, db: Session = Depends(get_db)):
    user_id = ride.user_id
    start = ride.start
    destination = ride.destination

    # Get next available port for this ride
    ride_port = get_next_available_port()
    
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
        driver_id=assigned_driver_id,
        port=ride_port
    )
    db.add(ride_db)
    db.commit()
    db.refresh(ride_db)
    
    # Set container name and update in DB
    container_name = f"ride-{ride_db.id}"
    ride_db.container_name = container_name
    db.commit()
    
    # Create Docker container for this ride
    container_created = create_ride_container(ride_db.id, ride_port)
    
    if not container_created:
        # If container creation fails, still proceed but log the error
        print(f"⚠️ Warning: Could not create container for ride {ride_db.id}")

    if driver:
        def finish_trip(driver_id, ride_id, ride_port, duration=1):
            time.sleep(duration * 60)
            
            # Get fresh DB session for the thread
            thread_db = SessionLocal()
            try:
                driver = thread_db.query(models.Driver).filter(models.Driver.id == driver_id).first()
                ride = thread_db.query(models.RideQueue).filter(models.RideQueue.id == ride_id).first()
                
                if driver and ride:
                    # Only set driver online if they were on_trip, not if they went offline
                    if driver.status == "on_trip":
                        driver.status = "online"
                    ride.status = "completed"
                    thread_db.commit()
                    
                    # Remove the ride container
                    remove_ride_container(ride_id, ride_port)
                    
                    assign_pending_rides(thread_db)
            finally:
                thread_db.close()

        threading.Thread(target=finish_trip, args=(driver.id, ride_db.id, ride_port, 1)).start()

    # Add explicit CORS headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    return {
        "message": "Ride booked 🚖", 
        "ride_id": ride_db.id,
        "user_id": user_id,
        "start": start,
        "destination": destination,
        "driver": driver.name if driver else None,
        "driver_id": driver.id if driver else None,
        "ride_port": ride_port,
        "ride_url": f"http://localhost:{ride_port}"
    }


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
            
            # Use existing port if already allocated, otherwise get new one
            if not ride.port:
                ride.port = get_next_available_port()
                ride.container_name = f"ride-{ride.id}"
                create_ride_container(ride.id, ride.port)
            
            ride_port = ride.port
            db.commit()

            def finish_trip(driver_id, ride_id, ride_port, duration=1):
                time.sleep(duration * 60)
                
                # Get fresh DB session for the thread
                thread_db = SessionLocal()
                try:
                    driver = thread_db.query(models.Driver).filter(models.Driver.id == driver_id).first()
                    ride = thread_db.query(models.RideQueue).filter(models.RideQueue.id == ride_id).first()
                    
                    if driver and ride:
                        # Only set driver online if they were on_trip, not if they went offline
                        if driver.status == "on_trip":
                            driver.status = "online"
                        ride.status = "completed"
                        thread_db.commit()
                        
                        # Remove the ride container
                        remove_ride_container(ride_id, ride_port)
                        
                        assign_pending_rides(thread_db)
                finally:
                    thread_db.close()

            threading.Thread(target=finish_trip, args=(driver.id, ride.id, ride_port, 1)).start()
