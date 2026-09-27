#ifndef STREETLIGHT_MQTT_H
#define STREETLIGHT_MQTT_H

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "LightController.h"

#if MQTT_BROKER_PORT == 8883
#include <WiFiClientSecure.h>
#endif

class MqttManager {
public:
  MqttManager(LightController& controller);
  void begin();
  void loop();

  void publishTelemetry(const StreetLightState& state);
  void publishHeartbeat();
  void publishStatus();
  void publishAck(const char* requestId, const char* command, bool success);

  bool isConnected();

private:
  LightController& lightController;
#if MQTT_BROKER_PORT == 8883
  WiFiClientSecure wifiClient;
#else
  WiFiClient wifiClient;
#endif
  PubSubClient mqttClient;

  unsigned long lastReconnectAttempt;
  unsigned long lastHeartbeatTime;

  String topicCommand;
  String topicStatus;
  String topicTelemetry;
  String topicAck;
  String topicHeartbeat;

  void connectWiFi();
  bool connectMqtt();
  void handleMessage(char* topic, byte* payload, unsigned int length);
};

#endif // STREETLIGHT_MQTT_H
