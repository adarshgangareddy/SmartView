-- ============================================================================
-- SMARTVIEW - UNIFIED IOT OPERATIONS PLATFORM DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Supports Multiple Device Types: GATE, STREET_LIGHT, etc.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE (Shared Authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(128) NOT NULL DEFAULT 'Operator',
    role VARCHAR(32) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. DEVICES TABLE (Generalized Multi-Operation Device Model)
-- device_type: GATE, STREET_LIGHT, etc.
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(64) UNIQUE NOT NULL,
    device_type VARCHAR(32) NOT NULL DEFAULT 'GATE',
    name VARCHAR(128) NOT NULL DEFAULT 'SmartView Node',
    status VARCHAR(16) NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE')),
    gate_status VARCHAR(16) DEFAULT 'UNKNOWN' CHECK (gate_status IN ('OPEN', 'CLOSED', 'OPENING', 'CLOSING', 'UNKNOWN')),
    light_status VARCHAR(16) DEFAULT 'OFF' CHECK (light_status IN ('ON', 'OFF', 'DIM', 'ADAPTIVE')),
    mode VARCHAR(16) NOT NULL DEFAULT 'AUTO' CHECK (mode IN ('AUTO', 'MANUAL')),
    capabilities JSONB DEFAULT '[]'::jsonb,
    last_seen TIMESTAMPTZ,
    firmware_version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_type ON devices(device_type);

-- 3. STREET LIGHT TELEMETRY TABLE (Exact sensors: 1x LDR, 4x IR, 4x LED PWM)
CREATE TABLE IF NOT EXISTS street_light_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    is_night BOOLEAN NOT NULL DEFAULT false,
    ambient_light VARCHAR(16) NOT NULL DEFAULT 'DAY',
    motion_zones JSONB NOT NULL DEFAULT '{"zone1": false, "zone2": false, "zone3": false, "zone4": false}'::jsonb,
    led_brightness JSONB NOT NULL DEFAULT '{"led1": 0, "led2": 0, "led3": 0, "led4": 0}'::jsonb,
    mode VARCHAR(16) NOT NULL DEFAULT 'AUTO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_street_light_telemetry ON street_light_telemetry(device_id, created_at DESC);

-- 4. GATE SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    day_of_week VARCHAR(16) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_close_after_open CHECK (close_time > open_time),
    CONSTRAINT uq_device_day UNIQUE (device_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_schedules_device_id ON schedules(device_id);

-- 5. COMMANDS TABLE (Shared command lifecycle for all operations)
CREATE TABLE IF NOT EXISTS commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    command VARCHAR(32) NOT NULL,
    requested_by VARCHAR(128) NOT NULL DEFAULT 'operator',
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'ACKNOWLEDGED', 'FAILED')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_commands_device_id_created ON commands(device_id, created_at DESC);

-- 6. DEVICE_LOGS TABLE (Shared Event History)
CREATE TABLE IF NOT EXISTS device_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_logs_device_id_created ON device_logs(device_id, created_at DESC);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_devices_updated_at ON devices;
CREATE TRIGGER trg_update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_schedules_updated_at ON schedules;
CREATE TRIGGER trg_update_schedules_updated_at
    BEFORE UPDATE ON schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_users_updated_at ON users;
CREATE TRIGGER trg_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
