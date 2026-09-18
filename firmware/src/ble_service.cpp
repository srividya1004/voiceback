/**
 * VoiceBack Smart Neckband - BLE Audio Service Implementation
 *
 * Hardware pipeline:
 * VoiceBack application -> BLE -> ESP32 -> I2S -> MAX98357A -> physical speaker
 */

#include "ble_service.h"
#include <cstdlib>
#include <string>
#include "audio_driver.h"
#include "mic_driver.h"

extern AudioDriver audioDriver;
extern MicDriver micDriver;

// BLE Audio Characteristic Callback
class AudioCommandCallbacks : public NimBLECharacteristicCallbacks {
private:
    uint32_t packetCount = 0;
    uint32_t lastPacketTime = 0;
    uint32_t totalBytes = 0;
    uint32_t totalSamples = 0;
    uint32_t nonZeroSamples = 0;
    int16_t minSample = 32767;
    int16_t maxSample = -32768;

public:
    void onWrite(NimBLECharacteristic* pCharacteristic) override {
        NimBLEAttValue val = pCharacteristic->getValue();
        size_t len = val.size();
        const uint8_t* pcm = val.data();

        if (len == 0 || pcm == nullptr) {
            return;
        }

        // Fast zero-overhead audio buffer ingress
        audioDriver.writePCM(pcm, len);
    }
};

// BLE Volume Characteristic Callback
class VolumeCommandCallbacks : public NimBLECharacteristicCallbacks {
public:
    void onWrite(NimBLECharacteristic* pCharacteristic) override {
        std::string data = pCharacteristic->getValue();

        if (data.empty()) return;

        uint8_t vol = 70;
        if (data.size() == 1 && static_cast<unsigned char>(data[0]) <= 100) {
            vol = static_cast<uint8_t>(data[0]);
        } else {
            int parsed = atoi(data.c_str());
            vol = (parsed < 0) ? 0 : (parsed > 100 ? 100 : (uint8_t)parsed);
        }

        audioDriver.setVolume(vol);
        pCharacteristic->setValue(&vol, 1);

        Serial.printf("[BLE VOLUME] Volume updated via BLE to %u%%\n", vol);
    }
};

// BLE Microphone Control Characteristic Callback (PWA sends 0x01 to start, 0x00 to stop)
class MicControlCallbacks : public NimBLECharacteristicCallbacks {
public:
    void onWrite(NimBLECharacteristic* pCharacteristic) override {
        NimBLEAttValue val = pCharacteristic->getValue();
        if (val.size() == 0) return;
        uint8_t cmd = val.data()[0];
        if (cmd == 0x01) {
            Serial.println("[BLE MIC] Received START_MIC command (0x01) from PWA.");
            micDriver.setStreaming(true);
        } else if (cmd == 0x00) {
            Serial.println("[BLE MIC] Received STOP_MIC command (0x00) from PWA.");
            micDriver.setStreaming(false);
        }
    }
};

BLEServiceManager::BLEServiceManager()
    : pServer(nullptr),
      pService(nullptr),
      pAudioCmdCharacteristic(nullptr),
      pVolumeCharacteristic(nullptr),
      pEMGCharacteristic(nullptr),
      pMicCtrlCharacteristic(nullptr),
      pMicAudioCharacteristic(nullptr),
      deviceConnected(false) {}

