#include "ScheduleManager.h"

ScheduleManager::ScheduleManager(GateController& gate, RtcManager& rtc)
  : gateController(gate),
    rtcManager(rtc),
    lastCheckTime(0),
    lastCheckedMinute(-1) {}

void ScheduleManager::begin() {
  prefs.begin("gate_sched", false);

  // Check if schedules exist in NVS, otherwise initialize defaults
  if (!prefs.isKey("init_done")) {
    Serial.println("[SCHEDULE] Initializing factory default schedules in NVS...");
    loadDefaultSchedules();
    prefs.putBool("init_done", true);
  } else {
    Serial.println("[SCHEDULE] Successfully loaded offline weekly schedule from NVS flash.");
  }
}

void ScheduleManager::loadDefaultSchedules() {
  // Monday to Friday: 08:00 to 20:00 (Enabled)
  for (int day = 1; day <= 5; day++) {
    saveDaySchedule(day, 8, 0, 20, 0, true);
  }
  // Saturday: 09:00 to 18:00 (Enabled)
  saveDaySchedule(6, 9, 0, 18, 0, true);
  // Sunday: 10:00 to 16:00 (Disabled)
  saveDaySchedule(7, 10, 0, 16, 0, false);
}

bool ScheduleManager::saveDaySchedule(int dayOfWeek, int openH, int openM, int closeH, int closeM, bool enabled) {
  if (dayOfWeek < 1 || dayOfWeek > 7) return false;

  char key[16];
  snprintf(key, sizeof(key), "d%d_open_h", dayOfWeek);
  prefs.putUChar(key, (uint8_t)openH);

  snprintf(key, sizeof(key), "d%d_open_m", dayOfWeek);
  prefs.putUChar(key, (uint8_t)openM);

  snprintf(key, sizeof(key), "d%d_close_h", dayOfWeek);
  prefs.putUChar(key, (uint8_t)closeH);

  snprintf(key, sizeof(key), "d%d_close_m", dayOfWeek);
  prefs.putUChar(key, (uint8_t)closeM);

  snprintf(key, sizeof(key), "d%d_en", dayOfWeek);
  prefs.putBool(key, enabled);

  Serial.printf("[SCHEDULE] Stored Day %d in NVS: %02d:%02d -> %02d:%02d (Enabled: %d)\n",
                dayOfWeek, openH, openM, closeH, closeM, enabled);
  return true;
}

DaySchedule ScheduleManager::getDaySchedule(int dayOfWeek) {
  DaySchedule sched = { 8, 0, 20, 0, false };
  if (dayOfWeek < 1 || dayOfWeek > 7) return sched;

  char key[16];
  snprintf(key, sizeof(key), "d%d_open_h", dayOfWeek);
  sched.openHour = prefs.getUChar(key, 8);

  snprintf(key, sizeof(key), "d%d_open_m", dayOfWeek);
  sched.openMinute = prefs.getUChar(key, 0);

  snprintf(key, sizeof(key), "d%d_close_h", dayOfWeek);
  sched.closeHour = prefs.getUChar(key, 20);

  snprintf(key, sizeof(key), "d%d_close_m", dayOfWeek);
  sched.closeMinute = prefs.getUChar(key, 0);

  snprintf(key, sizeof(key), "d%d_en", dayOfWeek);
  sched.enabled = prefs.getBool(key, true);

  return sched;
}

void ScheduleManager::loop() {
  if (millis() - lastCheckTime < SCHEDULE_CHECK_INTERVAL_MS) {
    return;
  }
  lastCheckTime = millis();

  // Only operate automatic schedule if gate controller is in AUTO mode!
  if (gateController.getMode() != MODE_AUTO) {
    return;
  }

  checkSchedule();
}

void ScheduleManager::checkSchedule() {
  if (!rtcManager.isReady()) return;

  DateTime now = rtcManager.now();
  int currentMinute = now.minute();
  int currentHour = now.hour();
  int dayOfWeek = rtcManager.getDayOfWeek();

  // Prevent repeated actuation in the same minute
  if (currentMinute == lastCheckedMinute) {
    return;
  }

  DaySchedule today = getDaySchedule(dayOfWeek);
  if (!today.enabled) {
    return;
  }

  int currentTotalMinutes = currentHour * 60 + currentMinute;
  int openTotalMinutes = today.openHour * 60 + today.openMinute;
  int closeTotalMinutes = today.closeHour * 60 + today.closeMinute;

  // 1. Trigger OPEN when reaching open time
  if (currentTotalMinutes == openTotalMinutes) {
    if (gateController.getState() != GATE_STATE_OPEN && gateController.getState() != GATE_STATE_OPENING) {
      Serial.println("[AUTONOMOUS SCHEDULE] Scheduled OPEN time reached via RTC!");
      gateController.openGate();
      lastCheckedMinute = currentMinute;
    }
  }
  // 2. Trigger CLOSE when reaching close time
  else if (currentTotalMinutes == closeTotalMinutes) {
    if (gateController.getState() != GATE_STATE_CLOSED && gateController.getState() != GATE_STATE_CLOSING) {
      Serial.println("[AUTONOMOUS SCHEDULE] Scheduled CLOSE time reached via RTC!");
      gateController.closeGate();
      lastCheckedMinute = currentMinute;
    }
  }
}
