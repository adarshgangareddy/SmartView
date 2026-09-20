# ESP32 Gate Controller Firmware

Production-grade C++ firmware for an ESP32-WROOM-32 controlling a motorized security gate located ~500 km away.

---

## 1. Key Capabilities

- **Autonomous Offline Schedule**: Operates gate at scheduled open/close times using high-precision DS3231 I2C RTC and non-volatile flash storage (`Preferences.h`). Continues working uninterrupted even if Wi-Fi or Internet is disconnected for weeks.
- **Fail-Safe Motor Protection**: Hardware-level relay interlock prevents simultaneous forward/reverse actuation. Software watchdog timer forcibly cuts power after 20 seconds if limit switches fail.
- **Bi-Directional MQTT**: Remote manual `OPEN` and `CLOSE` commands with acknowledgement reporting (`COMMAND_ACKNOWLEDGED`).
- **Periodic Heartbeat & LWT**: Publishes alive heartbeats every 30s. Automatically notifies backend of offline state via MQTT Last Will and Testament (LWT) if power dies.
- **OTA Ready**: Built with `ArduinoOTA` hooks for remote wireless firmware flashing.

---

## 2. Hardware Wiring Diagram

| ESP32 Pin | Connected Component | Notes |
|---|---|---|
| **GPIO 26** | Relay 1 (Gate OPEN) | Opto-isolated relay driver (Forward) |
| **GPIO 27** | Relay 2 (Gate CLOSE) | Opto-isolated relay driver (Reverse) |
| **GPIO 32** | Open Limit Switch | Active LOW (Triggered when fully open) |
| **GPIO 33** | Closed Limit Switch | Active LOW (Triggered when fully closed) |
| **GPIO 21** | DS3231 SDA | I2C Data line with 4.7kΩ pullup |
| **GPIO 22** | DS3231 SCL | I2C Clock line with 4.7kΩ pullup |
| **GPIO 2**  | Diagnostic LED | Onboard status indicator |
| **GND**     | Common System Ground | Connected to relay & sensor GND |

---

## 3. Required Arduino Libraries

Install the following libraries via Arduino Library Manager or `platformio.ini`:
1. **PubSubClient** (by Nick O'Leary) - `v2.8.0` or higher
2. **ArduinoJson** (by Benoît Blanchon) - `v6.21.0` or higher
3. **RTClib** (by Adafruit) - `v2.1.0` or higher

---

## 4. Flashing Instructions

### Using Arduino IDE:
1. Open Arduino IDE -> Tools -> Board -> Select `ESP32 Dev Module`.
2. Open `src/main.cpp` (or rename directory to `esp32` and `main.cpp` to `esp32.ino`).
3. Edit `config.h` to supply your Wi-Fi SSID, Password, and MQTT broker details.
4. Connect ESP32 via USB and click **Upload**.
5. Open Serial Monitor at **115200 baud** to view real-time diagnostics.

### Using PlatformIO:
```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200
lib_deps =
    knolleary/PubSubClient@^2.8
    bblanchon/ArduinoJson@^6.21.3
    adafruit/RTClib@^2.1.3
```
Run:
```bash
pio run -t upload
pio device monitor
```