void BLEServiceManager::begin() {
    Serial.println("[BLE Module] Initializing BLE...");

    NimBLEDevice::init(BLE_DEVICE_NAME);
    NimBLEDevice::setPower(ESP_PWR_LVL_P9);
    NimBLEDevice::setMTU(517); // Request maximum MTU (517) to safely allow 512-byte payloads

    pServer = NimBLEDevice::createServer();
    if (!pServer) {
        Serial.println("[BLE ERROR] Failed to create BLE server.");
        return;
    }
    pServer->setCallbacks(this);

    pService = pServer->createService(SERVICE_UUID);
    if (!pService) {
        Serial.println("[BLE ERROR] Failed to create VoiceBack BLE service.");
        return;
    }

    // 1. Audio Characteristic: Application -> ESP32 16-bit 16kHz mono PCM transport
    pAudioCmdCharacteristic = pService->createCharacteristic(
        AUDIO_CMD_CHAR_UUID,
        NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
    );
    if (!pAudioCmdCharacteristic) {
        Serial.println("[BLE ERROR] Failed to create audio characteristic.");
        return;
    }
    static AudioCommandCallbacks audioCallbacks;
    pAudioCmdCharacteristic->setCallbacks(&audioCallbacks);
    Serial.println("[BLE AUDIO] PCM audio characteristic ready.");

    // 2. Volume Characteristic: Application volume control
    pVolumeCharacteristic = pService->createCharacteristic(
        VOLUME_CHAR_UUID,
        NIMBLE_PROPERTY::READ |
        NIMBLE_PROPERTY::WRITE |
        NIMBLE_PROPERTY::WRITE_NR
    );
    if (!pVolumeCharacteristic) {
        Serial.println("[BLE ERROR] Failed to create volume characteristic.");
        return;
    }
    static VolumeCommandCallbacks volumeCallbacks;
    pVolumeCharacteristic->setCallbacks(&volumeCallbacks);
    uint8_t initialVolume = audioDriver.getVolume();
    pVolumeCharacteristic->setValue(&initialVolume, 1);
    Serial.println("[BLE VOLUME] Volume characteristic ready.");

    // 3. Inert Compatibility Characteristic: Retained strictly so PWA GATT discovery succeeds
    // without requiring any changes to PWA code. No ADC sampling, no queue, no notifications.
    pEMGCharacteristic = pService->createCharacteristic(
        EMG_CHARACTERISTIC_UUID,
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
    );
    if (pEMGCharacteristic) {
        Serial.println("[BLE COMPAT] Inert compatibility characteristic initialized.");
    }

    // 4. Microphone Control Characteristic (Write / WriteNR)
    pMicCtrlCharacteristic = pService->createCharacteristic(
        MIC_CTRL_CHAR_UUID,
        NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
    );
    if (!pMicCtrlCharacteristic) {
        Serial.println("[BLE ERROR] Failed to create mic control characteristic.");
        return;
    }
    static MicControlCallbacks micCtrlCallbacks;
    pMicCtrlCharacteristic->setCallbacks(&micCtrlCallbacks);
    Serial.println("[BLE MIC] Control characteristic ready.");

    // 5. Microphone Audio Characteristic (Notify / Read)
    pMicAudioCharacteristic = pService->createCharacteristic(
        MIC_AUDIO_CHAR_UUID,
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
    );
    if (!pMicAudioCharacteristic) {
        Serial.println("[BLE ERROR] Failed to create mic audio characteristic.");
        return;
    }
    Serial.println("[BLE MIC] Audio streaming characteristic ready.");

    pService->start();
    Serial.println("[BLE Module] VoiceBack BLE service started.");

    NimBLEAdvertising* advertising = NimBLEDevice::getAdvertising();
    if (!advertising) {
        Serial.println("[BLE ERROR] Failed to get advertising object.");
        return;
    }

    advertising->addServiceUUID(NimBLEUUID(SERVICE_UUID));
    advertising->setScanResponse(true);
    advertising->setName(BLE_DEVICE_NAME);
    advertising->start();

    Serial.printf("[BLE Module] Advertising as %s\n", BLE_DEVICE_NAME);
    Serial.println("[BLE Module] Waiting for VoiceBack application connection.");
}

bool BLEServiceManager::isConnected() const {
    return deviceConnected;
}

void BLEServiceManager::sendMicAudioChunk(const uint8_t* data, size_t len) {
    if (pMicAudioCharacteristic && deviceConnected && data && len > 0) {
        pMicAudioCharacteristic->setValue(data, len);
        pMicAudioCharacteristic->notify();
    }
}

void BLEServiceManager::onConnect(NimBLEServer* pServer, ble_gap_conn_desc* desc) {
    if (!deviceConnected) {
        deviceConnected = true;
        Serial.println("[BLE Event] >>> VOICEBACK APPLICATION CONNECTED <<<");
        if (desc) {
            Serial.printf(
                "[BLE Event] Client: %s\n",
                NimBLEAddress(desc->peer_ota_addr).toString().c_str()
            );
            // Request high-speed connection interval (7.5ms min, 15ms max) from central
            if (pServer) {
                pServer->updateConnParams(desc->conn_handle, 6, 12, 0, 400);
            }
        }
        // Connection chime silenced per requirements
    }
}

void BLEServiceManager::onDisconnect(NimBLEServer* /*pServer*/, ble_gap_conn_desc* /*desc*/) {
    if (deviceConnected) {
        deviceConnected = false;
        Serial.println("[BLE Event] >>> APPLICATION DISCONNECTED <<<");
        audioDriver.stop();
        micDriver.setStreaming(false);
        // Disconnection chime silenced per requirements
        NimBLEDevice::startAdvertising();
    }
}