#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==== Wi-Fi configuration (edit for your environment) ====
const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ==== MQTT configuration (HiveMQ public by default) ====
const char *MQTT_HOST = "broker.hivemq.com";  // Use your HiveMQ Cloud host if available
const uint16_t MQTT_PORT = 1883;               // 1883 (TCP) or 8883 (TLS)
const bool MQTT_USE_TLS = false;               // Set to true when using a TLS port
const char *MQTT_USERNAME = "";               // HiveMQ Cloud typically requires username/password
const char *MQTT_PASSWORD = "";

// ==== Topics (kept in sync with dashboard/src/hooks/useHardwareBioreactorStream.js) ====
const char *TOPIC_TELEMETRY = "bioreactor/telemetry";
const char *TOPIC_SETPOINT = "bioreactor/setpoints";

// Telemetry send interval
const uint32_t TELEMETRY_INTERVAL_MS = 1000;  // 1 second

WiFiClientSecure secureClient;
WiFiClient wifiClient;
PubSubClient mqttClient(MQTT_USE_TLS ? secureClient : wifiClient);

float setpointTemp = 30.0f;
float setpointRPM = 600.0f;
float setpointPH = 5.0f;

unsigned long lastTelemetryAt = 0;

// === Sensor placeholder helpers (replace with real sensor reads) ===
float readTemperatureC() {
  // TODO: wire to actual temperature sensor
  return 30.0f + (float)(millis() % 1000) / 1000.0f;  // simple changing value for testing
}

float readPH() {
  // TODO: replace with real pH read
  return 5.0f;
}

float readRPM() {
  // TODO: replace with real RPM sensor reading
  return 1000.0f;
}

void connectWiFi() {
  Serial.printf("Connecting to WiFi %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\nWiFi connected, IP: %s\n", WiFi.localIP().toString().c_str());
}

void connectMqtt() {
  if (MQTT_USE_TLS) {
    secureClient.setInsecure();  // use CA certs in production; setInsecure for quick demos
  }

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);

  while (!mqttClient.connected()) {
    String clientId = "lilygo-bioreactor-" + String((uint32_t)esp_random(), HEX);
    Serial.printf("Connecting to MQTT at %s:%u ...\n", MQTT_HOST, MQTT_PORT);

    if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
      Serial.println("MQTT connected");

      if (mqttClient.subscribe(TOPIC_SETPOINT)) {
        Serial.printf("Subscribed to %s\n", TOPIC_SETPOINT);
      } else {
        Serial.printf("Failed subscribing to %s\n", TOPIC_SETPOINT);
      }

    } else {
      Serial.printf("MQTT connect failed, rc=%d. Retrying in 2s...\n", mqttClient.state());
      delay(2000);
    }
  }
}

void handleSetpointMessage(char *topic, byte *payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    Serial.printf("Setpoint JSON parse failed: %s\n", err.c_str());
    return;
  }

  if (doc.containsKey("temp")) {
    setpointTemp = doc["temp"].as<float>();
  }
  if (doc.containsKey("rpm")) {
    setpointRPM = doc["rpm"].as<float>();
  }
  if (doc.containsKey("pH")) {
    setpointPH = doc["pH"].as<float>();
  }

  Serial.printf("Updated setpoints -> temp: %.2f, rpm: %.1f, pH: %.2f\n", setpointTemp,
                setpointRPM, setpointPH);
}

void publishTelemetry(float actualTemp, float actualRPM, float actualPH) {
  unsigned long now = millis();
  if (now - lastTelemetryAt < TELEMETRY_INTERVAL_MS) {
    return;
  }
  lastTelemetryAt = now;

  StaticJsonDocument<256> doc;
  doc["temp"] = actualTemp;
  doc["rpm"] = actualRPM;
  doc["pH"] = actualPH;
  doc["setpointTemp"] = setpointTemp;
  doc["setpointRPM"] = setpointRPM;
  doc["setpointPH"] = setpointPH;

  // Send seconds so the dashboard multiplies to milliseconds (see normalizeTimestamp())
  doc["timestamp"] = (uint64_t)(millis() / 1000);

  String payload;
  serializeJson(doc, payload);

  bool ok = mqttClient.publish(TOPIC_TELEMETRY, payload.c_str());
  if (!ok) {
    Serial.printf("Failed to publish telemetry to %s\n", TOPIC_TELEMETRY);
  } else {
    Serial.printf("Telemetry -> %s: %s\n", TOPIC_TELEMETRY, payload.c_str());
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  connectWiFi();

  mqttClient.setCallback(handleSetpointMessage);
  connectMqtt();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!mqttClient.connected()) {
    connectMqtt();
  }

  mqttClient.loop();
  publishTelemetry(readTemperatureC(), readRPM(), readPH());
}
