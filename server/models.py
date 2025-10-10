from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    rides = relationship("RideQueue", back_populates="user")

class RideQueue(Base):
    __tablename__ = "ride_queue"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start = Column(String)
    destination = Column(String)
    status = Column(String, default="pending")
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    port = Column(Integer, nullable=True)
    container_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="rides")
    driver = relationship("Driver", back_populates="rides")

class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    location = Column(String)
    status = Column(String, default="offline")  # offline, online, on_trip
    last_seen = Column(DateTime, default=datetime.utcnow)

    rides = relationship("RideQueue", back_populates="driver")
