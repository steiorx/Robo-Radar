#include "Arduino.h"
#include "math.h"

struct MotorPins
{
    int L_EN;
    int R_EN;
    int L_PWM;
    int R_PWM;
};

class Motor
{
private:
    bool isOn = false;
    int currentPwm = 0;        // Speed
    bool directionIsRight = 0; // 0 - left, 1 - right
    MotorPins pins;

public:
    Motor(const MotorPins &pins)
    {
        this->pins = pins;
    };

    /**
     * This function sets its assigned pins to `OUTPUT` mode
     */
    void begin()
    {
        // Just to be sure
        digitalWrite(pins.L_PWM, LOW);
        digitalWrite(pins.R_PWM, LOW);

        pinMode(pins.L_EN, OUTPUT);
        pinMode(pins.R_EN, OUTPUT);
        pinMode(pins.L_PWM, OUTPUT);
        pinMode(pins.R_PWM, OUTPUT);
    }

    void turnOn()
    {
        if (isOn)
            return;

        digitalWrite(pins.L_EN, HIGH);
        digitalWrite(pins.R_EN, HIGH);

        isOn = true;
    }

    void turnOff()
    {
        if (!isOn)
            return;

        digitalWrite(pins.L_EN, LOW);
        digitalWrite(pins.R_EN, LOW);

        isOn = false;
    }

    /**
     * Sets the speed of the motor
     * @param speed The speed the motor should be set to. If no value is provided the speed will be set to max.
     * @todo Fa schimbarea vitezei treptata daca varianta curenta nu functioneaza.
     */
    void setSpeed(int speed = 255, int dir = -1)
    {
        int direction = dir == -1 ? directionIsRight : dir; 
        analogWrite(direction ? pins.R_PWM : pins.L_PWM, speed);
    }

    /**
     * Calls `setSpeed()` with `speed = 0`
     */
    void doBreak()
    {
        setSpeed(0, 0);
        setSpeed(0, 1);
    }

    void changeDirection()
    {
        doBreak();

        directionIsRight = !directionIsRight;

        doBreak();
    }

    bool getDirection()
    {
        return directionIsRight;
    }
};

class CarController
{
private:
    float leftSpeed = 1.f, rightSpeed = 1.f;
    int speed = 0;
    bool directionIsRight = 0;

public:
    Motor *leftMotor, *rightMotor;

    CarController(Motor *leftMotor, Motor *rightMotor)
    {
        this->leftMotor = leftMotor;
        this->rightMotor = rightMotor;
    }

    void begin()
    {
        leftMotor->begin();
        rightMotor->begin();
    }

    void turnOff()
    {
        leftMotor->turnOff();
        rightMotor->turnOff();
    }

    void turnOn()
    {
        leftMotor->turnOn();
        rightMotor->turnOn();
    }

    void updateSpeed()
    {
        leftMotor->setSpeed(leftSpeed * speed);
        rightMotor->setSpeed(rightSpeed * speed);
    }

    void setDirection(int xi)
    {
        float x = float(xi) / 180.f;
        x = max(x, -1.f);
        x = min(x, 1.f);
        leftSpeed = rightSpeed = 1.f;
        if (x < 0.f)
        {
            leftSpeed = 1 + x;
        }
        else
        {
            rightSpeed = 1 - x;
        }
        updateSpeed();
    }

    void setSpeed(int speed)
    {
        this->speed = abs(speed);
        updateSpeed();
    }

    int getSpeed()
    {
        return speed;
    }

    void doBreak()
    {
        speed = 0;
        updateSpeed();
    }

    void changeDirection()
    {
        doBreak();
        leftMotor->changeDirection();
        rightMotor->changeDirection();
        directionIsRight = !directionIsRight;
        updateSpeed();
    }

    // true for right
    bool getDirection()
    {
        return directionIsRight;
    }

    // DEBUG
    void printSpeeds()
    {
        Serial.printf("Speed Left: %d, Speed Right: %d, Direction: %d \n", int(leftSpeed * speed), int(rightSpeed * speed), leftMotor->getDirection());
    }
};