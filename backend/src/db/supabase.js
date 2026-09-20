import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let isMockDb = false;

// Fallback in-memory state for development / mock mode before real Supabase keys are configured
const memoryStore = {
  users: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@gatecontrol.io',
      // Password: Password123!
      password_hash: bcrypt.hashSync('Password123!', 10),
      name: 'Primary Administrator',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  devices: [
    {
      id: '00000000-0000-0000-0000-000000000002',
      device_id: 'GATE-001',
      name: 'Main Perimeter Gate (500km Remote Site)',
      status: 'ONLINE',
      gate_status: 'CLOSED',
      mode: 'AUTO',
      last_seen: new Date().toISOString(),
      firmware_version: '1.0.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  schedules: [
    { id: '1', device_id: 'GATE-001', day_of_week: 'Monday', open_time: '08:00:00', close_time: '20:00:00', enabled: true },
    { id: '2', device_id: 'GATE-001', day_of_week: 'Tuesday', open_time: '08:00:00', close_time: '20:00:00', enabled: true },
    { id: '3', device_id: 'GATE-001', day_of_week: 'Wednesday', open_time: '08:00:00', close_time: '20:00:00', enabled: true },
    { id: '4', device_id: 'GATE-001', day_of_week: 'Thursday', open_time: '08:00:00', close_time: '20:00:00', enabled: true },
    { id: '5', device_id: 'GATE-001', day_of_week: 'Friday', open_time: '08:00:00', close_time: '20:00:00', enabled: true },
    { id: '6', device_id: 'GATE-001', day_of_week: 'Saturday', open_time: '09:00:00', close_time: '18:00:00', enabled: true },
    { id: '7', device_id: 'GATE-001', day_of_week: 'Sunday', open_time: '10:00:00', close_time: '16:00:00', enabled: false },
  ],
  commands: [],
  device_logs: [
    {
      id: '00000000-0000-0000-0000-000000000010',
      device_id: 'GATE-001',
      event_type: 'DEVICE_ONLINE',
      message: 'Device GATE-001 connected and synchronized',
      metadata: { ip: '192.168.1.120', rssi: -62 },
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000011',
      device_id: 'GATE-001',
      event_type: 'GATE_CLOSED',
      message: 'Gate verified in CLOSED position via limit switch',
      metadata: { sensor: 'LIMIT_CLOSED' },
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
};

if (supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('placeholder')) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
    logger.info('Connected to Supabase PostgreSQL database');
  } catch (err) {
    logger.warn('Failed to initialize Supabase client, falling back to in-memory store:', err.message);
    isMockDb = true;
  }
} else {
  logger.info('No Supabase credentials provided in .env - running with in-memory resilient data store');
  isMockDb = true;
}

export { supabase, isMockDb, memoryStore };
