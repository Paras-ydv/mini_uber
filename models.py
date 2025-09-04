# models.py
from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, func
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

# Enum for ride status
class StatusEnum(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    completed = "completed"

# Ride Queue table
class RideQueue(Base):
    __tablename__ = "ride_queue"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    start_location = Column(String(100), nullable=False)
    dest_location = Column(String(100), nullable=False)
    status = Column(Enum(StatusEnum), default=StatusEnum.pending, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
