from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .db import Base
from datetime import datetime

class RideQueue(Base):
    __tablename__ = "ride_queue"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    start = Column(String)
    destination = Column(String)
    status = Column(String, default="pending")
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)

    driver = relationship("Driver", back_populates="rides")

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    location = Column(String)
    status = Column(String, default="offline")  # offline, online, on_trip
    last_seen = Column(DateTime, default=datetime.utcnow)

    rides = relationship("RideQueue", back_populates="driver")
