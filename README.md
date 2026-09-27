# SmartView — Unified IoT Operations Platform

**SmartView** is a production-structured, multi-operation IoT platform designed to monitor, automate, and control disparate physical devices across remote locations through a single unified architecture.

SmartView currently hosts two production operations:
1. **Remote Gate Control (`GATE-001`)**: Long-distance (500 km) perimeter gate automation featuring dual-relay actuation, motor travel protection, weekly schedule matrix, and autonomous offline execution powered by a DS3231 RTC and NVS flash memory.
2. **Smart Street Lighting (`STREETLIGHT-001`)**: Physical testbed roadway illumination system featuring 1x LDR ambient light sensor, 4x infrared vehicle motion sensors, and 4x PWM dimmable street lamps with real-time telemetry streaming and remote manual override.

---

## 1. Unified Architecture (Zero Duplication)

Both operations share **one** backend, **one** database, **one** MQTT broker, **one** authentication system, and **one** frontend dashboard:

```text
                                SMARTVIEW
                                    │
             ┌──────────────────────┴──────────────────────┐
             │                                             │
      Shared Frontend                                Shared Backend
   (React + Vite + Tailwind)                      (Node.js + Express + WS)
             │                                             │
             │ HTTPS / WSS                                 ├─ JWT Auth & Rate Limiting
             ▼                                             ├─ Supabase PostgreSQL
   ┌───────────────────┐                                   ├─ MQTT Bridge
   │  Unified Web App  │                                   └─ Realtime WebSocket (/ws)
   │ ├─ Dashboard Hub  │                                           │
   │ ├─ Gate Control   │                                           ▼
   │ └─ Street Light   │                                   Shared MQTT Broker
   └───────────────────┘                             (HiveMQ Cloud / EMQX / Mosquitto)
                                                                   │
                                                ┌──────────────────┴──────────────────┐
                                                │                                     │
                                         gate/GATE-001/...               smartview/devices/STREETLIGHT-001/...
                                                │                                     │
                                                ▼                                     ▼
                                       ESP32 Gate Node                       ESP32 Street Light Node
                                    (Relays, Switches, RTC)                    (LDR, 4x IR, 4x LEDs)
```

---

## 2. Recommended Free & Best Cloud Infrastructure

To run SmartView with real physical hardware and cloud access from anywhere in the world, we have selected the absolute best free-tier providers:

### A. MQTT Broker: **HiveMQ Cloud (Serverless Free Tier)**
* **Why it is the Best**: Free forever, supports up to **100 concurrent devices**, 10 GB/month data transfer, **enterprise TLS 1.2/1.3 encryption on port 8883**, 99.9% uptime SLA, and no credit card required.
* **The Setup Challenge**: HiveMQ Cloud enforces TLS. Both the backend and ESP32 must use SSL/TLS handshakes (`WiFiClientSecure` on ESP32 and `mqtts://` in Node.js). SmartView's firmware and backend are already pre-configured to handle this automatically!

