/**
 * VoiceBack Smart Neckband - BLE Telemetry Service Header
 * 
 * Manages Bluetooth Low Energy GATT Server, advertisement, connection state,
 * and streaming EMG data packets to the VoiceBack mobile application.
 */

#ifndef BLE_SERVICE_H
#define BLE_SERVICE_H

#include "config.h"
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

class BLEServiceManager : public BLEServerCallbacks {
private:
    BLEServer *pServer;
    BLEService *pService;
    BLECharacteristic *pEMGCharacteristic;
    BLECharacteristic *pAudioCmdCharacteristic;
    bool deviceConnected;
    bool oldDeviceConnected;

public:
    BLEServiceManager();

    void begin();
    void updateConnectionState();
    void sendEMGData(int rawValue, float filteredValue, float voltageVolts);
    bool isConnected() const;

    // BLEServerCallbacks Overrides
    void onConnect(BLEServer* pServer) override;
    void onDisconnect(BLEServer* pServer) override;
};

#endif // BLE_SERVICE_H
