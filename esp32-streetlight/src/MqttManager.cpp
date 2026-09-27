#include "MqttManager.h"

MqttManager::MqttManager(LightController& controller)
  : lightController(controller),
    mqttClient(wifiClient),
    lastReconnectAttempt(0),
    lastHeartbeatTime(0) {
  topicCommand   = String("smartview/devices/") + DEVICE_ID + "/command";
  topicStatus    = String("smartview/devices/") + DEVICE_ID + "/status";
  topicTelemetry = String("smartview/devices/") + DEVICE_ID + "/telemetry";
  topicAck       = String("smartview/devices/") + DEVICE_ID + "/ack";
  topicHeartbeat = String("smartview/devices/") + DEVICE_ID + "/heartbeat";
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

  Serial.printf("[WIFI] Connecting to %s...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

bool MqttManager::connectMqtt() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  Serial.printf("[MQTT] Connecting to broker %s:%d...\n", MQTT_BROKER_HOST, MQTT_BROKER_PORT);

  // LWT payload: Automatically flags device OFFLINE in SmartView if power drops
  String lwt = String("{\"deviceId\":\"") + DEVICE_ID + "\",\"online\":false}";

  bool ok = false;
  if (strlen(MQTT_USERNAME) > 0) {
    ok = mqttClient.connect(
      MQTT_CLIENT_ID,
      MQTT_USERNAME,
      MQTT_PASSWORD,
      topicStatus.c_str(),
      1,
      true,
      lwt.c_str()
    );
  } else {
    ok = mqttClient.connect(
      MQTT_CLIENT_ID,
      topicStatus.c_str(),
      1,
      true,
      lwt.c_str()
    );
  }

  if (ok) {
    Serial.println("[MQTT] Connected to SmartView Broker.");
    mqttClient.subscribe(topicCommand.c_str(), 1);

    publishStatus();
    publishTelemetry(lightController.getState());
    return true;
  } else {
    Serial.printf("[MQTT ERROR] Connection failed, rc=%d\n", mqttClient.state());
    return false;
  }
}

void MqttManager::loop() {
  if (WiFi.status() != WL_CONNECTED) {
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

    // Send heartbeat every 30 seconds
    if (millis() - lastHeartbeatTime > HEARTBEAT_INTERVAL_MS) {
      lastHeartbeatTime = millis();
      publishHeartbeat();
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
    Serial.printf("[JSON ERROR] Parse error: %s\n", err.c_str());
    return;
  }

  const char* command = doc["command"];
  const char* requestId = doc["requestId"] | "no-id";

  if (!command) return;

  if (strcmp(command, "TURN_ON") == 0) {
    lightController.setAllLamps(FULL_BRIGHTNESS);
    publishAck(requestId, "TURN_ON", true);
    publishStatus();
  } else if (strcmp(command, "TURN_OFF") == 0) {
    lightController.setAllLamps(OFF_BRIGHTNESS);
    publishAck(requestId, "TURN_OFF", true);
    publishStatus();
  } else if (strcmp(command, "SET_MODE") == 0 || strcmp(command, "SET_LIGHT_MODE") == 0) {
    const char* mode = doc["mode"];
    if (mode && strcmp(mode, "AUTO") == 0) {
      lightController.setMode(LIGHT_MODE_AUTO);
    } else if (mode && strcmp(mode, "MANUAL") == 0) {
      lightController.setMode(LIGHT_MODE_MANUAL);
    }
    publishAck(requestId, "SET_MODE", true);
    publishStatus();
  } else if (strcmp(command, "SET_ZONE") == 0) {
    int zone = doc["zone"] | 1;
    int brightness = doc["brightness"] | 255;
    lightController.setLamp(zone - 1, (uint8_t)brightness);
    publishAck(requestId, "SET_ZONE", true);
    publishStatus();
  }
}

void MqttManager::publishTelemetry(const StreetLightState& state) {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["isNight"] = state.isNight;
  doc["ambientLight"] = state.isNight ? "NIGHT" : "DAY";

  JsonObject zones = doc.createNestedObject("motionZones");
  zones["zone1"] = state.motion[0];
  zones["zone2"] = state.motion[1];
  zones["zone3"] = state.motion[2];
  zones["zone4"] = state.motion[3];

  JsonObject leds = doc.createNestedObject("ledBrightness");
  leds["led1"] = state.brightness[0];
  leds["led2"] = state.brightness[1];
  leds["led3"] = state.brightness[2];
  leds["led4"] = state.brightness[3];

  doc["mode"] = (state.mode == LIGHT_MODE_AUTO) ? "AUTO" : "MANUAL";
  doc["timestamp"] = String(millis());

  char buffer[512];
  serializeJson(doc, buffer);
  mqttClient.publish(topicTelemetry.c_str(), buffer, false);
  Serial.printf("[MQTT TELEMETRY] %s -> %s\n", topicTelemetry.c_str(), buffer);
}

void MqttManager::publishStatus() {
  if (!mqttClient.connected()) return;

  const StreetLightState& s = lightController.getState();
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["online"] = true;
  doc["mode"] = (s.mode == LIGHT_MODE_AUTO) ? "AUTO" : "MANUAL";

  bool allFull = s.brightness[0] >= 200 && s.brightness[1] >= 200 && s.brightness[2] >= 200 && s.brightness[3] >= 200;
  bool anyOn = s.brightness[0] > 0 || s.brightness[1] > 0 || s.brightness[2] > 0 || s.brightness[3] > 0;

  if (s.mode == LIGHT_MODE_AUTO) {
    doc["lightStatus"] = "ADAPTIVE";
  } else if (allFull) {
    doc["lightStatus"] = "ON";
  } else if (anyOn) {
    doc["lightStatus"] = "DIM";
  } else {
    doc["lightStatus"] = "OFF";
  }

  doc["firmwareVersion"] = FIRMWARE_VERSION;

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(topicStatus.c_str(), buffer, true);
}

void MqttManager::publishHeartbeat() {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<200> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["status"] = "ONLINE";
  doc["timestamp"] = String(millis());

  char buffer[200];
  serializeJson(doc, buffer);
  mqttClient.publish(topicHeartbeat.c_str(), buffer, false);
}

void MqttManager::publishAck(const char* requestId, const char* command, bool success) {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["requestId"] = requestId;
  doc["command"] = command;
  doc["status"] = success ? "ACKNOWLEDGED" : "FAILED";

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(topicAck.c_str(), buffer, false);
}

bool MqttManager::isConnected() {
  return mqttClient.connected();
}
