# Remote IoT Gate Control System

A complete, production-structured IoT system designed to monitor and operate a physical motorized gate located approximately 500 km away. The architecture allows an authenticated operator to view real-time gate status, issue manual `OPEN` and `CLOSE` commands, change the weekly operating schedule without firmware re-flashes, and guarantees autonomous offline operation using a local DS3231 RTC clock and Non-Volatile Storage (NVS).

---

## 1. Project Overview & Features

- **Long-Distance Remote Monitoring**: Continuous status monitoring of gate state (`ONLINE`, `OFFLINE`, `OPEN`, `CLOSED`, `OPENING`, `CLOSING`).
- **Safety Manual Control**: Dual-stage manual control with confirmation modals and interlock protection preventing simultaneous reverse actuation.
- **Dynamic Weekly Scheduling**: Change open/close times for Monday through Sunday directly from the web dashboard; schedules are transmitted over MQTT into the remote node's flash memory.
- **Autonomous Offline Operation**: When remote Wi-Fi or Internet connectivity drops, the physical ESP32 node continues executing its weekly schedule reliably via local battery-backed DS3231 RTC.
- **Zero-Hardware Simulation (Dev Mode)**: Built-in `MOCK_DEVICE=true` mode lets you run and interact with the full dashboard and mock motor state transitions immediately on your local machine.
- **Fail-Safe Motor Protection**: Configurable motor travel watchdog (20 seconds) cuts power if limit switches fail.
- **OTA Ready**: Architecture prepared for remote wireless firmware updates.

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Browser Dashboard                    │
│            React + Vite + Tailwind CSS                 │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS REST API (JWT Auth)
                            ▼
┌────────────────────────────────────────────────────────┐
│               Node.js + Express Backend                │
│   - Security Headers (Helmet) & Rate Limiting          │
│   - Input Validation (Zod)                             │
│   - Heartbeat Watchdog & Device State Manager          │
│   - Supabase PostgreSQL Client                         │
│   - MQTT Broker Client (PubSubClient / MQTT.js)        │
│   - Mock Device Simulator (MOCK_DEVICE=true)           │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
  PostgreSQL    ▼                        ▼ MQTT over TLS
┌────────────────────────┐      ┌────────────────────────┐
│  Supabase PostgreSQL   │      │      MQTT Broker       │
│  - devices             │      │  (HiveMQ/EMQX/Mosq)    │
│  - schedules           │      └───────────┬────────────┘
│  - commands            │                  │
│  - device_logs         │                  │ MQTT Topics (TLS)
│  - users               │                  ▼
└────────────────────────┘      ┌────────────────────────┐
                                │   ESP32 Remote Gate    │
                                │ - DS3231 I2C RTC Clock │
                                │ - NVS Flash Schedule   │
                                │ - Relays & Switches    │
                                │ - Fail-Safe Watchdog   │
                                └────────────────────────┘
```

---

## 3. Folder Structure

```
gate-control/
│
├── frontend/                     # React + Vite Dashboard
│   ├── src/
│   │   ├── components/           # Reusable UI (Cards, Controls, Modals)
│   │   ├── pages/                # Login, Dashboard, Logs, Settings
│   │   ├── services/             # Axios REST API Client
│   │   ├── hooks/                # useDevice, useAuth, usePolling
│   │   ├── context/              # Auth & Notification Contexts
│   │   ├── utils/                # Date/time formatters, validators
│   │   ├── App.jsx               # Route definitions & guards
│   │   ├── main.jsx              # DOM Mount
│   │   └── index.css             # Tailwind styling & industrial tokens
│   ├── .env.example              # VITE_API_URL template
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
│
├── backend/                      # Node.js Express API Server
│   ├── src/
│   │   ├── controllers/          # Auth, Device, Schedule, Command, Log
│   │   ├── routes/               # Express route endpoints
│   │   ├── services/             # Supabase data layer & Mock Simulator
│   │   ├── middleware/           # JWT Auth, Zod Validation, Rate Limiting
│   │   ├── mqtt/                 # MQTT Client, Topics, Message Handlers
│   │   ├── db/                   # Supabase schema.sql, seed.sql, client
│   │   ├── utils/                # Logger, Standard Response, Constants
│   │   └── server.js             # Server Entrypoint
│   ├── .env.example              # Secrets template
│   ├── package.json
│   └── README.md
│
├── esp32/                        # ESP32 C++ Firmware
│   ├── src/
│   │   ├── config.h              # Pin definitions & network credentials
│   │   ├── GateController.h/.cpp # Relay interlocks & motor watchdog
│   │   ├── RtcManager.h/.cpp     # DS3231 I2C driver & NTP sync
│   │   ├── ScheduleManager.h/.cpp# Preferences.h NVS storage & RTC checks
│   │   ├── MqttManager.h/.cpp    # MQTT connection, topics, and JSON
│   │   ├── OtaManager.h/.cpp     # Over-The-Air wireless updates
│   │   └── main.cpp              # Setup & main operating loop
│   └── README.md
│
├── .gitignore
└── README.md
```

---

## 4. Requirements

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Hardware (Optional for initial test)**:
  - ESP32-WROOM-32 development board
  - DS3231 I2C RTC module + CR2032 battery
  - 2-channel 5V/12V opto-isolated relay module
  - 2x limit switches (normally open or optical sensors)
  - 12V/24V gate motor driver

---

## 5. Quick Start / Running the Project

### Running in Development (Mock Simulator Mode):
You can test the full end-to-end system right away without hardware!

#### Step 1: Start Backend
In terminal 1:
```bash
cd gate-control/backend
npm install
npm start
```
*The backend automatically starts in `MOCK_DEVICE=true` mode and listens on `http://localhost:5000`.*

