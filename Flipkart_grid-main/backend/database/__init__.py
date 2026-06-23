"""
backend/database.py — Optional PostgreSQL (Supabase/Neon) layer (Pillar 1).

Activates ONLY when DATABASE_URL is set and SQLAlchemy is installed; otherwise
DB_ENABLED is False and the app runs purely in-memory. Nothing here can break
boot — every DB call site should check `DB_ENABLED` first.

    DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/postgres
"""
from __future__ import annotations

import os

DATABASE_URL = os.environ.get("DATABASE_URL", "")

DB_ENABLED = False
engine = None
SessionLocal = None
Base = None

if DATABASE_URL:
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import declarative_base, sessionmaker

        engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
        SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
        Base = declarative_base()
        DB_ENABLED = True
        print("[db] PostgreSQL enabled")
    except Exception as exc:  # noqa: BLE001
        print(f"[db] DATABASE_URL set but SQLAlchemy unavailable ({exc}); running in-memory")
else:
    try:
        from sqlalchemy.orm import declarative_base

        Base = declarative_base()  # so models.py can import a Base even when disabled
    except Exception:  # noqa: BLE001
        Base = None


def init_db() -> bool:
    """Create tables if the DB is enabled. Safe no-op otherwise."""
    if not DB_ENABLED:
        return False
    from database import models  # noqa: F401

    Base.metadata.create_all(engine)
    return True


def get_session():
    """Yield a session (FastAPI dependency style). Returns None if disabled."""
    if not DB_ENABLED:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
