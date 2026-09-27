-- ============================================================================
-- SMARTVIEW - INITIAL SEED DATA
-- Default Operator, Gate Control Node, and Smart Street Lighting Node
-- ============================================================================

-- 1. Create default admin user: admin@gatecontrol.io / Password123!
INSERT INTO users (email, password_hash, name, role)
VALUES (
    'admin@gatecontrol.io',
    '$2a$10$7Zq7/sU6iF74U2n0f5U.eeSgG8x1hOvhOa18aXF4r6pB6xP6j8t2e',
    'Primary Administrator',
    'admin'
)
ON CONFLICT (email) DO NOTHING;

-- 2. Create Gate Control Node: GATE-001
INSERT INTO devices (device_id, device_type, name, status, gate_status, mode, capabilities, last_seen, firmware_version)
VALUES (
    'GATE-001',
    'GATE',
    'Main Perimeter Gate (500km Remote Site)',
    'ONLINE',
    'CLOSED',
    'AUTO',
    '["GATE_OPEN_CLOSE", "AUTO_SCHEDULE", "RTC_SCHEDULE"]'::jsonb,
    NOW(),
    '1.0.0'
)
ON CONFLICT (device_id) DO UPDATE 
SET updated_at = NOW();

-- 3. Create Smart Street Lighting Node: STREETLIGHT-001
INSERT INTO devices (device_id, device_type, name, status, light_status, mode, capabilities, last_seen, firmware_version)
VALUES (
    'STREETLIGHT-001',
    'STREET_LIGHT',
    'Main Road Smart Lighting (4-Zone Adaptive)',
    'ONLINE',
    'ADAPTIVE',
    'AUTO',
    '["LIGHT_ON_OFF", "ZONE_TELEMETRY", "MOTION_DETECTION", "DIMMING", "AUTO_ADAPTIVE"]'::jsonb,
    NOW(),
    '1.0.0'
)
ON CONFLICT (device_id) DO UPDATE 
SET updated_at = NOW();

-- 4. Initial Street Light Telemetry Record for STREETLIGHT-001
INSERT INTO street_light_telemetry (device_id, is_night, ambient_light, motion_zones, led_brightness, mode)
VALUES (
    'STREETLIGHT-001',
    true,
    'NIGHT',
    '{"zone1": false, "zone2": false, "zone3": false, "zone4": false}'::jsonb,
    '{"led1": 60, "led2": 60, "led3": 60, "led4": 60}'::jsonb,
    'AUTO'
);

-- 5. Default weekly schedule for GATE-001
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

-- 6. Initial audit logs
INSERT INTO device_logs (device_id, event_type, message, metadata)
VALUES
    ('GATE-001', 'DEVICE_ONLINE', 'Device GATE-001 connected via MQTT broker', '{"ip": "192.168.1.120", "rssi": -62}'::jsonb),
    ('STREETLIGHT-001', 'DEVICE_ONLINE', 'Device STREETLIGHT-001 connected via MQTT broker', '{"ip": "192.168.1.121", "rssi": -58}'::jsonb),
    ('STREETLIGHT-001', 'TELEMETRY', 'Initial 4-zone street light telemetry received', '{"ambient": "NIGHT", "zones": 4}'::jsonb);
