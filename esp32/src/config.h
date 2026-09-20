#ifndef GATE_CONFIG_H
#define GATE_CONFIG_H

#include <Arduino.h>

// =============================================================================
// REMOTE IOT GATE CONTROLLER - HARDWARE & NETWORK CONFIGURATION
// =============================================================================

// 1. Target Device Identification
#define DEVICE_ID           "GATE-001"
#define FIRMWARE_VERSION    "1.0.0"

// 2. Wi-Fi Configuration (Replace with actual credentials in real hardware)
#define WIFI_SSID           "YOUR_WIFI_SSID"
#define WIFI_PASSWORD       "YOUR_WIFI_PASSWORD"

// 3. MQTT Broker Configuration
// e.g. "broker.hivemq.com" or "your-cluster.hivemq.cloud"
#define MQTT_BROKER_HOST    "your-mqtt-broker-host.com"
#define MQTT_BROKER_PORT    1883        // 8883 for TLS/SSL
#define MQTT_USERNAME       "your_mqtt_username"
#define MQTT_PASSWORD       "your_mqtt_password"
#define MQTT_CLIENT_ID      "ESP32-GATE-001"

// 4. Hardware Pin Allocations (ESP32-WROOM-32)
// Motor Relay Control Pins (Active HIGH or LOW depending on relay module)
#define PIN_RELAY_OPEN      26          // Relay to drive motor forward (Open)
#define PIN_RELAY_CLOSE     27          // Relay to drive motor reverse (Close)

// Optical / Mechanical Limit Switches (Active LOW with internal PULLUP)
#define PIN_LIMIT_OPEN      32          // Switch triggered when gate reaches fully open position
#define PIN_LIMIT_CLOSED    33          // Switch triggered when gate reaches fully closed position

// Diagnostic Status LED
#define PIN_STATUS_LED      2           // Onboard diagnostic LED

// DS3231 I2C RTC Pins
#define PIN_I2C_SDA         21
#define PIN_I2C_SCL         22

// 5. Fail-Safe Motor Protection & Watchdog Constants
#define RELAY_ACTIVE_STATE          LOW   // LOW for common opto-isolated relay modules, HIGH for logic level
#define RELAY_INACTIVE_STATE        HIGH
#define MAX_MOTOR_TRAVEL_SECONDS    20    // Watchdog cuts power if limit switch not hit within 20s
#define HEARTBEAT_INTERVAL_MS       30000 // Send heartbeat to MQTT every 30 seconds
#define SCHEDULE_CHECK_INTERVAL_MS  5000  // Evaluate RTC schedule every 5 seconds

#endif // GATE_CONFIG_H
