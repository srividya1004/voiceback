/**
 * VoiceBack Smart Neckband - BLE Telemetry + Audio Service
 *
 * Features:
 * - BLE GATT server
 * - EMG telemetry notifications
 * - BLE PCM audio reception
 * - PCM audio forwarded to MAX98357A I2S amplifier
 */

#include "ble_service.h"
#include <ArduinoJson.h>
#include <cstring>
#include "audio_driver.h"

// AudioDriver instance is created in main.cpp
extern AudioDriver audioDriver;


// ============================================================
// BLE AUDIO RECEIVE CALLBACK
// Receives raw 16-bit PCM audio from the application
// and sends it directly to MAX98357A.
// ============================================================

class AudioCommandCallbacks : public NimBLECharacteristicCallbacks {

public:

    void onWrite(NimBLECharacteristic* pCharacteristic) override {

        std::string data = pCharacteristic->getValue();

        if (data.empty()) {
            Serial.println("[BLE AUDIO] Empty audio packet received.");
            return;
        }

        Serial.printf(
            "[BLE AUDIO] Received %u bytes\n",
            (unsigned int)data.size()
        );

        // Forward raw PCM bytes to MAX98357A
        size_t written = audioDriver.writePCM(
            reinterpret_cast<const uint8_t*>(data.data()),
            data.size()
        );

        Serial.printf(
            "[BLE AUDIO] Sent %u bytes to MAX98357A\n",
            (unsigned int)written
        );
    }
};


// ============================================================
// BLE VOLUME RECEIVE CALLBACK
// Receives 0-100 integer volume values from PWA
// ============================================================

class VolumeCommandCallbacks : public NimBLECharacteristicCallbacks {

public:

    void onWrite(NimBLECharacteristic* pCharacteristic) override {

        std::string data = pCharacteristic->getValue();

        if (data.empty()) {
            Serial.println("[BLE VOLUME] Empty volume packet received.");
            return;
        }

        uint8_t vol = 70;
        if (data.size() == 1) {
            vol = static_cast<uint8_t>(data[0]);
        } else {
            vol = static_cast<uint8_t>(atoi(data.c_str()));
        }

        if (vol > 100) vol = 100;

        audioDriver.setVolume(vol);
        pCharacteristic->setValue(&vol, 1);

        Serial.printf(
            "[BLE VOLUME] Volume updated via BLE to %u%%\n",
            vol
        );
    }
};


// ============================================================
// CONSTRUCTOR
// ============================================================

BLEServiceManager::BLEServiceManager()
    : pServer(nullptr),
      pService(nullptr),
      pEMGCharacteristic(nullptr),
      pAudioCmdCharacteristic(nullptr),
      pVolumeCharacteristic(nullptr),
      deviceConnected(false),
      oldDeviceConnected(false),
      bleTaskHandle(nullptr),
      emgQueue(nullptr) {
}


// ============================================================
// BLE INITIALIZATION
// ============================================================

