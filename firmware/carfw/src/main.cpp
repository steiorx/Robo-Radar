#include <Arduino.h>
#include <NimBLEDevice.h>
#include <Motor.h>

#define SERVICE_UUID "1d9e"
#define CHARACTERISTIC_UUID "425d"

NimBLECharacteristic *pCharacteristic;
bool deviceConnected = false;

const float accelerateFactor = 80;

const MotorPins leftMotorPins{25, 26, 33, 32};
const MotorPins rightMotorPins{14, 15, 18, 19};

Motor leftMotor(leftMotorPins);
Motor rightMotor(rightMotorPins);

CarController carController(&leftMotor, &rightMotor);

#pragma pack(push, 1)
struct ActionData
{
    uint8_t id; // 1 - acceleration change, 2 - direction change, 3 - max speed change, 4 - battery change, 5 - speed change
    int16_t value;
    // 1 accelerate, 0 constant speed, -1 decelerate
};
#pragma pack(pop)

int currentAccelerateState = 0;

class MyServerCallbacks : public NimBLEServerCallbacks
{
    void onConnect(NimBLEServer *pServer, NimBLEConnInfo &connInfo) override
    {
        deviceConnected = true;
        pServer->updateConnParams(connInfo.getConnHandle(), 6, 12, 0, 200);
        Serial.println("Connected");

        carController.turnOn();
    }
    void onDisconnect(NimBLEServer *pServer, NimBLEConnInfo &connInfo, int reason)
    {
        deviceConnected = false;
        pServer->startAdvertising();
        Serial.println("Disconnected");
        carController.doBreak();
        carController.turnOff();
    }
};

class MyCharacteristicCallbacks : public NimBLECharacteristicCallbacks
{
    void onWrite(NimBLECharacteristic *pCharacteristic, NimBLEConnInfo &connInfo) override
    {
        if (pCharacteristic->getLength() == sizeof(ActionData))
        {
            ActionData *cmd = (ActionData *)pCharacteristic->getValue().data();

            switch (cmd->id)
            {
            case 1:
                currentAccelerateState = cmd->value;
                break;

            case 2:
                if (cmd->value < -180 || cmd->value > 180)
                    break;
                carController.setDirection(cmd->value);
                Serial.println(cmd->value);
                break;
            }
        }
    }
};

void sendSpeed(int16_t speed)
{
    ActionData data = {5, speed};
    pCharacteristic->setValue(data);
    pCharacteristic->notify();
}

unsigned int lastAction = 0;
const int loopDelay = 50; // ms
const int reverseDelay = 500;
unsigned long lastTime = 0;
unsigned long startReverseTime = 0;

void setup()
{
    Serial.begin(115200);

#pragma region Initialize Bluetooth
    NimBLEDevice::init("ESP32_CAR");
    NimBLEServer *pServer = NimBLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    NimBLEService *pService = pServer->createService(SERVICE_UUID);

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
#pragma endregion

    carController.begin();

    pinMode(21, OUTPUT);

    lastTime = millis();
}

void loop()
{
    unsigned long currentTime = millis();
    int deltaTime = (currentTime - lastTime);
    lastTime = currentTime;

    if (currentAccelerateState)
    {
        if (currentTime - lastAction > loopDelay)
        {
            int diffFactor = lastAction ? currentTime - lastAction : deltaTime;
            lastAction = currentTime;

            int diff = currentAccelerateState * accelerateFactor * diffFactor / 1000.f;
            int directionSign = carController.getDirection() ? -1 : 1;
            int speed = carController.getSpeed() * directionSign;
            int newSpeed = speed + diff;

            // Serial.printf("Speed %d NewSpeed %d cas %d diff %d \n", speed, newSpeed, currentAccelerateState, diffFactor);

            if (newSpeed > 255)
            {
                newSpeed = 255;
                currentAccelerateState = 0;
            }
            else if (newSpeed < -255)
            {
                newSpeed = -255;
                currentAccelerateState = 0;
            }
            else if (speed * newSpeed < 0 || (newSpeed == 0 && speed != 0))
            {
                if (!startReverseTime)
                {
                    startReverseTime = currentTime;
                    carController.setSpeed(0);
                    // carController.printSpeeds();

                    sendSpeed(0);

                    return;
                }
            }
            else if (startReverseTime)
            {
                if (currentTime - startReverseTime > reverseDelay)
                {
                    carController.changeDirection();
                    startReverseTime = 0;
                }
                else
                    return;
            }
            carController.setSpeed(newSpeed);
            // carController.printSpeeds();

            sendSpeed(newSpeed);
        }
    }
    else
        lastAction = 0;
}
