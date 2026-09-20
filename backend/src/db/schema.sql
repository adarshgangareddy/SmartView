-- ============================================================================
-- REMOTE IOT GATE CONTROL SYSTEM - SUPABASE POSTGRESQL SCHEMA
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing tables if recreating (optional / safe migrations)
-- DROP TABLE IF EXISTS device_logs CASCADE;
-- DROP TABLE IF EXISTS commands CASCADE;
-- DROP TABLE IF EXISTS schedules CASCADE;
-- DROP TABLE IF EXISTS devices CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE (Dashboard Operators & Administrators)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(128) NOT NULL DEFAULT 'Operator',
    role VARCHAR(32) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. DEVICES TABLE
-- Status: ONLINE, OFFLINE
-- Gate Status: OPEN, CLOSED, OPENING, CLOSING, UNKNOWN
-- Mode: AUTO, MANUAL
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL DEFAULT 'Main Security Gate',
    status VARCHAR(16) NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE')),
    gate_status VARCHAR(16) NOT NULL DEFAULT 'UNKNOWN' CHECK (gate_status IN ('OPEN', 'CLOSED', 'OPENING', 'CLOSING', 'UNKNOWN')),
    mode VARCHAR(16) NOT NULL DEFAULT 'AUTO' CHECK (mode IN ('AUTO', 'MANUAL')),
    last_seen TIMESTAMPTZ,
    firmware_version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by device_id
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);

-- 3. SCHEDULES TABLE
-- One schedule entry per day of week for each device
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    day_of_week VARCHAR(16) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Validation: close_time must be strictly after open_time
    CONSTRAINT chk_close_after_open CHECK (close_time > open_time),
    -- Ensure only 1 schedule row per day per device
    CONSTRAINT uq_device_day UNIQUE (device_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_schedules_device_id ON schedules(device_id);

-- 4. COMMANDS TABLE
-- Command types: OPEN, CLOSE, SET_SCHEDULE, SET_MODE
-- Status: PENDING, SENT, ACKNOWLEDGED, FAILED
CREATE TABLE IF NOT EXISTS commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    command VARCHAR(32) NOT NULL CHECK (command IN ('OPEN', 'CLOSE', 'SET_SCHEDULE', 'SET_MODE')),
    requested_by VARCHAR(128) NOT NULL DEFAULT 'operator',
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'ACKNOWLEDGED', 'FAILED')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_commands_device_id_created ON commands(device_id, created_at DESC);

-- 5. DEVICE_LOGS TABLE
-- Event types: DEVICE_ONLINE, DEVICE_OFFLINE, GATE_OPENED, GATE_CLOSED, COMMAND_SENT, COMMAND_ACKNOWLEDGED, SCHEDULE_UPDATED, ERROR
CREATE TABLE IF NOT EXISTS device_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(64) NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_logs_device_id_created ON device_logs(device_id, created_at DESC);

-- Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
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
