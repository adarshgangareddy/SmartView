#ifndef OTA_MANAGER_H
#define OTA_MANAGER_H

#include <Arduino.h>
#include <ArduinoOTA.h>
#include "config.h"

class OtaManager {
public:
  OtaManager();
  void begin();
  void loop();

private:
  bool isReady;
};

#endif // OTA_MANAGER_H
