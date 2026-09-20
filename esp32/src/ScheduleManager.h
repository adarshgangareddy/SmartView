#ifndef SCHEDULE_MANAGER_H
#define SCHEDULE_MANAGER_H

#include <Arduino.h>
#include <Preferences.h>
#include "GateController.h"
#include "RtcManager.h"

struct DaySchedule {
  uint8_t openHour;
  uint8_t openMinute;
  uint8_t closeHour;
  uint8_t closeMinute;
  bool enabled;
};

class ScheduleManager {
public:
  ScheduleManager(GateController& gate, RtcManager& rtc);
  void begin();
  void loop();

  bool saveDaySchedule(int dayOfWeek, int openH, int openM, int closeH, int closeM, bool enabled);
  DaySchedule getDaySchedule(int dayOfWeek);

private:
  GateController& gateController;
  RtcManager& rtcManager;
  Preferences prefs;

  unsigned long lastCheckTime;
  int lastCheckedMinute;

  void loadDefaultSchedules();
  void checkSchedule();
};

#endif // SCHEDULE_MANAGER_H
