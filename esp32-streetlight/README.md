# SmartView — Smart Street Lighting Firmware

ESP32 / Arduino firmware for the real physical Smart Street Lighting prototype integrated with the **SmartView** platform.

---

## 1. Physical Hardware Components (Exact System Mapping)

This firmware is written directly for your real physical prototype:
- **1x LDR Ambient Light Module**: Detects Day/Night conditions (`LOW` = Nighttime darkness).
- **4x Infrared Obstacle/Motion Sensors (`IR1` to `IR4`)**: Detects approaching vehicles/objects across 4 roadway segments (`LOW` = Motion detected).
- **4x Street Light LEDs (`LED1` to `LED4`)**: Independent PWM dimming (0% in daylight, 24% dim in night idle, 100% full brightness upon vehicle approach).

---

## 2. Wiring & Pin Allocation Table

| Component | Physical Pin Label | Arduino Nano Equivalent | ESP32 GPIO Pin | Notes |
|---|---|---|---|---|
| **LDR Sensor DO** | Digital Output | `D7` | **GPIO 34** | Active LOW in darkness |
| **IR Sensor 1** | Digital Output | `D2` | **GPIO 25** | Section 1 vehicle detection |
| **IR Sensor 2** | Digital Output | `D3` | **GPIO 26** | Section 2 vehicle detection |
| **IR Sensor 3** | Digital Output | `D4` | **GPIO 27** | Section 3 vehicle detection |
| **IR Sensor 4** | Digital Output | `D5` | **GPIO 14** | Section 4 vehicle detection |
| **Lamp 1 (LED 1)** | Anode through Resistor | `D6` (PWM) | **GPIO 16** | PWM Channel 0 |
| **Lamp 2 (LED 2)** | Anode through Resistor | `D9` (PWM) | **GPIO 17** | PWM Channel 1 |
| **Lamp 3 (LED 3)** | Anode through Resistor | `D10` (PWM) | **GPIO 18** | PWM Channel 2 |
| **Lamp 4 (LED 4)** | Anode through Resistor | `D11` (PWM) | **GPIO 19** | PWM Channel 3 |
| **VCC Power** | Sensor VCC | `5V` | **VIN / 5V** | Power rail |
| **GND** | Sensor/LED Ground | `GND` | **GND** | Common ground |

*(Note: If using Arduino Nano with ESP-01 or directly on an ESP32 board, the pin mappings can be adjusted in `src/config.h`).*

---

## 3. Required Libraries

- **PubSubClient** (by Nick O'Leary)
- **ArduinoJson** (v6.x or v7.x by Benoît Blanchon)

---

## 4. How It Works

1. **Daytime Mode**:
   - LDR detects light (`HIGH`). All 4 LEDs are driven at `0` (OFF) regardless of motion.
2. **Nighttime Mode**:
   - LDR detects darkness (`LOW`).
   - If no motion in a zone: LED operates at `DIM_BRIGHTNESS` (60 / ~24%).
   - If IR sensor detects a vehicle: that zone's LED immediately jumps to `FULL_BRIGHTNESS` (255 / 100%).
3. **SmartView Real-time Synchronization**:
   - Whenever any sensor trips, the ESP32 publishes an MQTT packet to `smartview/devices/STREETLIGHT-001/telemetry`.
   - The SmartView backend broadcasts it over WebSocket directly to the React dashboard.
   - The dashboard updates in real time without refreshing!
