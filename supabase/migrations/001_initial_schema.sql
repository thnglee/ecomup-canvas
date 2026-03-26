-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: canvas_state
-- Purpose: Store viewport state (single row per user)
-- ============================================
CREATE TABLE canvas_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewport_x FLOAT NOT NULL DEFAULT 0,
  viewport_y FLOAT NOT NULL DEFAULT 0,
  viewport_zoom FLOAT NOT NULL DEFAULT 1.0,
  snap_to_grid BOOLEAN NOT NULL DEFAULT TRUE,
  sidebar_collapsed BOOLEAN NOT NULL DEFAULT FALSE,
  minimap_visible BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- Table: zones
-- Purpose: Rectangular grouping regions
-- ============================================
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Zone',
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  width FLOAT NOT NULL DEFAULT 400,
  height FLOAT NOT NULL DEFAULT 300,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  z_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: components
-- Purpose: All canvas components (link_box, data_table, sticky_note, process_block, image)
-- ============================================
CREATE TYPE component_type AS ENUM (
  'link_box',
  'data_table',
  'sticky_note',
  'process_block',
  'image'
);

CREATE TABLE components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type component_type NOT NULL,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  width FLOAT NOT NULL DEFAULT 260,
  height FLOAT NOT NULL DEFAULT 80,
  z_index INT NOT NULL DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}',
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Table: connectors
-- Purpose: Lines/arrows between components
-- ============================================
CREATE TYPE connector_type AS ENUM ('line', 'arrow', 'bidirectional');
CREATE TYPE connector_style AS ENUM ('solid', 'dashed');

CREATE TABLE connectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  to_component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  from_anchor TEXT NOT NULL DEFAULT 'right',
  to_anchor TEXT NOT NULL DEFAULT 'left',
  type connector_type NOT NULL DEFAULT 'arrow',
  style connector_style NOT NULL DEFAULT 'solid',
  color TEXT NOT NULL DEFAULT '#ffffff',
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_component_id != to_component_id)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_components_user_id ON components(user_id);
CREATE INDEX idx_components_zone_id ON components(zone_id);
CREATE INDEX idx_zones_user_id ON zones(user_id);
CREATE INDEX idx_connectors_user_id ON connectors(user_id);
CREATE INDEX idx_connectors_from ON connectors(from_component_id);
CREATE INDEX idx_connectors_to ON connectors(to_component_id);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE canvas_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own canvas_state"
  ON canvas_state FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own components"
  ON components FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own zones"
  ON zones FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own connectors"
  ON connectors FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_canvas_state_updated
  BEFORE UPDATE ON canvas_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_components_updated
  BEFORE UPDATE ON components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_zones_updated
  BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
