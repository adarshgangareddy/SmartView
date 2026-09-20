#include "OtaManager.h"

OtaManager::OtaManager() : isReady(false) {}

void OtaManager::begin() {
  ArduinoOTA.setHostname(DEVICE_ID);
  
  // Optional OTA password for remote site security
  // ArduinoOTA.setPassword("gate_admin_ota_secret");

  ArduinoOTA.onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH) {
      type = "sketch";
    } else {
      type = "filesystem";
    }
    Serial.println("[OTA] Start updating " + type);
  });

  ArduinoOTA.onEnd([]() {
    Serial.println("\n[OTA] Firmware update complete. Rebooting node...");
  });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("[OTA Progress] %u%%\r", (progress / (total / 100)));
  });

  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("[OTA ERROR] [%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR) Serial.println("End Failed");
  });

  ArduinoOTA.begin();
  isReady = true;
  Serial.println("[OTA] ArduinoOTA service initialized and listening for remote firmware.");
}

void OtaManager::loop() {
  if (isReady) {
    ArduinoOTA.handle();
  }
}
