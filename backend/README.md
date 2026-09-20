# Gate Control System - Backend

Production-structured Node.js + Express API gateway for the Remote IoT Gate Control System.

---

## 1. Quick Start

### Installation:
```bash
npm install
```

### Run in Development (with Auto-Reload):
```bash
npm run dev
```

### Run in Production:
```bash
npm start
```

---

## 2. Environment Variables (.env)

Copy `.env.example` to `.env`:
```env
PORT=5000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=your_secure_jwt_secret_min_32_characters
JWT_EXPIRES_IN=24h

# Supabase PostgreSQL
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# MQTT Broker
MQTT_BROKER_URL=mqtts://your-broker-address:8883
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password
MQTT_CLIENT_ID=gate-control-backend-001
MQTT_TLS=true

# Device Configuration
DEVICE_ID=GATE-001
HEARTBEAT_TIMEOUT_SECONDS=90

# Simulated ESP32 Mode (Allows testing without physical hardware)
MOCK_DEVICE=true
```

---

## 3. Database Setup (Supabase)

1. Open your Supabase Project Dashboard -> **SQL Editor**.
2. Run the SQL script located at:
   `src/db/schema.sql`
3. Run the initial seed script located at:
   `src/db/seed.sql`

Default administrator credentials created:
- **Email**: `admin@gatecontrol.io`
- **Password**: `Password123!`

---

## 4. API Endpoints

### Authentication:
- `POST /api/auth/login` - Authenticate operator and receive JWT
- `POST /api/auth/logout` - Invalidate session
- `GET /api/auth/me` - Get current authenticated user

### Device Status:
- `GET /api/devices` - List all registered gate controllers
- `GET /api/devices/:deviceId` - Get device parameters
- `GET /api/devices/:deviceId/status` - Real-time state (ONLINE/OFFLINE, OPEN/CLOSED, Mode)

### Manual Controls:
- `POST /api/devices/:deviceId/commands/open` - Dispatches remote OPEN command
- `POST /api/devices/:deviceId/commands/close` - Dispatches remote CLOSE command
- `POST /api/devices/:deviceId/commands/mode` - Toggles AUTO / MANUAL mode

### Weekly Schedule:
- `GET /api/devices/:deviceId/schedule` - Fetch full 7-day schedule
- `PUT /api/devices/:deviceId/schedule` - Update schedule & transmit over MQTT

### Audit Logs:
- `GET /api/devices/:deviceId/logs` - Event history
