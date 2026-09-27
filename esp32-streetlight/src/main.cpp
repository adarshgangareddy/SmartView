#include <Arduino.h>
#include "config.h"
#include "LightController.h"
#include "MqttManager.h"

LightController lightController;
MqttManager mqttManager(lightController);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println(" SMARTVIEW — SMART STREET LIGHTING NODE");
  Serial.printf(" Device ID: %s | Firmware: v%s\n", DEVICE_ID, FIRMWARE_VERSION);
  Serial.println(" Sensors: 1x LDR + 4x IR | Outputs: 4x PWM LED Array");
  Serial.println("=======================================================");

  // 1. Initialize Hardware Pins & Sensors
  lightController.begin();

  // 2. Register Telemetry State Change Listener
  // When motion is detected in any zone or daylight transitions, immediately publish to SmartView!
  lightController.onTelemetryChange([](const StreetLightState& state) {
    Serial.println("[EVENT] Physical sensor state changed. Publishing real-time telemetry...");
    mqttManager.publishTelemetry(state);
    mqttManager.publishStatus();
  });

  // 3. Initialize Wi-Fi & MQTT Connectivity
  mqttManager.begin();

  Serial.println("[SYSTEM] Setup complete. Realtime sensor monitoring loop started.");
}

void loop() {
  // Fast loop servicing MQTT network packets
  mqttManager.loop();

  // Fast loop polling physical LDR & 4x IR sensors
  lightController.loop();

  delay(10);
}
