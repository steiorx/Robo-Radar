#include <Arduino.h>
#include <AsyncUDP.h>
#include <ArduinoJson.h>
#include <WiFi.h>

const char *ssid = "ESP32_SI";
const int ledPin = LED_BUILTIN;

bool on = 0;
int accelerateFactor = 0;
short lightLevel = 0;

AsyncUDP udp;

void setup()
{
  Serial.begin(9600);
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid);
  pinMode(ledPin, OUTPUT);
  pinMode(21, OUTPUT);
  if (udp.listen(1234))
  {
    Serial.print("Listening on IP: ");
    Serial.println(WiFi.softAPIP());
    udp.onPacket([](AsyncUDPPacket packet)
                 {
      Serial.printf("Received packet from: %s:%d", packet.remoteIP(), packet.remotePort());
      JsonDocument doc;
      deserializeJson(doc, packet.data(), packet.length());
      Serial.printf("%s", packet.data());
      if (doc["route"] == "light")
        {
          on = !on;
          digitalWrite(ledPin, on);
        }
      

      if (doc["route"] == "move")
      {
        accelerateFactor = doc["accelerate"];
      }

      packet.print("Received package"); });
  }
}

void loop()
{
  lightLevel += accelerateFactor;
  if (lightLevel < 0) lightLevel = 0;
  if (lightLevel > 255) lightLevel = 255;
  analogWrite(21, lightLevel);
  delay(50);
}