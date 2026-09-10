from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from .database import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    rtsp_url = Column(String)
    location = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String, default="offline")
    created_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer)
    zone_id = Column(Integer, nullable=True)
    alert_type = Column(String) # e.g., intrusion, loitering
    severity = Column(String)   # CRITICAL, HIGH, MEDIUM, LOW
    timestamp = Column(DateTime, default=datetime.utcnow)
    snapshot_path = Column(String, nullable=True)
    clip_path = Column(String, nullable=True)
    metadata_json = Column(String, nullable=True)
    acknowledged = Column(Boolean, default=False)
