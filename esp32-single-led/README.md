# ESP32 Single LED Controller — Setup & Quickstart Guide

This guide explains how to connect your ESP32 board, wire the single LED on a breadboard, configure the environment, and control it from your **SmartControl** web dashboard.

---

## 1. Hardware Connection (Wiring Diagram)

You need:
- 1x ESP32 DevKit / NodeMCU board
- 1x LED (any color: red, green, blue, yellow)
- 1x 220Ω or 330Ω Resistor (optional if testing with on-board LED)
- Breadboard & 2x Jumper Wires (Male-to-Female or Male-to-Male)
- Micro-USB / USB-C data cable

### Wiring:

```text
    ESP32 Pin                       Breadboard Circuit
   ┌─────────┐
   │         │
   │  GPIO 2 ├───────────► [ 220Ω Resistor ] ───► [ Long Leg (+) Anode ]
   │         │                                          LED
   │     GND ├──────────────────────────────────► [ Short Leg (-) Cathode ]
   │         │
   └─────────┘
```

> **Pro Tip (Zero-Wiring Instant Test)**:
> **GPIO 2** is directly wired to the **built-in blue LED** on almost all ESP32 development boards!
> Even if you don't wire anything to the breadboard, the on-board blue LED will turn ON and OFF when you click the button on your website!

---

## 2. Environment Variables (.env) Setup

To connect your website to your physical ESP32, both the backend and ESP32 communicate through an MQTT broker.

### Recommended Zero-Setup Broker: **HiveMQ Public Broker**
No installation required, no account needed, works instantly over standard WiFi!

Open `gate-control/backend/.env` and update the MQTT section:

```env
# MQTT Broker Configuration
MQTT_BROKER_URL=mqtt://broker.hivemq.com:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=smartview-backend-node-001
MQTT_TLS=false

# Disable mock device so real ESP32 handles it
MOCK_DEVICE=false
```

*(If you ever want to test without physical hardware again, simply change `MOCK_DEVICE=true` or leave `MQTT_BROKER_URL=` blank).*

---

## 3. How to Upload the Code to ESP32 (Without Hassle)

The firmware is located in:
`gate-control/esp32-single-led/esp32_single_led.ino`

### Why you DO NOT need to upload code every time:
Once you upload this sketch **once**, the ESP32 becomes a dedicated smart IoT node. You control it **live in real-time from the website** (turn ON, turn OFF) without touching Arduino IDE or re-uploading anything!

### Initial Upload Steps:
1. Open [esp32_single_led.ino](file:///c:/Users/adars/OneDrive/Desktop/Projects/SmartView/gate-control/esp32-single-led/esp32_single_led.ino) in Arduino IDE.
2. In lines 26–27, enter your 2.4GHz WiFi name and password:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_Name";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   ```
3. In Arduino IDE:
   - Go to **Tools -> Board -> ESP32 Arduino -> DOIT ESP32 DEVKIT V1** (or ESP32 Dev Module).
   - Go to **Tools -> Port** and select your ESP32 COM port (e.g., COM3, COM4, COM5).
   - Install libraries from **Tools -> Manage Libraries**:
     - `PubSubClient` (by Nick O'Leary)
     - `ArduinoJson` (by Benoît Blanchon)
4. Click **Upload** (Arrow icon).
   *(If it says `Connecting........____`, press and hold the **BOOT** button on your ESP32 for 2 seconds until uploading starts).*
5. Open Serial Monitor at **115200 baud** to see your ESP32 obtain an IP address and connect to MQTT!

### Bonus: Wireless Over-The-Air (OTA) Updates!
The sketch includes **ArduinoOTA**. After the initial USB upload:
- Your ESP32 will show up wirelessly in Arduino IDE under **Tools -> Port -> Network Ports (SmartControl-LED-001)**.
- You can upload future changes directly over Wi-Fi without ever plugging in a USB cable!

---

## 4. How the Website Controls the LED (Architecture Flow)

```text
[ Browser Dashboard ]
        │  Click "SWITCH LED ON"
        ▼
[ Backend API (localhost:5000) ]
        │  Publishes MQTT JSON: {"command":"TURN_ON", "state":"ON"}
        ▼
[ MQTT Broker (broker.hivemq.com:1883) ]
  Topic: smartview/devices/LED-001/command
        │
        ▼
[ Physical ESP32 Hardware ]
        │  Receives MQTT message
        │  Sets GPIO 2 HIGH (LED turns ON!)
        ▼
  Publishes Status: smartview/devices/LED-001/status
        │
        ▼
[ Backend & WebSocket ]
        │
        ▼
[ Browser Dashboard ] (Button immediately shows "LED ON" with green glow!)
```

---

## 5. Testing Right Now

1. Sign in to your dashboard at `http://localhost:5174/dashboard`.
2. Look at **Operation 03: SINGLE LED CONTROLLER**.
3. Click **SWITCH LED ON**:
   - The command is dispatched.
   - Your physical ESP32 turns on the LED on GPIO 2!
4. Click **SWITCH LED OFF**:
   - The LED turns off immediately.
