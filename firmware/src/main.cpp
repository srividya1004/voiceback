/**
 * VoiceBack Smart Neckband - Main Firmware
 *
 * Current hardware path:
 * VoiceBack application -> BLE -> ESP32 -> I2S -> MAX98357A -> physical speaker
 *
 * Hardware Wiring:
 * - MAX98357A I2S Amplifier (I2S_NUM_0):
 *     BCLK -> GPIO27
 *     LRC  -> GPIO14
 *     DIN  -> GPIO22
 * - Physical Mini Speaker (4 ohm, 3W)
 * - INMP441 I2S Microphone (I2S_NUM_1, independent peripheral):
 *     SCK  -> GPIO26
 *     WS   -> GPIO25
 *     SD   -> GPIO34
 *
 * The legacy BioAmp/EMG hardware has been removed and is NOT initialized.
 */

#include <Arduino.h>
#include "config.h"
#include "ble_service.h"
#include "audio_driver.h"
#include "mic_driver.h"

// System Modules
BLEServiceManager bleManager;
AudioDriver audioDriver(I2S_NUM_0);
MicDriver micDriver(I2S_NUM_1);

void setup() {
    Serial.begin(SERIAL_BAUD_RATE);
    delay(500);

    Serial.println();
    Serial.println("==================================================");
    Serial.println("   VoiceBack Smart Neckband - Audio Firmware");
    Serial.println("==================================================");

    // Initialize MAX98357A I2S Audio Amplifier (I2S_NUM_0: BCLK=27, LRC=14, DIN=22)
    Serial.println("[Init] Initializing MAX98357A audio...");
    if (audioDriver.begin()) {
        audioDriver.setVolume(100);
        Serial.println("[Audio] MAX98357A initialized and ready.");
    } else {
        Serial.println("[Audio ERROR] MAX98357A initialization FAILED.");
    }

    // Initialize INMP441 I2S Microphone (I2S_NUM_1: SCK=26, WS=25, SD=34)
    Serial.println("[Init] Initializing INMP441 microphone...");
    if (micDriver.begin()) {
        micDriver.startCaptureTask();
        Serial.println("[Mic] INMP441 initialized and capture task started.");
    } else {
        Serial.println("[Mic ERROR] INMP441 initialization FAILED.");
    }

    // Initialize BLE Subsystem
    Serial.println("[Init] Initializing BLE...");
    bleManager.begin();

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