#include <Arduino.h>
#include "config.h"
#include "GateController.h"
#include "RtcManager.h"
#include "ScheduleManager.h"
#include "MqttManager.h"
#include "OtaManager.h"

// Hardware instances
GateController gateController;
RtcManager rtcManager;
ScheduleManager scheduleManager(gateController, rtcManager);
MqttManager mqttManager(gateController, scheduleManager, rtcManager);
OtaManager otaManager;

void setup() {
  // 1. Initialize Serial debugging interface
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println(" REMOTE IOT GATE CONTROLLER (ESP32-WROOM-32)");
  Serial.printf(" Node Device ID: %s | Firmware: v%s\n", DEVICE_ID, FIRMWARE_VERSION);
  Serial.println(" Autonomous RTC + NVS Weekly Scheduling Engine");
  Serial.println("=======================================================");

  // 2. Initialize Hardware Gate Controller & Relays
  gateController.begin();

  // 3. Initialize DS3231 I2C Real-Time Clock
  if (!rtcManager.begin()) {
    Serial.println("[WARN] Proceeding without battery RTC. Time must be synchronized from NTP.");
  }

  // 4. Initialize Local Non-Volatile Schedule Storage (NVS)
  scheduleManager.begin();

  // 5. Register Gate State Change Listener to broadcast MQTT status
  gateController.onStateChange([](GateState newState) {
    Serial.printf("[EVENT] Broadcasting gate state change to MQTT...\n");
    mqttManager.publishStatus();
  });

  // 6. Initialize Wi-Fi and MQTT Connectivity
  mqttManager.begin();

  // 7. Initialize Remote OTA Firmware Upgrades
  otaManager.begin();

  Serial.println("[SYSTEM] Setup completed successfully. Operating loop started.");
}

void loop() {
  // Service MQTT communication and subscriptions
  mqttManager.loop();

  // Monitor physical limit switches and motor watchdog timers
  gateController.loop();

  // Check autonomous weekly schedule against local RTC
  scheduleManager.loop();

  // Check for incoming OTA firmware upload streams
  otaManager.loop();

  // Yield to RTOS watchdog
  delay(10);
}
