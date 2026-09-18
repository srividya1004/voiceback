/**
 * HISTORICAL / SUPERSEDED HARDWARE CONFIGURATION
 *
 * VoiceBack Smart Neckband - Wi-Fi SoftAP Hotspot & Telemetry Server Header (Archived)
 *
 * Manages legacy prototype Wi-Fi Access Point mode and embedded EMG dashboard.
 * Retained strictly as historical prototype code; not used in current BLE production architecture.
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
