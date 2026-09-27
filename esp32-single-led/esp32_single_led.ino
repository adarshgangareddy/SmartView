/**
 * =============================================================================
 * SMARTCONTROL / SMARTVIEW — ESP32 SINGLE LED CONTROLLER FIRMWARE
 * =============================================================================
 * Target Node ID: LED-001
 * Hardware: ESP32 Development Board (NodeMCU / DevKit V1)
 * Actuator: Single LED (Built-in Blue LED on GPIO 2 + Breadboard External LED)
 *
 * Capabilities:
 * - Real-time bidirectional MQTT control (TURN_ON, TURN_OFF)
 * - Hardware acknowledgement and state feedback
 * - Wireless Over-The-Air (ArduinoOTA) firmware updates
 * - Auto-reconnecting WiFi & MQTT watchdog
 * =============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ArduinoOTA.h>

// =============================================================================
// 1. CONFIGURATION (UPDATE WIFI & BROKER HERE)
// =============================================================================

// Wi-Fi Credentials
const char* WIFI_SSID     = "YOUR_WIFI_NAME";     // <-- Replace with your 2.4GHz WiFi name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // <-- Replace with your WiFi password

// MQTT Broker Configuration (Use HiveMQ public broker for zero-setup instant testing)
const char* MQTT_BROKER   = "broker.hivemq.com";  // Free public broker, works instantly
const int   MQTT_PORT     = 1883;
const char* MQTT_USER     = "";                   // Leave empty for broker.hivemq.com
const char* MQTT_PASSWORD = "";                   // Leave empty for broker.hivemq.com

// Device Identity & Topics
const char* DEVICE_ID     = "LED-001";
const char* TOPIC_COMMAND = "smartview/devices/LED-001/command";
const char* TOPIC_STATUS  = "smartview/devices/LED-001/status";
const char* TOPIC_HEARTBEAT = "smartview/devices/LED-001/heartbeat";

// Hardware Pin (GPIO 2 is the ESP32 on-board blue LED AND can be wired to breadboard)
const int LED_PIN = 2;

// =============================================================================
// 2. GLOBAL OBJECTS & STATE
// =============================================================================
WiFiClient espClient;
PubSubClient mqttClient(espClient);

bool ledState = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 30000; // 30 seconds

// =============================================================================
// 3. WIFI SETUP & RECONNECT
// =============================================================================
void setupWiFi() {
  delay(100);
  Serial.println();
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] Failed to connect. Will retry in loop...");
  }
}

// =============================================================================
// 4. OVER-THE-AIR (OTA) UPDATES SETUP
// =============================================================================
void setupOTA() {
  ArduinoOTA.setHostname("SmartControl-LED-001");

  ArduinoOTA.onStart([]() {
    String type = (ArduinoOTA.getCommand() == U_FLASH) ? "sketch" : "filesystem";
    Serial.println("[OTA] Wireless firmware update started: " + type);
  });

  ArduinoOTA.onEnd([]() {
    Serial.println("\n[OTA] Update completed successfully! Rebooting ESP32...");
  });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("[OTA] Progress: %u%%\r", (progress / (total / 100)));
  });

  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("[OTA] Error[%u]: ", error);
  });

  ArduinoOTA.begin();
  Serial.println("[OTA] Wireless OTA service active. You can now upload code over WiFi!");
}

// =============================================================================
// 5. STATUS REPORTING TO SMARTCONTROL
// =============================================================================
void publishStatus() {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["online"] = true;
  doc["lightStatus"] = ledState ? "ON" : "OFF";
  doc["state"] = ledState ? "ON" : "OFF";
  doc["pin"] = LED_PIN;
  doc["timestamp"] = millis();

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(TOPIC_STATUS, buffer);

  Serial.print("[MQTT] Published status to ");
  Serial.print(TOPIC_STATUS);
  Serial.print(": ");
  Serial.println(buffer);
}

void publishHeartbeat() {
  StaticJsonDocument<200> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["status"] = "ONLINE";
  doc["rssi"] = WiFi.RSSI();
  doc["uptimeSec"] = millis() / 1000;
  doc["lightStatus"] = ledState ? "ON" : "OFF";

  char buffer[200];
  serializeJson(doc, buffer);
  mqttClient.publish(TOPIC_HEARTBEAT, buffer);
}

// =============================================================================
// 6. MQTT INCOMING COMMAND HANDLER
// =============================================================================
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  Serial.print("[MQTT] Command received on topic: ");
  Serial.println(topic);

  // Parse incoming JSON command
  StaticJsonDocument<384> doc;
  DeserializationError err = deserializeJson(doc, payload, length);

  if (err) {
    Serial.print("[MQTT] JSON parse error: ");
    Serial.println(err.c_str());
    return;
  }

  const char* command = doc["command"] | "";
  const char* state   = doc["state"] | "";

  Serial.printf("[MQTT] Command: '%s' | State: '%s'\n", command, state);

  // Check command intent
  if (strcmp(command, "TURN_ON") == 0 || strcmp(state, "ON") == 0) {
    digitalWrite(LED_PIN, HIGH);
    ledState = true;
    Serial.println("[HARDWARE] >>> LED TURNED ON (GPIO 2 HIGH) <<<");
    publishStatus();
  } else if (strcmp(command, "TURN_OFF") == 0 || strcmp(state, "OFF") == 0) {
    digitalWrite(LED_PIN, LOW);
    ledState = false;
    Serial.println("[HARDWARE] >>> LED TURNED OFF (GPIO 2 LOW) <<<");
    publishStatus();
  } else if (strcmp(command, "TOGGLE") == 0) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState ? HIGH : LOW);
    Serial.printf("[HARDWARE] >>> LED TOGGLED -> %s <<<\n", ledState ? "ON" : "OFF");
    publishStatus();
  }
}

// =============================================================================
// 7. MQTT CONNECTION & SUBSCRIPTION
// =============================================================================
void reconnectMqtt() {
  while (!mqttClient.connected()) {
    Serial.print("[MQTT] Attempting connection to ");
    Serial.print(MQTT_BROKER);
    Serial.print("...");

    String clientId = "ESP32-LED-001-" + String(random(0xffff), HEX);

    bool connected = false;
    if (strlen(MQTT_USER) > 0) {
      connected = mqttClient.connect(clientId.c_str(), MQTT_USER, MQTT_PASSWORD);
    } else {
      connected = mqttClient.connect(clientId.c_str());
    }

    if (connected) {
      Serial.println(" CONNECTED!");
      // Subscribe to command topic
      mqttClient.subscribe(TOPIC_COMMAND);
      Serial.print("[MQTT] Subscribed to: ");
      Serial.println(TOPIC_COMMAND);

      // Report initial state
      publishStatus();
    } else {
      Serial.print(" Failed (rc=");
      Serial.print(mqttClient.state());
      Serial.println("). Retrying in 5 seconds...");
      delay(5000);
    }
  }
}

// =============================================================================
// 8. SETUP
// =============================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n=============================================");
  Serial.println("  SmartControl ESP32 Single LED Controller   ");
  Serial.println("=============================================");

  // Initialize LED Pin
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW); // Start with LED OFF

  // Connect WiFi
  setupWiFi();

  // Setup Over-The-Air Wireless Uploads
  setupOTA();

  // Configure MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);
  mqttClient.setBufferSize(512);
}

// =============================================================================
// 9. MAIN LOOP
// =============================================================================
void loop() {
  // Handle Wireless OTA updates
  ArduinoOTA.handle();

  // Ensure WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
    return;
  }

  // Ensure MQTT is connected
  if (!mqttClient.connected()) {
    reconnectMqtt();
  }
  mqttClient.loop();

  // Periodic heartbeat
  unsigned long now = millis();
  if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    lastHeartbeat = now;
    publishHeartbeat();
  }
}