void BLEServiceManager::begin() {

    Serial.println("[BLE Module] Initializing BLE...");

    // Initialize BLE device
    NimBLEDevice::init(BLE_DEVICE_NAME);

    // Maximum Bluetooth TX power
    NimBLEDevice::setPower(ESP_PWR_LVL_P9);

    // Create BLE server
    pServer = NimBLEDevice::createServer();

    if (pServer == nullptr) {
        Serial.println("[BLE ERROR] Failed to create BLE server.");
        return;
    }

    pServer->setCallbacks(this);

    // Create main VoiceBack BLE service
    pService = pServer->createService(SERVICE_UUID);

    if (pService == nullptr) {
        Serial.println("[BLE ERROR] Failed to create BLE service.");
        return;
    }


    // ========================================================
    // EMG TELEMETRY CHARACTERISTIC
    // ========================================================

    pEMGCharacteristic = pService->createCharacteristic(
        EMG_CHARACTERISTIC_UUID,
        NIMBLE_PROPERTY::READ |
        NIMBLE_PROPERTY::NOTIFY
    );

    if (pEMGCharacteristic == nullptr) {
        Serial.println("[BLE ERROR] Failed to create EMG characteristic.");
        return;
    }

    Serial.println("[BLE Module] EMG characteristic created.");


    // ========================================================
    // AUDIO RECEIVE CHARACTERISTIC
    // ========================================================

    pAudioCmdCharacteristic = pService->createCharacteristic(
        AUDIO_CMD_CHAR_UUID,
        NIMBLE_PROPERTY::WRITE
    );

    if (pAudioCmdCharacteristic == nullptr) {
        Serial.println("[BLE ERROR] Failed to create audio characteristic.");
        return;
    }

    // IMPORTANT:
    // Keep callback object alive for the lifetime of the BLE service.
    static AudioCommandCallbacks audioCommandCallbacks;

    pAudioCmdCharacteristic->setCallbacks(
        &audioCommandCallbacks
    );

    Serial.println(
        "[BLE AUDIO] Audio command characteristic ready."
    );


    // ========================================================
    // VOLUME CONTROL CHARACTERISTIC
    // ========================================================

    pVolumeCharacteristic = pService->createCharacteristic(
        VOLUME_CHAR_UUID,
        NIMBLE_PROPERTY::WRITE |
        NIMBLE_PROPERTY::WRITE_NR |
        NIMBLE_PROPERTY::READ
    );

    if (pVolumeCharacteristic == nullptr) {
        Serial.println("[BLE ERROR] Failed to create volume characteristic.");
        return;
    }

    static VolumeCommandCallbacks volumeCommandCallbacks;

    pVolumeCharacteristic->setCallbacks(
        &volumeCommandCallbacks
    );

    uint8_t initialVol = audioDriver.getVolume();
    pVolumeCharacteristic->setValue(&initialVol, 1);

    Serial.println(
        "[BLE VOLUME] Volume control characteristic ready."
    );


    // ========================================================
    // START BLE SERVICE
    // ========================================================

    pService->start();

    Serial.println("[BLE Module] BLE service started.");


    // ========================================================
    // BLE ADVERTISING
    // ========================================================

    NimBLEAdvertising* pAdvertising =
        NimBLEDevice::getAdvertising();

    if (pAdvertising == nullptr) {
        Serial.println("[BLE ERROR] Failed to get advertising object.");
        return;
    }

    // Primary advertisement
    NimBLEAdvertisementData advData;

    advData.setFlags(
        BLE_HS_ADV_F_DISC_GEN |
        BLE_HS_ADV_F_BREDR_UNSUP
    );

    advData.setCompleteServices(
        NimBLEUUID(SERVICE_UUID)
    );


    // Scan response containing device name
    NimBLEAdvertisementData scanData;

    scanData.setName(
        BLE_DEVICE_NAME
    );


    pAdvertising->addServiceUUID(
        NimBLEUUID(SERVICE_UUID)
    );

    pAdvertising->setAdvertisementData(
        advData
    );

    pAdvertising->setScanResponseData(
        scanData
    );

    pAdvertising->setScanResponse(true);

    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMaxPreferred(0x12);

    pAdvertising->start();

    Serial.println(
        "[BLE Module] NimBLE Server & Advertising started successfully."
    );


    // ========================================================
    // CREATE EMG FREE RTOS QUEUE
    // ========================================================

    emgQueue = xQueueCreate(
        16,
        sizeof(EMGDataPacket)
    );

    if (emgQueue == nullptr) {
        Serial.println(
            "[BLE ERROR] Failed to create EMG queue."
        );
        return;
    }

    Serial.println(
        "[BLE Module] EMG queue created."
    );


    // ========================================================
    // CREATE BLE FREE RTOS TASK (COMMENTED OUT)
    // ========================================================

    /*
    xTaskCreatePinnedToCore(
        BLEServiceManager::bleTaskWrapper,
        "BLE_NimBLE_Task",
        4096,
        this,
        1,
        &bleTaskHandle,
        0
    );

    Serial.println(
        "[BLE Module] Dedicated FreeRTOS BLE Task spawned on Core 0."
    );
    */
    Serial.println(
        "[BLE Module] Dedicated FreeRTOS BLE Task is currently COMMENTED OUT."
    );

    Serial.println(
        "[BLE Module] BLE initialization complete."
    );
}


// ============================================================
// BLE TASK WRAPPER (COMMENTED OUT)
// ============================================================

void BLEServiceManager::bleTaskWrapper(void* parameter) {
    /*
    BLEServiceManager* instance =
        static_cast<BLEServiceManager*>(parameter);

    if (instance != nullptr) {
        instance->bleTaskLoop();
    }
    */
    vTaskDelete(nullptr);
}


// ============================================================
// BLE TASK LOOP (COMMENTED OUT)
// ============================================================

