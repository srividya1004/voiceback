/**
 * VoiceBack Smart Neckband - BLE Telemetry Service Header
 * 
 * Manages Bluetooth Low Energy GATT Server, advertisement, connection state,
 * and streaming EMG data packets to the VoiceBack React Progressive Web App (PWA) client.
 */

#ifndef BLE_SERVICE_H
#define BLE_SERVICE_H

#include "config.h"
#include <NimBLEDevice.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/queue.h>

struct EMGDataPacket {
    int rawValue;
    float filteredValue;
    float voltageVolts;
};

class BLEServiceManager : public NimBLEServerCallbacks {
private:
    NimBLEServer *pServer;
    NimBLEService *pService;
    NimBLECharacteristic *pEMGCharacteristic;
    NimBLECharacteristic *pAudioCmdCharacteristic;
    NimBLECharacteristic *pVolumeCharacteristic;
    bool deviceConnected;
    bool oldDeviceConnected;

    TaskHandle_t bleTaskHandle;
    QueueHandle_t emgQueue;

    static void bleTaskWrapper(void *parameter);
    void bleTaskLoop();

public:
    BLEServiceManager();

    void begin();
    void updateConnectionState();
    void sendEMGData(int rawValue, float filteredValue, float voltageVolts);
    bool queueEMGData(int rawValue, float filteredValue, float voltageVolts);
    bool isConnected() const;

    // NimBLEServerCallbacks Overrides
    void onConnect(NimBLEServer* pServer) override;
    void onConnect(NimBLEServer* pServer, ble_gap_conn_desc* desc) override;
    void onDisconnect(NimBLEServer* pServer) override;
    void onDisconnect(NimBLEServer* pServer, ble_gap_conn_desc* desc) override;
};

#endif // BLE_SERVICE_H
