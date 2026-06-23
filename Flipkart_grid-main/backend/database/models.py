"""
backend/models.py — SQLAlchemy ORM models (Pillar 1).

Mirrors backend/db/schema.sql. Imported lazily by database.init_db(); only
materialises when SQLAlchemy + Base are available.
"""
from __future__ import annotations

from database import Base

if Base is not None:
    from sqlalchemy import (
        Column,
        DateTime,
        Float,
        Integer,
        String,
        Text,
        JSON,
        func,
    )

    class Violation(Base):
        __tablename__ = "violations"
        id = Column(Integer, primary_key=True, autoincrement=True)
        police_station = Column(String(160), index=True)
        location = Column(String(256))
        latitude = Column(Float)
        longitude = Column(Float)
        vehicle_type = Column(String(80))
        violation_type = Column(Text)
        junction_name = Column(String(160))
        created_datetime = Column(DateTime, index=True)
        cis = Column(Float, index=True)
        epi = Column(Float)

    class InteractionLog(Base):
        __tablename__ = "interaction_logs"
        id = Column(Integer, primary_key=True, autoincrement=True)
        session_id = Column(String(80), index=True)
        timestamp = Column(DateTime, server_default=func.now())
        user_query = Column(Text)
        ai_response = Column(Text)
        tools_called = Column(JSON)
        user_feedback = Column(String(40))  # like | dislike | rejection | correction

    class PatrolDispatch(Base):
        __tablename__ = "patrol_dispatches"
        id = Column(Integer, primary_key=True, autoincrement=True)
        created_at = Column(DateTime, server_default=func.now())
        truck = Column(String(80))
        stations = Column(JSON)       # ordered list of station names
        path = Column(JSON)           # [[lat, lon], ...]
        distance_km = Column(Float)
        eta_min = Column(Integer)
else:  # SQLAlchemy not installed — placeholders so imports never crash
    Violation = InteractionLog = PatrolDispatch = None  # type: ignore