#### How to Set Up HiveMQ Cloud in 3 Minutes:
1. Sign up for a free account at: [https://www.hivemq.com/cloud/](https://www.hivemq.com/cloud/)
2. Click **Create Serverless Cluster** (Free Plan).
3. Under **Access Management**, create MQTT credentials:
   * **Username**: e.g. `smartview_user`
   * **Password**: e.g. `YourSecurePassword123!`
   * **Permissions**: Publish and Subscribe (All topics: `#`)
4. On your cluster overview page, copy your **Cluster URL**:
   * Example: `xxxxxx.s1.eu.hivemq.cloud` (Port: `8883`)

> **Zero-Friction Dev Fallback**: If you want to test physical hardware immediately without signing up for an account, you can use the public test broker `broker.hivemq.com` on port `1883` (unencrypted).

---

### B. Database & Auth: **Supabase (Free Tier)**
* **Why it is the Best**: Generous free tier with a 500 MB PostgreSQL database, 50,000 monthly active users, automated REST APIs, Row-Level Security, and automated connection pooling.
* **Zero-Hardware Resilient Mode**: If no Supabase credentials are provided in `.env`, the SmartView backend automatically starts with an in-memory resilient datastore.

#### How to Set Up Supabase:
1. Sign up at [https://supabase.com](https://supabase.com) and create a free project.
2. In the left navigation, open **SQL Editor** -> **New query**.
3. Copy and execute [backend/src/db/schema.sql](file:///c:/Users/adars/OneDrive/Desktop/Projects/SmartView/gate-control/backend/src/db/schema.sql).
4. Copy and execute [backend/src/db/seed.sql](file:///c:/Users/adars/OneDrive/Desktop/Projects/SmartView/gate-control/backend/src/db/seed.sql).
5. Go to **Project Settings** -> **API**:
   * Copy **Project URL** (`SUPABASE_URL`)
   * Copy **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`)

---

## 3. Operation 1: Smart Street Lighting (`STREETLIGHT-001`)

The Smart Street Lighting operation controls and monitors your roadway lighting hardware prototype.

### Hardware Component & Pin Mapping

| Component | Physical Pin Label | ESP32 GPIO Pin | Description / Behavior |
|---|---|---|---|
| **LDR Module (DO)** | Digital Output | **GPIO 34** | Active `LOW` in darkness (Night detection) |
| **IR Sensor 1** | Digital Output | **GPIO 25** | Section 1 vehicle approach detection (Active `LOW`) |
| **IR Sensor 2** | Digital Output | **GPIO 26** | Section 2 vehicle approach detection (Active `LOW`) |
| **IR Sensor 3** | Digital Output | **GPIO 27** | Section 3 vehicle approach detection (Active `LOW`) |
| **IR Sensor 4** | Digital Output | **GPIO 14** | Section 4 vehicle approach detection (Active `LOW`) |
| **Lamp 1 (LED 1)** | Anode through Resistor | **GPIO 16** | Roadway Section 1 LED (PWM driven) |
| **Lamp 2 (LED 2)** | Anode through Resistor | **GPIO 17** | Roadway Section 2 LED (PWM driven) |
| **Lamp 3 (LED 3)** | Anode through Resistor | **GPIO 18** | Roadway Section 3 LED (PWM driven) |
| **Lamp 4 (LED 4)** | Anode through Resistor | **GPIO 19** | Roadway Section 4 LED (PWM driven) |
| **VCC Power** | Power Rail | **VIN / 5V** | 5V supply for IR modules & LEDs |
| **GND** | System Ground | **GND** | Common ground connected across all modules |

### Flashing the Street Light Firmware

The firmware code is located in [`gate-control/esp32-streetlight/`](file:///c:/Users/adars/OneDrive/Desktop/Projects/SmartView/gate-control/esp32-streetlight/).

1. **Install Arduino Libraries**:
   In Arduino IDE (or PlatformIO), install:
   * **PubSubClient** (by Nick O'Leary)
   * **ArduinoJson** (by Benoît Blanchon, v6 or v7)
2. **Configure Credentials**:
   Open [esp32-streetlight/src/config.h](file:///c:/Users/adars/OneDrive/Desktop/Projects/SmartView/gate-control/esp32-streetlight/src/config.h) and set:
   ```cpp
   #define WIFI_SSID           "Your_WiFi_SSID"
   #define WIFI_PASSWORD       "Your_WiFi_Password"

   // For HiveMQ Cloud (Free & Best):
   #define MQTT_BROKER_HOST    "xxxxxx.s1.eu.hivemq.cloud"
   #define MQTT_BROKER_PORT    8883   // Automatically engages TLS WiFiClientSecure
   #define MQTT_USERNAME       "smartview_user"
   #define MQTT_PASSWORD       "YourSecurePassword123!"

   // Or for Public Test Broker (Zero Setup):
   // #define MQTT_BROKER_HOST "broker.hivemq.com"
   // #define MQTT_BROKER_PORT 1883
   ```
3. **Upload Sketch**:
   Connect your ESP32 via USB, select board **ESP32 Dev Module**, select your COM port, and click **Upload**.
4. Open the Serial Monitor at **115200 baud** to confirm Wi-Fi connection and MQTT registration.

---

## 4. Operation 2: Remote Gate Control (`GATE-001`)

The Gate Control operation manages a high-reliability motorized gate located ~500 km away.

### Hardware Component & Pin Mapping

| Component | ESP32 GPIO Pin | Description / Safety Protection |
|---|---|---|
| **Relay 1 (Motor Forward)** | **GPIO 26** | Actuates gate OPEN motor |
| **Relay 2 (Motor Reverse)** | **GPIO 27** | Actuates gate CLOSE motor (Hardware interlock protected) |
| **Open Limit Switch** | **GPIO 32** | Active `LOW` input when gate is fully open |
| **Closed Limit Switch** | **GPIO 33** | Active `LOW` input when gate is fully closed |
| **DS3231 RTC (SDA)** | **GPIO 21** | I2C Data line with 4.7kΩ pullup |
| **DS3231 RTC (SCL)** | **GPIO 22** | I2C Clock line with 4.7kΩ pullup |
| **Diagnostic LED** | **GPIO 2** | Onboard status indicator |

### Flashing the Gate Control Firmware

The firmware code is located in [`gate-control/esp32/`](file:///c:/Users/adars/OneDrive/Desktop/Projects/SmartView/gate-control/esp32/).

1. **Install Arduino Libraries**:
   * **PubSubClient** (by Nick O'Leary)
   * **ArduinoJson** (by Benoît Blanchon)
   * **RTClib** (by Adafruit)
2. **Configure Credentials**:
   Open [esp32/src/config.h](file:///c:/Users/adars/OneDrive/Desktop/Projects/SmartView/gate-control/esp32/src/config.h) and enter your Wi-Fi SSID, Password, and HiveMQ broker host (`8883`).
3. **Autonomous Offline Guarantee**:
   Weekly schedules configured on the dashboard are synchronized into ESP32 non-volatile storage (`Preferences.h`). When remote internet drops, the local battery-backed DS3231 RTC continues triggering scheduled open/close actions without network connectivity.

---

## 5. SmartView Backend & Frontend Setup

### A. Environment Configuration (`backend/.env`)

Edit [backend/.env](file:///c:/Users/adars/OneDrive/Desktop/Projects/SmartView/gate-control/backend/.env):

```ini
PORT=5000
NODE_ENV=development

# JWT Authentication
JWT_SECRET=smartview_secure_jwt_secret_key_2026_xyz
JWT_EXPIRES_IN=24h

# Supabase PostgreSQL (Optional in local dev mode)
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh......

# Shared HiveMQ Cloud MQTT Broker (Free & Best)
MQTT_BROKER_URL=mqtts://xxxxxx.s1.eu.hivemq.cloud:8883
MQTT_USERNAME=smartview_user
MQTT_PASSWORD=YourSecurePassword123!
MQTT_CLIENT_ID=smartview-backend-001
MQTT_TLS=true

# Device Configuration
HEARTBEAT_TIMEOUT_SECONDS=90

# MOCK MODE TOGGLE:
# Set to 'false' to communicate with REAL physical ESP32 hardware
# Set to 'true' to run the built-in virtual ESP32 simulator
MOCK_DEVICE=false
```

### B. Starting the Platform

#### 1. Start the Shared Backend:
In terminal 1:
```bash
cd gate-control/backend
npm install
npm start
```
*Backend runs on `http://localhost:5000` with WebSocket server at `ws://localhost:5000/ws`.*

#### 2. Start the Shared Frontend:
In terminal 2:
```bash
cd gate-control/frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173` (or `5174`).*

#### 3. Log In to SmartView:
* Open `http://localhost:5173`
* **Email**: `admin@gatecontrol.io`
* **Password**: `Password123!`
*(Or click the Quick Fill button on the login screen).*

---

## 6. End-to-End Real Hardware Verification Tests

### Test 1: Device Online Presence
1. Power on your Street Light ESP32 node.
2. In the SmartView dashboard, select **Operations** -> **Smart Street Lighting**.
3. **Expected Result**: Within seconds, the device card reflects:
   ```text
   STREETLIGHT-001  ● ONLINE
   Last Seen: Just now
   ```

### Test 2: Realtime Sensor Telemetry (No Page Refresh)
1. **Day / Night Sensor**: Cover the physical LDR module with your finger.
   * **Result**: Dashboard **Ambient Light** card immediately switches from **DAY** to **NIGHT**.
2. **Vehicle Motion Detection**: Wave your hand in front of **IR Sensor 1, 2, 3, or 4**.
   * **Result**: The **Zone Motion Matrix** illuminates that zone as **DETECTED**, and the **Roadway Visualizer** street lamp jumps to **100% (255 PWM)** in real time via WebSockets.

### Test 3: Remote Actuator Override
1. On the dashboard, click **[ TURN ON ]**.
2. **Flow**: SmartView Dashboard → REST API → MQTT `smartview/devices/STREETLIGHT-001/command` → ESP32.
3. **Result**: All physical LEDs illuminate, ESP32 returns an ACK, and the dashboard status badge updates to **LIGHT: ON**.
4. Click **[ AUTO ]** to return to adaptive sensor-driven lighting.

### Test 4: Fault Tolerance & Heartbeat Watchdog
1. Disconnect the ESP32 from power or Wi-Fi.
2. After the 90-second heartbeat window (or immediately via MQTT Last Will and Testament), SmartView marks the device as `OFFLINE`.
3. Restore power; the node automatically reconnects and publishes current telemetry.

---

## 7. MQTT Scalable Topic Hierarchy

| Topic Pattern | Direction | Payload Example | Function |
|---|---|---|---|
| `smartview/devices/{id}/status` | ESP32 → Server | `{"online":true,"lightStatus":"ON","mode":"AUTO"}` | Device status & LWT |
| `smartview/devices/{id}/telemetry` | ESP32 → Server | `{"isNight":true,"motionZones":{"zone1":true},"ledBrightness":{"led1":255}}` | High-frequency sensor data |
| `smartview/devices/{id}/command` | Server → ESP32 | `{"command":"TURN_ON","requestId":"req_123"}` | Remote actuator execution |
| `smartview/devices/{id}/ack` | ESP32 → Server | `{"requestId":"req_123","command":"TURN_ON","status":"ACKNOWLEDGED"}` | Confirmation loop |
| `smartview/devices/{id}/heartbeat` | ESP32 → Server | `{"deviceId":"STREETLIGHT-001","status":"ONLINE"}` | 30-second watchdog ping |
| `gate/{id}/command` | Server → ESP32 | `{"command":"OPEN","requestId":"req_456"}` | Gate motor relay actuation |
| `gate/{id}/config` | Server → ESP32 | `{"schedule":[{"day":"MONDAY","openTime":"08:00","closeTime":"18:00"}]}` | Weekly schedule update |

---

## 8. Security & Production Checklist

- [x] **Zero Plaintext Secrets in Frontend**: No MQTT passwords, Supabase service keys, or JWT secrets are exposed to the browser.
- [x] **TLS 1.2 / 1.3 Transport Security**: Cloud MQTT connections secured over port 8883 with certificate negotiation.
- [x] **Role-Based JWT Authentication**: Expiring tokens with bcrypt password hashing.
- [x] **Fail-Safe Hardware Interlocks**: Gate controller relay pins prevent simultaneous forward/reverse actuation.
- [x] **Watchdog Power Cut-Off**: 20-second motor travel watchdog prevents motor burnout if mechanical limit switches fail.
- [x] **Autonomous NVS Execution**: Street light and gate operations run offline even if cloud connectivity is lost.
