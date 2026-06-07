#include <Arduino.h>
#include <AsyncUDP.h>
#include <ArduinoJson.h>
#include <WiFi.h>

const char *ssid = "ESP32_SI";
const int ledPin = LED_BUILTIN;

bool on = 0;

AsyncUDP udp;

void setup()
{
  Serial.begin(9600);
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ssid);
  pinMode(ledPin, OUTPUT);
  if (udp.listen(1234))
  {
    Serial.print("Listening on IP: ");
    Serial.println(WiFi.localIP());
    udp.onPacket([](AsyncUDPPacket packet)
                 {
      Serial.printf("Received packet from: %s:%d", packet.remoteIP(), packet.remotePort());
      JsonDocument doc;
      deserializeJson(doc, packet.data(), packet.length());
      
      if (doc["route"] == "light")
        {
          on = !on;
          digitalWrite(ledPin, on);
        }
      

      if (doc["route"] == "speed")
      {
        float newSpeed = doc["speed"];
      }

      packet.print("Received package"); });
  }
}

void loop()
{
  
}