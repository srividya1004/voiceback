/**
 * VoiceBack Smart Neckband - Wi-Fi SoftAP Hotspot & Telemetry Server Header
 * 
 * Manages ESP32 Wi-Fi Access Point mode, embedded HTTP Live EMG Telemetry Dashboard,
 * JSON API streaming endpoints (http://192.168.4.1/api/emg), and client connection handling.
 */

#ifndef WIFI_AP_SERVICE_H
#define WIFI_AP_SERVICE_H

#include "config.h"
#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiServer.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/queue.h>

struct WiFiEMGDataPacket {
    int rawValue;
    float filteredValue;
    float voltageVolts;
};

class WiFiAPServiceManager {
private:
    WiFiServer server;
    bool apStarted;
    int connectedClientsCount;

    TaskHandle_t wifiTaskHandle;
    QueueHandle_t wifiQueue;

    static void wifiTaskWrapper(void *parameter);
    void wifiTaskLoop();
    void handleClientConnection(WiFiClient &client);

public:
    WiFiAPServiceManager();

    void begin();
    bool queueEMGData(int rawValue, float filteredValue, float voltageVolts);
    bool isStarted() const;
    int getClientCount() const;
};

#endif // WIFI_AP_SERVICE_H
