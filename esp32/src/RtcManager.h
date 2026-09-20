#ifndef RTC_MANAGER_H
#define RTC_MANAGER_H

#include <Arduino.h>
#include <Wire.h>
#include <RTClib.h>
#include <time.h>

class RtcManager {
public:
  RtcManager();
  bool begin();
  void syncWithNtp();

  DateTime now();
  int getDayOfWeek();       // 1 = Monday, 7 = Sunday
  String getTimeString();   // "HH:MM:SS"
  String getIsoTimestamp(); // "YYYY-MM-DDTHH:MM:SSZ"
  bool isReady() const;

private:
  RTC_DS3231 rtc;
  bool isInitialized;
};

#endif // RTC_MANAGER_H
