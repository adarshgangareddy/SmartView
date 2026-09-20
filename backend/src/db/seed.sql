-- ============================================================================
-- REMOTE IOT GATE CONTROL SYSTEM - INITIAL SEED DATA
-- ============================================================================

-- 1. Create default admin user:
-- Email: admin@gatecontrol.io
-- Password: Password123! (bcrypt hash: $2a$10$7Zq7/sU6iF74U2n0f5U.eeSgG8x1hOvhOa18aXF4r6pB6xP6j8t2e)
INSERT INTO users (email, password_hash, name, role)
VALUES (
    'admin@gatecontrol.io',
    '$2a$10$7Zq7/sU6iF74U2n0f5U.eeSgG8x1hOvhOa18aXF4r6pB6xP6j8t2e',
    'Primary Administrator',
    'admin'
)
ON CONFLICT (email) DO NOTHING;

-- 2. Create initial device: GATE-001
INSERT INTO devices (device_id, name, status, gate_status, mode, last_seen, firmware_version)
VALUES (
    'GATE-001',
    'Main Perimeter Gate (500km Remote Site)',
    'ONLINE',
    'CLOSED',
    'AUTO',
    NOW(),
    '1.0.0'
)
ON CONFLICT (device_id) DO UPDATE 
SET updated_at = NOW();

-- 3. Create default weekly schedule for GATE-001
INSERT INTO schedules (device_id, day_of_week, open_time, close_time, enabled)
VALUES
    ('GATE-001', 'Monday', '08:00:00', '20:00:00', true),
    ('GATE-001', 'Tuesday', '08:00:00', '20:00:00', true),
    ('GATE-001', 'Wednesday', '08:00:00', '20:00:00', true),
    ('GATE-001', 'Thursday', '08:00:00', '20:00:00', true),
    ('GATE-001', 'Friday', '08:00:00', '20:00:00', true),
    ('GATE-001', 'Saturday', '09:00:00', '18:00:00', true),
    ('GATE-001', 'Sunday', '10:00:00', '16:00:00', false)
ON CONFLICT (device_id, day_of_week) DO NOTHING;

-- 4. Initial audit logs
INSERT INTO device_logs (device_id, event_type, message, metadata)
VALUES
    ('GATE-001', 'DEVICE_ONLINE', 'Device GATE-001 connected via MQTT broker', '{"ip": "192.168.1.120", "rssi": -62}'::jsonb),
    ('GATE-001', 'GATE_CLOSED', 'Gate verified in CLOSED position via limit switch', '{"sensor": "LIMIT_CLOSED"}'::jsonb),
    ('GATE-001', 'SCHEDULE_UPDATED', 'Default weekly schedule initialized on device', '{"version": 1}'::jsonb);
