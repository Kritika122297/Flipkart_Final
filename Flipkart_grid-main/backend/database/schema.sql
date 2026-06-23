-- ============================================================================
--  ParkWatch AI — PostgreSQL schema (Supabase / Neon)   [Pillar 1]
--  Run:  psql "$DATABASE_URL" -f backend/db/schema.sql
-- ============================================================================

-- Optional: PostGIS for spatial queries (Supabase: enable in Database → Extensions)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ── 1. violations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS violations (
    id               BIGSERIAL PRIMARY KEY,
    police_station   TEXT,
    location         TEXT,
    latitude         DOUBLE PRECISION,
    longitude        DOUBLE PRECISION,
    vehicle_type     TEXT,
    violation_type   TEXT,
    junction_name    TEXT,
    created_datetime TIMESTAMPTZ,
    cis              REAL,
    epi              REAL
);
CREATE INDEX IF NOT EXISTS idx_violations_station   ON violations (police_station);
CREATE INDEX IF NOT EXISTS idx_violations_datetime  ON violations (created_datetime);
CREATE INDEX IF NOT EXISTS idx_violations_cis       ON violations (cis);
CREATE INDEX IF NOT EXISTS idx_violations_geo       ON violations (latitude, longitude);

-- ── 2. interaction_logs (adaptive agent memory) ─────────────────────────────
CREATE TABLE IF NOT EXISTS interaction_logs (
    id            BIGSERIAL PRIMARY KEY,
    session_id    TEXT NOT NULL,
    timestamp     TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_query    TEXT,
    ai_response   TEXT,
    tools_called  JSONB,
    user_feedback TEXT  -- like | dislike | rejection | correction
);
CREATE INDEX IF NOT EXISTS idx_logs_session ON interaction_logs (session_id, timestamp DESC);

-- ── 3. patrol_dispatches ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patrol_dispatches (
    id          BIGSERIAL PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    truck       TEXT,
    stations    JSONB,   -- ordered list of station names
    path        JSONB,   -- [[lat, lon], ...]
    distance_km REAL,
    eta_min     INTEGER
);
CREATE INDEX IF NOT EXISTS idx_dispatches_created ON patrol_dispatches (created_at DESC);
