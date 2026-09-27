#include "LightController.h"

LightController::LightController()
  : changeCallback(nullptr),
    lastPollTime(0),
    lastTelemetrySentTime(0) {
  state.isNight = false;
  state.mode = LIGHT_MODE_AUTO;
  for (int i = 0; i < 4; i++) {
    state.motion[i] = false;
    state.brightness[i] = 0;
    previousState.motion[i] = false;
    previousState.brightness[i] = 0;
  }
  previousState.isNight = false;
  previousState.mode = LIGHT_MODE_AUTO;
}

void LightController::begin() {
  // Configure LDR Pin
  pinMode(PIN_LDR, INPUT);

  // Configure 4x IR Sensor Pins
  pinMode(PIN_IR_1, INPUT);
  pinMode(PIN_IR_2, INPUT);
  pinMode(PIN_IR_3, INPUT);
  pinMode(PIN_IR_4, INPUT);

  // Configure 4x LED Output Pins
  pinMode(PIN_LED_1, OUTPUT);
  pinMode(PIN_LED_2, OUTPUT);
  pinMode(PIN_LED_3, OUTPUT);
  pinMode(PIN_LED_4, OUTPUT);

  // Initial read
  readSensors();
  applyAutonomousLogic();
  writeHardwarePwm();

  Serial.println("[STREETLIGHT] Hardware Initialized. LDR and 4x IR Sensors Active.");
}

void LightController::readSensors() {
  // LDR comparator output: LOW represents darkness/nighttime
  state.isNight = (digitalRead(PIN_LDR) == LOW);

  // IR sensors: LOW represents vehicle or object detection
  state.motion[0] = (digitalRead(PIN_IR_1) == LOW);
  state.motion[1] = (digitalRead(PIN_IR_2) == LOW);
  state.motion[2] = (digitalRead(PIN_IR_3) == LOW);
  state.motion[3] = (digitalRead(PIN_IR_4) == LOW);
}

void LightController::applyAutonomousLogic() {
  // In Daytime: All lamps remain OFF (0 PWM) to conserve energy
  if (!state.isNight) {
    for (int i = 0; i < 4; i++) {
      state.brightness[i] = OFF_BRIGHTNESS;
    }
    return;
  }

  // In Nighttime: Adaptive dimming logic
  // If vehicle detected in zone i -> 100% full brightness (255)
  // If no vehicle detected in zone i -> dim brightness (60)
  for (int i = 0; i < 4; i++) {
    state.brightness[i] = state.motion[i] ? FULL_BRIGHTNESS : DIM_BRIGHTNESS;
  }
}

void LightController::writeHardwarePwm() {
  analogWrite(PIN_LED_1, state.brightness[0]);
  analogWrite(PIN_LED_2, state.brightness[1]);
  analogWrite(PIN_LED_3, state.brightness[2]);
  analogWrite(PIN_LED_4, state.brightness[3]);
}

bool LightController::hasStateChanged() const {
  if (state.isNight != previousState.isNight) return true;
  if (state.mode != previousState.mode) return true;

  for (int i = 0; i < 4; i++) {
    if (state.motion[i] != previousState.motion[i]) return true;
    if (state.brightness[i] != previousState.brightness[i]) return true;
  }
  return false;
}

void LightController::loop() {
  if (millis() - lastPollTime < SENSOR_POLL_INTERVAL_MS) {
    return;
  }
  lastPollTime = millis();

  readSensors();

  if (state.mode == LIGHT_MODE_AUTO) {
    applyAutonomousLogic();
  }

  writeHardwarePwm();

  // Check if state changed and throttle notification
  if (hasStateChanged()) {
    if (millis() - lastTelemetrySentTime > TELEMETRY_THROTTLE_MS) {
      lastTelemetrySentTime = millis();
      previousState = state;

      if (changeCallback) {
        changeCallback(state);
      }
    }
  }
}

void LightController::setMode(LightOperatingMode mode) {
  state.mode = mode;
  if (mode == LIGHT_MODE_AUTO) {
    applyAutonomousLogic();
    writeHardwarePwm();
  }
  if (changeCallback) changeCallback(state);
}

LightOperatingMode LightController::getMode() const {
  return state.mode;
}

void LightController::setAllLamps(uint8_t brightness) {
  state.mode = LIGHT_MODE_MANUAL;
  for (int i = 0; i < 4; i++) {
    state.brightness[i] = brightness;
  }
  writeHardwarePwm();
  if (changeCallback) changeCallback(state);
}

void LightController::setLamp(int lampIndex, uint8_t brightness) {
  if (lampIndex >= 0 && lampIndex < 4) {
    state.mode = LIGHT_MODE_MANUAL;
    state.brightness[lampIndex] = brightness;
    writeHardwarePwm();
    if (changeCallback) changeCallback(state);
  }
}

const StreetLightState& LightController::getState() const {
  return state;
}

void LightController::onTelemetryChange(TelemetryChangeCallback callback) {
  changeCallback = callback;
}
