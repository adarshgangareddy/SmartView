#include "GateController.h"

GateController::GateController()
  : currentState(GATE_STATE_UNKNOWN),
    currentMode(MODE_AUTO),
    travelStartTime(0),
    isMoving(false),
    stateCallback(nullptr) {}

void GateController::begin() {
  // Configure relay pins as OUTPUT
  pinMode(PIN_RELAY_OPEN, OUTPUT);
  pinMode(PIN_RELAY_CLOSE, OUTPUT);

  // Configure limit switches with internal pullups
  pinMode(PIN_LIMIT_OPEN, INPUT_PULLUP);
  pinMode(PIN_LIMIT_CLOSED, INPUT_PULLUP);

  // Status LED
  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Ensure all motor relays start in de-energized fail-safe state
  stopGate();

  // Read initial physical limit switch sensors
  readLimitSwitches();
  Serial.printf("[GATE] Initialized. Initial State: %s, Mode: %s\n",
                getStateString().c_str(), getModeString().c_str());
}

void GateController::readLimitSwitches() {
  // Active LOW switches (pressed = ground)
  bool isOpenLimitHit = (digitalRead(PIN_LIMIT_OPEN) == LOW);
  bool isClosedLimitHit = (digitalRead(PIN_LIMIT_CLOSED) == LOW);

  if (isOpenLimitHit && !isClosedLimitHit) {
    if (currentState != GATE_STATE_OPEN) {
      setState(GATE_STATE_OPEN);
    }
  } else if (isClosedLimitHit && !isOpenLimitHit) {
    if (currentState != GATE_STATE_CLOSED) {
      setState(GATE_STATE_CLOSED);
    }
  } else if (!isOpenLimitHit && !isClosedLimitHit && !isMoving) {
    if (currentState != GATE_STATE_UNKNOWN) {
      setState(GATE_STATE_UNKNOWN);
    }
  }
}

void GateController::loop() {
  if (isMoving) {
    unsigned long elapsed = (millis() - travelStartTime) / 1000;

    // 1. Check for physical limit switch trip during travel
    if (currentState == GATE_STATE_OPENING) {
      if (digitalRead(PIN_LIMIT_OPEN) == LOW) {
        Serial.println("[GATE] Limit switch hit: Fully OPEN.");
        stopGate();
        setState(GATE_STATE_OPEN);
        return;
      }
    } else if (currentState == GATE_STATE_CLOSING) {
      if (digitalRead(PIN_LIMIT_CLOSED) == LOW) {
        Serial.println("[GATE] Limit switch hit: Fully CLOSED.");
        stopGate();
        setState(GATE_STATE_CLOSED);
        return;
      }
    }

    // 2. Fail-Safe Motor Watchdog Timeout
    // If limit switch fails or gets disconnected, cut motor power automatically!
    if (elapsed >= MAX_MOTOR_TRAVEL_SECONDS) {
      Serial.printf("[GATE WATCHDOG] Travel timeout exceeded (%d sec)! Cutting motor power.\n", MAX_MOTOR_TRAVEL_SECONDS);
      stopGate();
      if (currentState == GATE_STATE_OPENING) {
        setState(GATE_STATE_OPEN); // Assume open upon timeout in emergency
      } else {
        setState(GATE_STATE_CLOSED);
      }
    }
  }
}

bool GateController::openGate() {
  if (currentState == GATE_STATE_OPEN) {
    Serial.println("[GATE] Already in OPEN state. Ignoring command.");
    return false;
  }

  Serial.println("[GATE] Activating OPEN sequence...");

  // CRITICAL FAIL-SAFE INTERLOCK:
  // Forcibly shut down CLOSE relay before energizing OPEN relay
  digitalWrite(PIN_RELAY_CLOSE, RELAY_INACTIVE_STATE);
  delay(50); // Interlock transition settling delay

  // Energize OPEN relay
  digitalWrite(PIN_RELAY_OPEN, RELAY_ACTIVE_STATE);
  digitalWrite(PIN_STATUS_LED, HIGH);

  isMoving = true;
  travelStartTime = millis();
  setState(GATE_STATE_OPENING);
  return true;
}

bool GateController::closeGate() {
  if (currentState == GATE_STATE_CLOSED) {
    Serial.println("[GATE] Already in CLOSED state. Ignoring command.");
    return false;
  }

  Serial.println("[GATE] Activating CLOSE sequence...");

  // CRITICAL FAIL-SAFE INTERLOCK:
  // Forcibly shut down OPEN relay before energizing CLOSE relay
  digitalWrite(PIN_RELAY_OPEN, RELAY_INACTIVE_STATE);
  delay(50); // Interlock transition settling delay

  // Energize CLOSE relay
  digitalWrite(PIN_RELAY_CLOSE, RELAY_ACTIVE_STATE);
  digitalWrite(PIN_STATUS_LED, HIGH);

  isMoving = true;
  travelStartTime = millis();
  setState(GATE_STATE_CLOSING);
  return true;
}

void GateController::stopGate() {
  // De-energize all relays immediately
  digitalWrite(PIN_RELAY_OPEN, RELAY_INACTIVE_STATE);
  digitalWrite(PIN_RELAY_CLOSE, RELAY_INACTIVE_STATE);
  digitalWrite(PIN_STATUS_LED, LOW);
  isMoving = false;
  Serial.println("[GATE] Motor relays DE-ENERGIZED (STOP).");
}

void GateController::setState(GateState newState) {
  if (currentState != newState) {
    currentState = newState;
    Serial.printf("[GATE] State Changed -> %s\n", getStateString().c_str());
    if (stateCallback) {
      stateCallback(newState);
    }
  }
}

GateState GateController::getState() const {
  return currentState;
}

String GateController::getStateString() const {
  switch (currentState) {
    case GATE_STATE_OPEN:     return "OPEN";
    case GATE_STATE_CLOSED:   return "CLOSED";
    case GATE_STATE_OPENING:  return "OPENING";
    case GATE_STATE_CLOSING:  return "CLOSING";
    default:                  return "UNKNOWN";
  }
}

OperatingMode GateController::getMode() const {
  return currentMode;
}

String GateController::getModeString() const {
  return (currentMode == MODE_AUTO) ? "AUTO" : "MANUAL";
}

void GateController::setMode(OperatingMode mode) {
  currentMode = mode;
  Serial.printf("[GATE] Operating Mode Changed -> %s\n", getModeString().c_str());
}

void GateController::onStateChange(StateChangeCallback callback) {
  stateCallback = callback;
}