#### Step 2: Start Frontend
In terminal 2:
```bash
cd gate-control/frontend
npm install
npm run dev
```
*The Vite development server will start at: `http://localhost:5173`.*

#### Step 3: Log In
Open `http://localhost:5173` in your browser:
- **Email**: `admin@gatecontrol.io`
- **Password**: `Password123!`
*(Or click the "Default Demonstration Account" button).*

---

## 6. Environment Variables

### Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=gate_control_secure_development_jwt_secret_key_2026_xyz
JWT_EXPIRES_IN=24h

# Supabase PostgreSQL (Optional in dev mock mode)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# MQTT Broker (Optional in dev mock mode)
MQTT_BROKER_URL=mqtts://your-broker-address:8883
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password
MQTT_CLIENT_ID=gate-control-backend-001
MQTT_TLS=true

# Target Device
DEVICE_ID=GATE-001
HEARTBEAT_TIMEOUT_SECONDS=90

# Mock Mode (Virtual ESP32 Simulator)
MOCK_DEVICE=true
```

---

## 7. Supabase Database Setup

When ready to link your production Supabase database:
1. Open your project in [Supabase](https://supabase.com).
2. Navigate to **SQL Editor** -> **New Query**.
3. Copy and run `backend/src/db/schema.sql` to create tables and indexes.
4. Copy and run `backend/src/db/seed.sql` to populate initial default device `GATE-001` and the admin user.
5. In your Supabase Project Settings -> **API**, copy `Project URL` and `service_role secret` into `backend/.env`.

---

## 8. MQTT Broker Setup & Topic Hierarchy

### Recommended Free Brokers:
- **HiveMQ Cloud** (Free 100 devices with TLS)
- **EMQX Cloud Serverless**
- **Mosquitto** (Self-hosted)

### Topics Hierarchy:
| Topic | Direction | Purpose |
|---|---|---|
| `gate/{deviceId}/command` | Backend → ESP32 | Remote commands (`OPEN`, `CLOSE`, `SET_MODE`) |
| `gate/{deviceId}/config` | Backend → ESP32 | Weekly schedule configuration payload |
| `gate/{deviceId}/status` | ESP32 → Backend | Real-time state (`OPEN`, `CLOSED`, `ONLINE`) |
| `gate/{deviceId}/ack` | ESP32 → Backend | Command execution acknowledgements |
| `gate/{deviceId}/heartbeat` | ESP32 → Backend | Periodic health check ping every 30s |
| `gate/{deviceId}/telemetry` | ESP32 → Backend | RSSI, free heap, uptime |

---

## 9. ESP32 Hardware Wiring & Flashing

1. Connect the ESP32 to your PC via USB.
2. Open Arduino IDE or PlatformIO.
3. Edit `esp32/src/config.h` with your Wi-Fi SSID, Password, and MQTT broker endpoint.
4. Select board `ESP32 Dev Module`.
5. Upload the sketch and open Serial Monitor at **115200 baud**.

---

## 10. Autonomous Offline Behavior

1. The ESP32 synchronizes its DS3231 RTC clock via NTP whenever Wi-Fi is active.
2. Weekly schedules are saved into ESP32 flash memory (`Preferences.h`).
3. If internet connectivity drops at the remote site:
   - The device detects Wi-Fi loss and keeps operating normally.
   - Every minute, the RTC time is checked against the stored schedule.
   - When open/close times are reached, motor relays actuate automatically.
4. When Internet reconnects:
   - ESP32 re-establishes MQTT and publishes current status and backlog telemetry.

---

## 11. Security Checklist

- [x] All backend routes protected by JWT tokens with expiration.
- [x] Passwords stored as salted bcrypt hashes (`10` salt rounds).
- [x] Rate limiting configured on authentication (15 attempts/15min) and commands (20/min).
- [x] Strict CORS policy with whitelisted origins.
- [x] Helmet security headers applied on all HTTP responses.
- [x] No credentials or MQTT passwords exposed to the Vite frontend.
- [x] Zod validation on all API payloads.
- [x] Hardware relay interlock prevents simultaneous forward and reverse actuation.
- [x] Motor watchdog timer cuts power if limit switches fail.
