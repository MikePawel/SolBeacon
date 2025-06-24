#include <Arduino.h>
#include "BLEDevice.h"
#include "BLEBeacon.h"
#include "BLEUtils.h"
#include "BLEServer.h"

#define LED_PIN LED_BUILTIN

void setup() {
  Serial.begin(921600);
  Serial.println("Hello from setup");
  pinMode(LED_PIN, OUTPUT);

  // Init BLE
  BLEDevice::init("ESP32 iBeacon");

  BLEServer *pServer = BLEDevice::createServer();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();

  // Manually construct iBeacon advertisement data
  uint8_t iBeaconData[25] = {
    0x4C, 0x00,  // Apple's company ID
    0x02,        // iBeacon type
    0x15,        // iBeacon data length (21 bytes)
    // UUID: FA4F992B-0F59-4E61-B0FB-457308078CAB
    0xFA, 0x4F, 0x99, 0x2B, 0x0F, 0x59, 0x4E, 0x61,
    0xB0, 0xFB, 0x45, 0x73, 0x08, 0x07, 0x8C, 0xAB,
    0x00, 0x01,  // Major = 1 
    0x00, 0x01,  // Minor = 1
    0xC5         // TX Power = -59 dBm (signed 8-bit)
  };

  // Set advertising payload
  BLEAdvertisementData advertisementData;
  advertisementData.setFlags(0x04); // BR_EDR_NOT_SUPPORTED (BLE only)
  advertisementData.setManufacturerData(std::string((char*)iBeaconData, 25));

  pAdvertising->setAdvertisementData(advertisementData);
  pAdvertising->start();

  Serial.println("iBeacon advertising started...");
}

void loop() {
  Serial.println("Hello from loop");
  digitalWrite(LED_PIN, HIGH);
  delay(1000);
  digitalWrite(LED_PIN, LOW);
  delay(1000);
}
