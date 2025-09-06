from sqlalchemy import Column, Integer, String, TIMESTAMP
from sqlalchemy.sql import func
from .db import Base   # ✅ relative import

class RideQueue(Base):
    __tablename__ = "ride_queue"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    start = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(TIMESTAMP, server_default=func.now())
