/**
 * VoiceBack Smart Neckband - BLE Telemetry Service Implementation
 */

#include "ble_service.h"
#include <ArduinoJson.h>

BLEServiceManager::BLEServiceManager()
    : pServer(nullptr), pService(nullptr), pEMGCharacteristic(nullptr),
      pAudioCmdCharacteristic(nullptr), deviceConnected(false), oldDeviceConnected(false) {}

void BLEServiceManager::begin() {
    BLEDevice::init(BLE_DEVICE_NAME);
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(this);

    pService = pServer->createService(SERVICE_UUID);

    // EMG Telemetry Characteristic (Notify + Read)
    pEMGCharacteristic = pService->createCharacteristic(
        EMG_CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
    );
    pEMGCharacteristic->addDescriptor(new BLE2902());

    // Audio Command Characteristic (Write)
    pAudioCmdCharacteristic = pService->createCharacteristic(
        AUDIO_CMD_CHAR_UUID,
        BLECharacteristic::PROPERTY_WRITE
    );

    pService->start();

    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06); // functions that help with iPhone connections
    pAdvertising->setMinPreferred(0x12);
    BLEDevice::startAdvertising();

    Serial.println("[BLE Module] Server & GATT Advertising started.");
}

void BLEServiceManager::onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("[BLE Module] Central Device Connected.");
}

void BLEServiceManager::onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("[BLE Module] Central Device Disconnected. Restarting Advertising...");
}

void BLEServiceManager::updateConnectionState() {
    // Handle disconnection & restart advertising
    if (!deviceConnected && oldDeviceConnected) {
        delay(500); // give the bluetooth stack the chance to get things ready
        pServer->startAdvertising();
        oldDeviceConnected = deviceConnected;
    }
    // Handle connection
    if (deviceConnected && !oldDeviceConnected) {
        oldDeviceConnected = deviceConnected;
    }
}

void BLEServiceManager::sendEMGData(int rawValue, float filteredValue, float voltageVolts) {
    if (!deviceConnected || pEMGCharacteristic == nullptr) {
        return;
    }

    // Format JSON payload for mobile app parsing
    StaticJsonDocument<128> doc;
    doc["raw"] = rawValue;
    doc["flt"] = round(filteredValue * 100.0f) / 100.0f;
    doc["vlt"] = round(voltageVolts * 1000.0f) / 1000.0f;

    char payload[128];
    serializeJson(doc, payload);

    pEMGCharacteristic->setValue(payload);
    pEMGCharacteristic->notify();
}

bool BLEServiceManager::isConnected() const {
    return deviceConnected;
}
