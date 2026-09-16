/**
 * VoiceBack Smart Neckband - BLE Service Header
 *
 * Current hardware path:
 * Microphone/application -> BLE -> ESP32 -> I2S -> MAX98357A -> physical speaker
 */
#ifndef BLE_SERVICE_H
#define BLE_SERVICE_H

#include "config.h"
#include <NimBLEDevice.h>

class BLEServiceManager : public NimBLEServerCallbacks {
private:
    NimBLEServer *pServer;
    NimBLEService *pService;
    NimBLECharacteristic *pAudioCmdCharacteristic;
    NimBLECharacteristic *pVolumeCharacteristic;
    NimBLECharacteristic *pEMGCharacteristic; // Retained strictly as inert compatibility characteristic for PWA GATT discovery
    bool deviceConnected;

public:
    BLEServiceManager();

    void begin();
    bool isConnected() const;

    // NimBLEServerCallbacks Overrides
    void onConnect(NimBLEServer* pServer, ble_gap_conn_desc* desc) override;
    void onDisconnect(NimBLEServer* pServer, ble_gap_conn_desc* desc) override;
};

#endif // BLE_SERVICE_H
