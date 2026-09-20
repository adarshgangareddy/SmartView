#ifndef MQTT_MANAGER_H
#define MQTT_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "GateController.h"
#include "ScheduleManager.h"
#include "RtcManager.h"

class MqttManager {
public:
  MqttManager(GateController& gate, ScheduleManager& sched, RtcManager& rtc);
  void begin();
  void loop();

  void publishStatus();
  void publishHeartbeat();
  void publishAck(const char* requestId, const char* command, bool success);
  void publishTelemetry();

  bool isConnected();

private:
  GateController& gateController;
  ScheduleManager& scheduleManager;
  RtcManager& rtcManager;

  WiFiClient wifiClient;
  PubSubClient mqttClient;

  unsigned long lastReconnectAttempt;
  unsigned long lastHeartbeatTime;
  unsigned long lastTelemetryTime;

  void connectWiFi();
  bool connectMqtt();
  void handleMessage(char* topic, byte* payload, unsigned int length);

  String topicCommand;
  String topicStatus;
  String topicConfig;
  String topicAck;
  String topicHeartbeat;
  String topicTelemetry;
};

#endif // MQTT_MANAGER_H
