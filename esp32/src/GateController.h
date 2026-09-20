#ifndef GATE_CONTROLLER_H
#define GATE_CONTROLLER_H

#include <Arduino.h>
#include "config.h"

enum GateState {
  GATE_STATE_UNKNOWN,
  GATE_STATE_OPEN,
  GATE_STATE_CLOSED,
  GATE_STATE_OPENING,
  GATE_STATE_CLOSING
};

enum OperatingMode {
  MODE_AUTO,
  MODE_MANUAL
};

typedef void (*StateChangeCallback)(GateState newState);

class GateController {
public:
  GateController();
  void begin();
  void loop();

  bool openGate();
  bool closeGate();
  void stopGate();

  GateState getState() const;
  String getStateString() const;

  OperatingMode getMode() const;
  String getModeString() const;
  void setMode(OperatingMode mode);

  void onStateChange(StateChangeCallback callback);

private:
  GateState currentState;
  OperatingMode currentMode;
  unsigned long travelStartTime;
  bool isMoving;
  StateChangeCallback stateCallback;

  void setState(GateState newState);
  void readLimitSwitches();
};

#endif // GATE_CONTROLLER_H
