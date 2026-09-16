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

extern AudioDriver audioDriver;

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

        uint32_t now = millis();
        if (now - lastPacketTime > 300) {
            // New voice utterance ingress
            packetCount = 0;
            totalBytes = 0;
            totalSamples = 0;
            nonZeroSamples = 0;
            minSample = 32767;
            maxSample = -32768;
            Serial.printf("[BLE AUDIO Stream] Ingress start: %u bytes/pkt\n", (unsigned int)len);
        }
        lastPacketTime = now;
        packetCount++;
        totalBytes += len;

        // Waveform inspection across received 16-bit samples
        size_t samplesInPacket = len / 2;
        for (size_t i = 0; i < samplesInPacket; i++) {
            size_t off = i * 2;
            int16_t sample = (int16_t)((uint16_t)pcm[off] | ((uint16_t)pcm[off + 1] << 8));
            totalSamples++;
            if (sample != 0) {
                nonZeroSamples++;
            }
            if (sample < minSample) minSample = sample;
            if (sample > maxSample) maxSample = sample;
        }

        // Buffer raw 16-bit mono PCM bytes into AudioDriver ring buffer
        audioDriver.writePCM(pcm, len);

        if (packetCount % 50 == 0) {
            Serial.printf("[BLE AUDIO Stream] Ingress: %u pkts (%u bytes), range=[%d, %d], nonZero=%u/%u\n",
                          (unsigned int)packetCount, (unsigned int)totalBytes,
                          minSample, maxSample, (unsigned int)nonZeroSamples, (unsigned int)totalSamples);
        }
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

BLEServiceManager::BLEServiceManager()
    : pServer(nullptr),
      pService(nullptr),
      pAudioCmdCharacteristic(nullptr),
      pVolumeCharacteristic(nullptr),
      pEMGCharacteristic(nullptr),
      deviceConnected(false) {}

void BLEServiceManager::begin() {
    Serial.println("[BLE Module] Initializing BLE...");

    NimBLEDevice::init(BLE_DEVICE_NAME);
    NimBLEDevice::setPower(ESP_PWR_LVL_P9);

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
    // without requiring any changes to PWA code. No GPIO34 access, no ADC sampling, no queue, no notifications.
    pEMGCharacteristic = pService->createCharacteristic(
        EMG_CHARACTERISTIC_UUID,
        NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
    );
    if (pEMGCharacteristic) {
        Serial.println("[BLE COMPAT] Inert compatibility characteristic initialized.");
    }

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
        audioDriver.playConnectedSound();
    }
}

void BLEServiceManager::onDisconnect(NimBLEServer* /*pServer*/, ble_gap_conn_desc* /*desc*/) {
    if (deviceConnected) {
        deviceConnected = false;
        Serial.println("[BLE Event] >>> APPLICATION DISCONNECTED <<<");
        audioDriver.stop();
        audioDriver.playDisconnectedSound();
        NimBLEDevice::startAdvertising();
    }
}