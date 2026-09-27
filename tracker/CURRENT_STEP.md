# 🚀 SMARTCONTROL / SMARTVIEW — HARDWARE STEP TRACKER

> **LAST UPDATED:** Real-Time Tracking Session  
> **STATUS:** 🔴 WAITING FOR PHYSICAL DEVICE CONNECTION  
> **CURRENT ACTIVE STEP:** 👉 **STEP 3: ADD WI-FI CREDENTIALS & FLASH ESP32**  
> **TARGET HARDWARE NODE:** `LED-001` (ESP32 Development Board)

---

## 📍 WHERE YOU ARE RIGHT NOW

Your website and backend are **fully running, authenticated, and ready**:
- **SmartControl Login Redesign**: Completed with clean enterprise industrial aesthetics and sanitized error handling.
- **Operation 03 (Single LED Controller)**: Integrated on the Central Operations Hub (`/dashboard`).
- **Offline Device Detection & Modal Guide**: Fully functional. The dashboard shows:
  > **⚠️ Device is not connected (OFFLINE)**  
  > *(This is expected until you flash the ESP32 with your Wi-Fi credentials).*

---

## 🎯 NEXT IMMEDIATE ACTION: DO THIS NOW

### 1. Open the ESP32 Code File:
Open this file in Arduino IDE:  
👉 [gate-control/esp32-single-led/esp32_single_led.ino](file:///c:/Users/adars/OneDrive/Desktop/Projects/SmartView/gate-control/esp32-single-led/esp32_single_led.ino)

### 2. Update Lines 27–28 With Your Wi-Fi:
Replace the placeholder text with your actual home/mobile hotspot Wi-Fi (must be 2.4GHz):

```cpp
// Wi-Fi Credentials
const char* WIFI_SSID     = "YOUR_WIFI_NAME";     // <-- Put your 2.4GHz Wi-Fi name here
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // <-- Put your Wi-Fi password here
```

### 3. Verify Required Arduino Libraries:
In Arduino IDE, go to **Tools -> Manage Libraries...** and ensure these 2 libraries are installed:
1. **PubSubClient** (by Nick O'Leary)
2. **ArduinoJson** (by Benoît Blanchon)

### 4. Upload to ESP32:
1. Connect your ESP32 board to your PC with your USB data cable.
2. In Arduino IDE: **Tools -> Board -> ESP32 Arduino -> DOIT ESP32 DEVKIT V1** (or ESP32 Dev Module).
3. In Arduino IDE: **Tools -> Port** and select your COM port (e.g. `COM3`, `COM4`, `COM5`).
4. Click **Upload** (Arrow icon).  
   *(If you see `Connecting........___` in the bottom terminal, press and hold the **BOOT** button on your ESP32 for 2 seconds until the upload starts).*
5. Open **Serial Monitor** at **115200 baud** to see:
   ```text
   [WiFi] Connected successfully!
   [WiFi] IP Address: 192.168.x.x
   [MQTT] Attempting connection to broker.hivemq.com... CONNECTED!
   [MQTT] Subscribed to: smartview/devices/LED-001/command
   ```

---

## 🔌 HARDWARE WIRING (BREADBOARD)

```text
      ESP32 Board                      Breadboard Circuit
     ┌───────────┐
     │           │
     │   GPIO 2  ├───────► [ 220Ω Resistor ] ───► [ Long Leg (+) Anode ]
     │           │                                     LED
     │    GND    ├──────────────────────────────► [ Short Leg (-) Cathode ]
     │           │
     └───────────┘
```

> **Instant Zero-Wiring Test**:  
> Most ESP32 boards have a **built-in blue LED on GPIO 2**.  
> Even without plugging any wires into the breadboard, you can test right away using the on-board blue LED!

---

## 📋 MASTER ROADMAP & PROGRESS CHECKLIST

- [x] **Step 1: Production Login Page Redesign**
  - Branded as SmartControl IoT Operations Platform.
  - Sanitized error states and production form controls.
  - Removed demo credentials; authenticated session working with `adarshavg07@gmail.com`.

- [x] **Step 2: Platform Single LED Node Added (`LED-001`)**
  - Registered `LED-001` in backend database/memory store.
  - Created Operation 03 card with instant real-time toggle.
  - Created offline device detection UI ("Device is not connected") and interactive connection guide modal.

- [ ] **Step 3: Add Wi-Fi Credentials & Upload ESP32 Code** (👉 DO THIS NOW)
  - Edit [esp32_single_led.ino](file:///c:/Users/adars/OneDrive/Desktop/Projects/SmartView/gate-control/esp32-single-led/esp32_single_led.ino).
  - Flash firmware via Arduino IDE.

- [ ] **Step 4: Verify Device Online on Website**
  - Sign in at `http://localhost:5174/dashboard`.
  - Check that the `LED-001` card badge turns from `🔴 OFFLINE` to `🟢 ONLINE`.

- [ ] **Step 5: Control the Physical LED**
  - Click **[ SWITCH LED ON ]** on your screen.
  - Physical LED on GPIO 2 turns ON!
  - Click **[ SWITCH LED OFF ]**.
  - Physical LED turns OFF!

- [ ] **Step 6: Remote Over-The-Air (OTA) Wireless Management**
  - You do **NOT** need to plug in the USB cable for future changes.
  - ArduinoOTA and Cloud MQTT commands allow remote management without physical access!

---

## 🌐 500–1000 KM REMOTE DEPLOYMENT SAFEGUARDS (FLASH ONCE, MANAGE FOREVER)

If this device is deployed **500 to 1,000 km away** where you only have **one chance** to physically upload code:

1. **Remote Cloud HTTPS OTA (Over-The-Air over Internet)**:
   - Local `ArduinoOTA` only works on the *same local Wi-Fi router*.
   - Over 500–1000 km, firmware is updated over the internet via MQTT commands telling the ESP32 to download `firmware.bin` from your web server over HTTPS.
2. **Dual-Partition Auto-Rollback**:
   - The ESP32 holds two firmware partitions (`ota_0` and `ota_1`). If a new firmware crashes upon booting, the ESP32 bootloader automatically cancels and rolls back to the previous working factory firmware. It cannot be permanently bricked over the air.
3. **Hardware Watchdog Timer (WDT)**:
   - If the code locks up or memory leaks, the ESP32 hardware watchdog automatically reboots the chip within 8–10 seconds to restore communication.
4. **Wi-Fi Fallback Captive Portal (Recovery AP)**:
   - If the site's router password ever changes, the ESP32 spawns its own fallback Wi-Fi network (`SmartControl-Recovery-AP`) so any on-site staff with a smartphone can input new Wi-Fi credentials without opening code.
5. **Dynamic Remote NVS Configuration**:
   - Pin timings, intervals, and schedules are changed remotely via JSON commands over MQTT, avoiding code recompilation entirely.

---

## ❓ TROUBLESHOOTING GUIDE

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **Website shows "Device is not connected"** | ESP32 is unplugged or not connected to MQTT | Plug in ESP32, verify Wi-Fi connected in Serial Monitor (115200 baud). |
| **Arduino IDE says "Connecting........___"** | ESP32 bootloader waiting for signal | Hold down the **BOOT** button on the ESP32 board for 2 seconds when uploading starts. |
| **COM Port not showing in Arduino IDE** | Missing USB-UART driver or charge-only cable | Use a data USB cable (not charge-only) and install the CP2102 or CH340 driver. |
| **Wi-Fi failed to connect** | 5GHz Wi-Fi or incorrect password | ESP32 only supports 2.4GHz Wi-Fi networks. Verify SSID and password. |
