#include "RtcManager.h"
#include "config.h"

RtcManager::RtcManager() : isInitialized(false) {}

bool RtcManager::begin() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

  if (!rtc.begin()) {
    Serial.println("[RTC ERROR] Couldn't find DS3231 RTC module!");
    isInitialized = false;
    return false;
  }

  if (rtc.lostPower()) {
    Serial.println("[RTC WARN] DS3231 lost power, initializing fallback date!");
    // Set to compilation time as fallback until NTP syncs
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }

  isInitialized = true;
  DateTime current = rtc.now();
  Serial.printf("[RTC] DS3231 Initialized. Current Time: %04d-%02d-%02d %02d:%02d:%02d\n",
                current.year(), current.month(), current.day(),
                current.hour(), current.minute(), current.second());
  return true;
}

void RtcManager::syncWithNtp() {
  if (!isInitialized) return;

  // Configure NTP
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 3000)) {
    // Adjust DS3231 with authoritative NTP time
    rtc.adjust(DateTime(
      timeinfo.tm_year + 1900,
      timeinfo.tm_mon + 1,
      timeinfo.tm_mday,
      timeinfo.tm_hour,
      timeinfo.tm_min,
      timeinfo.tm_sec
    ));
    Serial.println("[RTC] Successfully synchronized DS3231 with NTP server.");
  } else {
    Serial.println("[RTC] NTP sync unavailable. Continuing with local DS3231 battery clock.");
  }
}

DateTime RtcManager::now() {
  if (isInitialized) {
    return rtc.now();
  }
  return DateTime(2026, 1, 1, 0, 0, 0);
}

// Map RTClib dayOfTheWeek (0 = Sunday, 1 = Monday ... 6 = Saturday) to 1 = Monday ... 7 = Sunday
int RtcManager::getDayOfWeek() {
  if (!isInitialized) return 1;
  int d = rtc.now().dayOfTheWeek();
  return (d == 0) ? 7 : d;
}

String RtcManager::getTimeString() {
  DateTime current = now();
  char buf[10];
  snprintf(buf, sizeof(buf), "%02d:%02d:%02d", current.hour(), current.minute(), current.second());
  return String(buf);
}

String RtcManager::getIsoTimestamp() {
  DateTime current = now();
  char buf[30];
  snprintf(buf, sizeof(buf), "%04d-%02d-%02dT%02d:%02d:%02dZ",
           current.year(), current.month(), current.day(),
           current.hour(), current.minute(), current.second());
  return String(buf);
}

bool RtcManager::isReady() const {
  return isInitialized;
}