void BLEServiceManager::bleTaskLoop() {
    /*
    EMGDataPacket packet;

    while (true) {

        // Receive EMG packet from queue
        if (
            emgQueue != nullptr &&
            xQueueReceive(
                emgQueue,
                &packet,
                pdMS_TO_TICKS(20)
            ) == pdTRUE
        ) {

            sendEMGData(
                packet.rawValue,
                packet.filteredValue,
                packet.voltageVolts
            );
        }

        // Maintain BLE connection
        updateConnectionState();

        // Give FreeRTOS time
        vTaskDelay(
            pdMS_TO_TICKS(2)
        );
    }
    */
}


// ============================================================
// QUEUE EMG DATA
// ============================================================

bool BLEServiceManager::queueEMGData(
    int rawValue,
    float filteredValue,
    float voltageVolts
) {

    if (emgQueue == nullptr) {
        return false;
    }

    EMGDataPacket packet = {
        rawValue,
        filteredValue,
        voltageVolts
    };


    // Try normal queue insertion
    if (
        xQueueSend(
            emgQueue,
            &packet,
            0
        ) != pdTRUE
    ) {

        // Queue full:
        // Remove oldest packet
        EMGDataPacket dropped;

        xQueueReceive(
            emgQueue,
            &dropped,
            0
        );

        // Insert newest packet
        xQueueSend(
            emgQueue,
            &packet,
            0
        );
    }

    return true;
}


// ============================================================
// BLE CONNECT
// ============================================================

void BLEServiceManager::onConnect(
    NimBLEServer* pServer
) {

    deviceConnected = true;

    Serial.println(
        "\n[BLE Event] >>> CENTRAL DEVICE CONNECTED <<<\n"
    );
}


void BLEServiceManager::onConnect(
    NimBLEServer* pServer,
    ble_gap_conn_desc* desc
) {

    deviceConnected = true;

    Serial.println(
        "\n[BLE Event] >>> CENTRAL DEVICE CONNECTED <<<\n"
    );

    if (desc != nullptr) {

        Serial.printf(
            "[BLE Event] Client Address: %s\n",
            NimBLEAddress(
                desc->peer_ota_addr
            ).toString().c_str()
        );
    }
}


// ============================================================
// BLE DISCONNECT
// ============================================================

void BLEServiceManager::onDisconnect(
    NimBLEServer* pServer
) {

    deviceConnected = false;

    Serial.println(
        "\n[BLE Event] >>> CENTRAL DEVICE DISCONNECTED <<<\n"
    );

    NimBLEDevice::startAdvertising();
}


void BLEServiceManager::onDisconnect(
    NimBLEServer* pServer,
    ble_gap_conn_desc* desc
) {

    deviceConnected = false;

    Serial.println(
        "\n[BLE Event] >>> CENTRAL DEVICE DISCONNECTED <<<\n"
    );

    NimBLEDevice::startAdvertising();
}


// ============================================================
// BLE CONNECTION STATE
// ============================================================

void BLEServiceManager::updateConnectionState() {

    // Device disconnected
    if (
        !deviceConnected &&
        oldDeviceConnected
    ) {

        delay(100);

        NimBLEDevice::startAdvertising();

        oldDeviceConnected =
            deviceConnected;

        Serial.println(
            "[BLE Module] Restarted BLE Advertising after disconnection."
        );
    }


    // Device connected
    if (
        deviceConnected &&
        !oldDeviceConnected
    ) {

        oldDeviceConnected =
            deviceConnected;

        Serial.println(
            "[BLE Module] BLE connection established."
        );
    }
}


// ============================================================
// SEND EMG DATA TO APPLICATION
// ============================================================

void BLEServiceManager::sendEMGData(
    int rawValue,
    float filteredValue,
    float voltageVolts
) {

    if (
        !deviceConnected ||
        pEMGCharacteristic == nullptr
    ) {
        return;
    }


    // Only send if application subscribed
    if (
        pEMGCharacteristic->getSubscribedCount() == 0
    ) {
        return;
    }


    // Create JSON packet
    StaticJsonDocument<128> doc;

    doc["raw"] = rawValue;

    doc["flt"] =
        round(
            filteredValue * 100.0f
        ) / 100.0f;

    doc["vlt"] =
        round(
            voltageVolts * 1000.0f
        ) / 1000.0f;


    char payload[128];

    serializeJson(
        doc,
        payload
    );


    // Send notification
    pEMGCharacteristic->setValue(
        (uint8_t*)payload,
        strlen(payload)
    );

    pEMGCharacteristic->notify();
}


// ============================================================
// CONNECTION STATUS
// ============================================================

bool BLEServiceManager::isConnected() const {

    return deviceConnected;
}