#include "MqttManager.h"

MqttManager* instance = nullptr;

void globalMqttCallback(char* topic, byte* payload, unsigned int length) {
  if (instance) {
    instance->publishTelemetry(); // optional activity indicator
  }
}

MqttManager::MqttManager(GateController& gate, ScheduleManager& sched, RtcManager& rtc)
  : gateController(gate),
    scheduleManager(sched),
    rtcManager(rtc),
    mqttClient(wifiClient),
    lastReconnectAttempt(0),
    lastHeartbeatTime(0),
    lastTelemetryTime(0) {
  instance = this;

  topicCommand   = String("gate/") + DEVICE_ID + "/command";
  topicStatus    = String("gate/") + DEVICE_ID + "/status";
  topicConfig    = String("gate/") + DEVICE_ID + "/config";
  topicAck       = String("gate/") + DEVICE_ID + "/ack";
  topicHeartbeat = String("gate/") + DEVICE_ID + "/heartbeat";
  topicTelemetry = String("gate/") + DEVICE_ID + "/telemetry";
}

void MqttManager::begin() {
#if MQTT_BROKER_PORT == 8883
  wifiClient.setInsecure();
#endif
  mqttClient.setServer(MQTT_BROKER_HOST, MQTT_BROKER_PORT);
  mqttClient.setCallback([this](char* topic, byte* payload, unsigned int length) {
    this->handleMessage(topic, payload, length);
  });
  mqttClient.setBufferSize(1024);

  connectWiFi();
}

void MqttManager::connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("[WIFI] Connecting to SSID: %s...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

bool MqttManager::connectMqtt() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  Serial.printf("[MQTT] Attempting connection to %s:%d...\n", MQTT_BROKER_HOST, MQTT_BROKER_PORT);

  // Configure LWT (Last Will and Testament) payload
  // If connection drops abruptly, broker publishes offline status automatically
  String lwtPayload = String("{\"deviceId\":\"") + DEVICE_ID + "\",\"online\":false,\"gateStatus\":\"" +
                      gateController.getStateString() + "\"}";

  bool connected = false;
  if (strlen(MQTT_USERNAME) > 0) {
    connected = mqttClient.connect(
      MQTT_CLIENT_ID,
      MQTT_USERNAME,
      MQTT_PASSWORD,
      topicStatus.c_str(),
      1,
      true, // Retain LWT
      lwtPayload.c_str()
    );
  } else {
    connected = mqttClient.connect(
      MQTT_CLIENT_ID,
      topicStatus.c_str(),
      1,
      true,
      lwtPayload.c_str()
    );
  }

  if (connected) {
    Serial.println("[MQTT] Connected successfully.");

    // Subscribe to commands and configuration
    mqttClient.subscribe(topicCommand.c_str(), 1);
    mqttClient.subscribe(topicConfig.c_str(), 1);
    Serial.printf("[MQTT] Subscribed to %s and %s\n", topicCommand.c_str(), topicConfig.c_str());

    // Publish initial status and sync NTP
    publishStatus();
    rtcManager.syncWithNtp();
    return true;
  } else {
    Serial.printf("[MQTT ERROR] Connection failed, rc=%d\n", mqttClient.state());
    return false;
  }
}

void MqttManager::loop() {
  if (WiFi.status() != WL_CONNECTED) {
    // Reconnect Wi-Fi with backoff
    if (millis() - lastReconnectAttempt > 10000) {
      lastReconnectAttempt = millis();
      connectWiFi();
    }
    return;
  }

  if (!mqttClient.connected()) {
    if (millis() - lastReconnectAttempt > 5000) {
      lastReconnectAttempt = millis();
      if (connectMqtt()) {
        lastReconnectAttempt = 0;
      }
    }
  } else {
    mqttClient.loop();

    // 1. Periodic Heartbeat
    if (millis() - lastHeartbeatTime > HEARTBEAT_INTERVAL_MS) {
      lastHeartbeatTime = millis();
      publishHeartbeat();
    }

    // 2. Periodic Telemetry (every 2 minutes)
    if (millis() - lastTelemetryTime > 120000) {
      lastTelemetryTime = millis();
      publishTelemetry();
    }
  }
}

