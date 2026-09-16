/**
 * VoiceBack Smart Neckband - Main Firmware
 *
 * Current hardware path:
 * VoiceBack application -> BLE -> ESP32 -> I2S -> MAX98357A -> physical speaker
 *
 * Hardware Wiring:
 * - MAX98357A I2S Amplifier:
 *     BCLK -> GPIO26
 *     LRC  -> GPIO25
 *     DIN  -> GPIO22
 * - Physical Mini Speaker (4 ohm, 3W)
 *
 * The legacy BioAmp/EMG hardware has been removed and is NOT initialized.
 *
 * INMP441 Microphone (ADDITIVE):
 *     SCK -> GPIO32  (I2S_NUM_1 Bit Clock)
 *     WS  -> GPIO33  (I2S_NUM_1 Word Select)
 *     SD  -> GPIO35  (I2S_NUM_1 Data In)
 * GPIO34 is NOT used.
 */

#include <Arduino.h>
#include "config.h"
#include "ble_service.h"
#include "audio_driver.h"
#include "mic_driver.h"

// System Modules
BLEServiceManager bleManager;
AudioDriver audioDriver(I2S_NUM_0);
MicDriver micDriver;

void setup() {
    Serial.begin(SERIAL_BAUD_RATE);
    delay(500);

    Serial.println();
    Serial.println("==================================================");
    Serial.println("   VoiceBack Smart Neckband - Audio Firmware");
    Serial.println("==================================================");

    // Initialize MAX98357A I2S Audio Amplifier
    Serial.println("[Init] Initializing MAX98357A audio...");
    if (audioDriver.begin()) {
        audioDriver.setVolume(70);
        Serial.println("[Audio] MAX98357A initialized and ready.");
    } else {
        Serial.println("[Audio ERROR] MAX98357A initialization FAILED.");
    }

    // Initialize BLE Subsystem
    Serial.println("[Init] Initializing BLE...");
    bleManager.begin();

    // Initialize INMP441 I2S Microphone (additive, uses I2S_NUM_1)
    Serial.println("[Init] Initializing INMP441 microphone (I2S_NUM_1)...");
    if (micDriver.begin()) {
        Serial.println("[Mic] INMP441 ready. Mic capture OFF at boot (awaiting START_MIC).");
    } else {
        Serial.println("[Mic WARNING] INMP441 init failed. Check GPIO32/33/35 wiring.");
    }

    Serial.println("[Init] VoiceBack BLE/audio firmware ready.");
    Serial.println("[Init] Waiting for application Bluetooth connection...");
}

void loop() {
    static bool lastConnected = false;
    bool connected = bleManager.isConnected();

    if (connected != lastConnected) {
        lastConnected = connected;
        Serial.printf(
            "[BLE State] %s\n",
            connected ? "CONNECTED" : "DISCONNECTED - advertising"
        );
    }

    // NimBLE runs its own host processing. Keep the Arduino loop responsive.
    delay(5);
}