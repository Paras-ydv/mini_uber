from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

# Hardcoded locations (IDs mapped to names)
LOCATIONS = {
    1: "Jayanagar",
    2: "Indiranagar",
    3: "Koramangala",
    4: "Whitefield",
    5: "MG Road"
}

# Request body for ride booking
class RideRequest(BaseModel):
    start: int
    destination: int

@app.get("/")
def home():
    return {"message": "Welcome to Mini-Uber Backend 🚖"}

@app.get("/locations")
def get_locations():
    return LOCATIONS

@app.post("/book-ride")
def book_ride(request: RideRequest):
    # Validate locations
    if request.start not in LOCATIONS:
        raise HTTPException(status_code=400, detail="Invalid start location ID")
    if request.destination not in LOCATIONS:
        raise HTTPException(status_code=400, detail="Invalid destination location ID")
    if request.start == request.destination:
        raise HTTPException(status_code=400, detail="Start and destination cannot be the same")

    # Simple fare calculation
    fare = abs(request.destination - request.start) * 50

    return {
        "message": "Ride booked successfully 🎉",
        "from": LOCATIONS[request.start],
        "to": LOCATIONS[request.destination],
        "fare": f"₹{fare}"
    }