void MqttManager::handleMessage(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.printf("[MQTT RX] %s -> %s\n", topic, message.c_str());

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, message);
  if (err) {
    Serial.printf("[JSON ERROR] Parse failed: %s\n", err.c_str());
    return;
  }

  String topicStr = String(topic);

  // 1. COMMAND TOPIC: gate/GATE-001/command
  if (topicStr == topicCommand) {
    const char* command = doc["command"];
    const char* requestId = doc["requestId"] | "no-id";

    if (!command) return;

    if (strcmp(command, "OPEN") == 0) {
      bool ok = gateController.openGate();
      publishAck(requestId, "OPEN", ok);
      publishStatus();
    } else if (strcmp(command, "CLOSE") == 0) {
      bool ok = gateController.closeGate();
      publishAck(requestId, "CLOSE", ok);
      publishStatus();
    } else if (strcmp(command, "SET_MODE") == 0) {
      const char* mode = doc["mode"];
      if (mode && strcmp(mode, "AUTO") == 0) {
        gateController.setMode(MODE_AUTO);
      } else if (mode && strcmp(mode, "MANUAL") == 0) {
        gateController.setMode(MODE_MANUAL);
      }
      publishAck(requestId, "SET_MODE", true);
      publishStatus();
    }
  }
  // 2. CONFIG TOPIC: gate/GATE-001/config
  else if (topicStr == topicConfig) {
    const char* type = doc["type"];
    if (type && strcmp(type, "SCHEDULE_UPDATE") == 0) {
      int dayOfWeek = doc["dayOfWeek"] | 1;
      const char* openTimeStr = doc["openTime"] | "08:00";
      const char* closeTimeStr = doc["closeTime"] | "20:00";
      bool enabled = doc["enabled"] | true;

      int openH = 8, openM = 0, closeH = 20, closeM = 0;
      sscanf(openTimeStr, "%d:%d", &openH, &openM);
      sscanf(closeTimeStr, "%d:%d", &closeH, &closeM);

      // Save to NVS memory
      scheduleManager.saveDaySchedule(dayOfWeek, openH, openM, closeH, closeM, enabled);

      publishAck(doc["requestId"] | "sched-update", "SCHEDULE_UPDATE", true);
      publishStatus();
    }
  }
}

void MqttManager::publishStatus() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["online"] = true;
  doc["gateStatus"] = gateController.getStateString();
  doc["mode"] = gateController.getModeString();
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["timestamp"] = rtcManager.getIsoTimestamp();

  char buf[256];
  serializeJson(doc, buf);
  mqttClient.publish(topicStatus.c_str(), buf, true);
  Serial.printf("[MQTT TX] %s -> %s\n", topicStatus.c_str(), buf);
}

void MqttManager::publishHeartbeat() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<200> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = rtcManager.getIsoTimestamp();
  doc["gateStatus"] = gateController.getStateString();

  char buf[200];
  serializeJson(doc, buf);
  mqttClient.publish(topicHeartbeat.c_str(), buf, false);
}

void MqttManager::publishAck(const char* requestId, const char* command, bool success) {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["requestId"] = requestId;
  doc["command"] = command;
  doc["status"] = success ? "ACKNOWLEDGED" : "FAILED";
  doc["gateStatus"] = gateController.getStateString();
  doc["timestamp"] = rtcManager.getIsoTimestamp();

  char buf[256];
  serializeJson(doc, buf);
  mqttClient.publish(topicAck.c_str(), buf, false);
  Serial.printf("[MQTT TX] %s -> %s\n", topicAck.c_str(), buf);
}

void MqttManager::publishTelemetry() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["rssi"] = WiFi.RSSI();
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["uptime"] = millis() / 1000;
  doc["timestamp"] = rtcManager.getIsoTimestamp();

  char buf[256];
  serializeJson(doc, buf);
  mqttClient.publish(topicTelemetry.c_str(), buf, false);
}

bool MqttManager::isConnected() {
  return mqttClient.connected();
}
