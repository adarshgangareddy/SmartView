#ifndef STREETLIGHT_CONFIG_H
#define STREETLIGHT_CONFIG_H

#include <Arduino.h>

// =============================================================================
// SMARTVIEW — SMART STREET LIGHTING HARDWARE CONFIGURATION
// Tested on ESP32 / Arduino Nano architecture with LDR + 4x IR + 4x PWM LED
// =============================================================================

// 1. Device Identification
#define DEVICE_ID           "STREETLIGHT-001"
#define FIRMWARE_VERSION    "1.0.0"

// 2. Wi-Fi Configuration
#define WIFI_SSID           "YOUR_WIFI_SSID"
#define WIFI_PASSWORD       "YOUR_WIFI_PASSWORD"

// 3. MQTT Broker Configuration (Shared SmartView Broker)
#define MQTT_BROKER_HOST    "your-mqtt-broker-host.com"
#define MQTT_BROKER_PORT    1883        // 8883 for TLS/SSL
#define MQTT_USERNAME       "your_mqtt_username"
#define MQTT_PASSWORD       "your_mqtt_password"
#define MQTT_CLIENT_ID      "ESP32-STREETLIGHT-001"

// 4. Hardware Pin Mapping (Compatible with ESP32-WROOM-32)
// LDR Ambient Light Sensor (Digital Output module)
#define PIN_LDR             34          // Input pin for LDR DO (Active LOW for darkness)

// 4x Infrared Obstacle/Vehicle Motion Sensors (Active LOW when motion detected)
#define PIN_IR_1            25          // Zone 1 Motion Sensor
#define PIN_IR_2            26          // Zone 2 Motion Sensor
#define PIN_IR_3            27          // Zone 3 Motion Sensor
#define PIN_IR_4            14          // Zone 4 Motion Sensor

// 4x Street Light LED Lamp Pins (PWM driven)
#define PIN_LED_1           16          // Lamp 1 Output
#define PIN_LED_2           17          // Lamp 2 Output
#define PIN_LED_3           18          // Lamp 3 Output
#define PIN_LED_4           19          // Lamp 4 Output

// 5. Illumination Level Constants
#define DIM_BRIGHTNESS      60          // ~24% Duty cycle for night idle illumination
#define FULL_BRIGHTNESS     255         // 100% Duty cycle when vehicle/object is present
#define OFF_BRIGHTNESS      0           // 0% Duty cycle for daytime

// 6. Timing & Watchdogs
#define HEARTBEAT_INTERVAL_MS       30000 // Heartbeat ping to SmartView every 30 seconds
#define SENSOR_POLL_INTERVAL_MS     100   // Responsive sensor polling (100ms)
#define TELEMETRY_THROTTLE_MS       500   // Prevent flooding broker on rapid motion

#endif // STREETLIGHT_CONFIG_H
