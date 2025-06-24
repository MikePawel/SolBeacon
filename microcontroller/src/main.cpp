#include <Arduino.h>
void setup() {
  Serial.begin(921600);
  Serial.println("Hello from setup");
  pinMode(LED_BUILTIN, OUTPUT);
  
}

void loop() {
  delay(1000);
  Serial.println("Hello from loop");
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}