#include <Arduino.h>
#include <ArduinoJson.h>
#include <NimBLEDevice.h>

#define SERVICE_UUID "1d9e"
#define CHARACTERISTIC_UUID "425d"

NimBLECharacteristic* pCharacteristic;
bool deviceConnected = false;

float lightLevel = 0;
int accelerateFactor = 0, lightLevelX = 0;

struct __attribute__((packed)) MoveData
{
  float moveX, moveY;
  int8_t accelerate;
};

class MyServerCallbacks : public NimBLEServerCallbacks
{
  void onConnect(NimBLEServer *pServer, NimBLEConnInfo& connInfo) override
  {
    deviceConnected = true;
    pServer->updateConnParams(connInfo.getConnHandle(), 6, 12, 0, 200);
    Serial.println("Connected");
  }
  void onDisconnect(NimBLEServer *pServer, NimBLEConnInfo& connInfo, int reason) 
  {
    deviceConnected = false;
    pServer->startAdvertising();
    Serial.println("Disconnected");
  }
};

class MyCharacteristicCallbacks : public NimBLECharacteristicCallbacks
{
  void onWrite(NimBLECharacteristic *pCharacteristic, NimBLEConnInfo& connInfo) override
  {
    MoveData moveData;

    if (pCharacteristic->getLength() == sizeof(moveData))
    {
      memcpy(&moveData, pCharacteristic->getValue(), pCharacteristic->getLength());

      accelerateFactor = moveData.accelerate;
      lightLevelX = (abs(moveData.moveX)) * 16;
      analogWrite(21, lightLevelX);
    }
  }
};

void setup()
{
  Serial.begin(9600);

  NimBLEDevice::init("ESP32_CAR");
  NimBLEServer *pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  NimBLEService *pService = pServer->createService(SERVICE_UUID);
  // pService->start();

  pCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID,
      NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::NOTIFY);

  pCharacteristic->setCallbacks(new MyCharacteristicCallbacks());

  NimBLEAdvertisementData advData;
  
  // Set the flags (Mandatory for smartphones to find it)
  advData.setFlags(BLE_HS_ADV_F_DISC_GEN | BLE_HS_ADV_F_BREDR_UNSUP);
  
  // FORCE THE NAME into the primary payload packet
  advData.setName("ESP32-RIG-1"); 
  
  advData.addServiceUUID(SERVICE_UUID);

  NimBLEAdvertising *pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->setAdvertisementData(advData);
  
  // Turn off scan response completely so Android handles everything in packet 1
  pAdvertising->enableScanResponse(false); 
  
  pAdvertising->start();

  Serial.println("Waiting...");

  pinMode(21, OUTPUT);
}

void loop()
{
  
}
