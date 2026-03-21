-- ============================================================
-- DisasterGuard — Supabase Schema

-- ============================================================

-- 1. disaster_events: raw data from weather API + risk classification
CREATE TABLE IF NOT EXISTS disaster_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source          TEXT NOT NULL DEFAULT 'weather_api',
  region          TEXT NOT NULL,
  city            TEXT NOT NULL,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  event_type      TEXT NOT NULL,
  temperature     DOUBLE PRECISION,
  wind_speed      DOUBLE PRECISION,
  humidity        INTEGER,
  description     TEXT,
  risk_score      DOUBLE PRECISION DEFAULT 0.2,
  severity        TEXT NOT NULL DEFAULT 'LOW',
  raw_data        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. alerts: generated from disaster_events when severity >= MEDIUM
CREATE TABLE IF NOT EXISTS alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID REFERENCES disaster_events(id) ON DELETE CASCADE,
  region              TEXT NOT NULL,
  city                TEXT NOT NULL,
  severity            TEXT NOT NULL,
  message             TEXT NOT NULL,
  shelter_id          UUID,
  shelter_name        TEXT,
  shelter_distance_km DOUBLE PRECISION,
  notified            BOOLEAN DEFAULT FALSE,
  resolved            BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. shelters: relief centers across India
CREATE TABLE IF NOT EXISTS shelters (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  region            TEXT NOT NULL,
  city              TEXT NOT NULL,
  latitude          DOUBLE PRECISION NOT NULL,
  longitude         DOUBLE PRECISION NOT NULL,
  capacity          INTEGER NOT NULL DEFAULT 500,
  current_occupancy INTEGER NOT NULL DEFAULT 0,
  contact_phone     TEXT,
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Seed shelters ───────────────────────────────────────────
INSERT INTO shelters (name, region, city, latitude, longitude, capacity, contact_phone) VALUES
  ('Punjab State Relief Centre',   'Punjab',           'Ludhiana',  30.9010, 75.8573, 600,  '+911800001111'),
  ('Delhi Emergency Hub',          'Delhi',             'New Delhi', 28.6139, 77.2090, 1200, '+911800002222'),
  ('Mumbai Cyclone Shelter',       'Maharashtra',       'Mumbai',    19.0760, 72.8777, 900,  '+911800003333'),
  ('Chennai Flood Camp',           'Tamil Nadu',        'Chennai',   13.0827, 80.2707, 700,  '+911800004444'),
  ('Kolkata Storm Shelter',        'West Bengal',       'Kolkata',   22.5726, 88.3639, 800,  '+911800005555'),
  ('Jaipur Heat Relief Centre',    'Rajasthan',         'Jaipur',    26.9124, 75.7873, 500,  '+911800006666'),
  ('Hyderabad Disaster Camp',      'Telangana',         'Hyderabad', 17.3850, 78.4867, 650,  '+911800007777'),
  ('Ahmedabad Relief Hub',         'Gujarat',           'Ahmedabad', 23.0225, 72.5714, 950,  '+911800008888'),
  ('Bhopal Emergency Shelter',     'Madhya Pradesh',    'Bhopal',    23.2599, 77.4126, 450,  '+911800009999'),
  ('Lucknow Aid Centre',           'Uttar Pradesh',     'Lucknow',   26.8467, 80.9462, 550,  '+911800001010')
ON CONFLICT DO NOTHING;

-- ─── Row Level Security ──────────────────────────────────────
ALTER TABLE disaster_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelters        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read events"   ON disaster_events FOR SELECT USING (true);
CREATE POLICY "Public read alerts"   ON alerts          FOR SELECT USING (true);
CREATE POLICY "Public read shelters" ON shelters        FOR SELECT USING (true);
CREATE POLICY "Service insert events" ON disaster_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert alerts" ON alerts          FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update alerts" ON alerts          FOR UPDATE USING (true);
CREATE POLICY "Service update shelters" ON shelters      FOR UPDATE USING (true);
