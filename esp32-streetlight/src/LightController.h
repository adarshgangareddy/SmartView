#ifndef LIGHT_CONTROLLER_H
#define LIGHT_CONTROLLER_H

#include <Arduino.h>
#include "config.h"

enum LightOperatingMode {
  LIGHT_MODE_AUTO,
  LIGHT_MODE_MANUAL
};

struct StreetLightState {
  bool isNight;
  bool motion[4];        // Zone 1 to 4
  uint8_t brightness[4]; // Lamp 1 to 4 (0 to 255)
  LightOperatingMode mode;
};

typedef void (*TelemetryChangeCallback)(const StreetLightState& state);

class LightController {
public:
  LightController();
  void begin();
  void loop();

  void setMode(LightOperatingMode mode);
  LightOperatingMode getMode() const;

  void setAllLamps(uint8_t brightness);
  void setLamp(int lampIndex, uint8_t brightness);

  const StreetLightState& getState() const;
  void onTelemetryChange(TelemetryChangeCallback callback);

private:
  StreetLightState state;
  StreetLightState previousState;
  TelemetryChangeCallback changeCallback;
  unsigned long lastPollTime;
  unsigned long lastTelemetrySentTime;

  void readSensors();
  void applyAutonomousLogic();
  void writeHardwarePwm();
  bool hasStateChanged() const;
};

#endif // LIGHT_CONTROLLER_H
