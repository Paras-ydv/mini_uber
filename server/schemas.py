from pydantic import BaseModel

class RideRequest(BaseModel):
    user_id: int
    start: str
    destination: str

class RideResponse(BaseModel):
    id: int
    user_id: int
    start: str
    destination: str
    status: str

    class Config:
        orm_mode = True
