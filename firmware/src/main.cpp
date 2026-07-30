/**
 * VoiceBack Smart Neckband - Modular Prototype Firmware Main Entry Point
 * 
 * Hardware Architecture:
 * - AD620 Analog EMG Sensor Module (GPIO34 / ADC1_CH6)
 * - ESP32 Development Board (ESP-WROOM-32, built-in BLE 5.0 & Wi-Fi)
 * - MAX98357A I2S Class-D Audio Amplifier (BCLK: GPIO4, LRC: GPIO5, DOUT: GPIO6)
 * - 4 Ohm 3W Speaker
 * - TP4056 USB Charger + 3.7V Li-Po Battery + Power Switch
 */

#include <Arduino.h>
#include "config.h"
#include "emg_sensor.h"
#include "ble_service.h"
#include "audio_driver.h"

// System Module Instances
EMGSensor emgSensor(AD620_ANALOG_PIN, EMA_ALPHA);
BLEServiceManager bleManager;
AudioDriver audioDriver(I2S_NUM_0);

// Loop timing
unsigned long lastSampleTime = 0;

void setup() {
    // 1. Initialize Serial Communications for Debugging
    Serial.begin(SERIAL_BAUD_RATE);
    while (!Serial && millis() < 2000); // Brief wait for USB CDC
    Serial.println("\n==================================================");
    Serial.println("   VoiceBack Smart Neckband Prototype Firmware    ");
    Serial.println("==================================================");

    // 2. Initialize AD620 EMG Sensor & Calibrate Baseline
    Serial.println("[Init] Initializing AD620 EMG Sensor on GPIO34...");
    emgSensor.begin();
    emgSensor.calibrateBaseline(50);

    // 3. Initialize BLE Telemetry & GATT Server
    Serial.println("[Init] Initializing BLE GATT Server...");
    bleManager.begin();

    // 4. Initialize MAX98357A I2S Audio Interface
    Serial.println("[Init] Initializing MAX98357A I2S Audio Driver...");
    if (audioDriver.begin()) {
        // Play short 440Hz startup chime (300ms) to indicate hardware readiness
        audioDriver.playTestTone(440, 300);
    }

    Serial.println("[Init] All subsystems initialized successfully. Entering loop.\n");
}

void loop() {
    unsigned long currentMillis = millis();

    // 1. Maintain BLE connection state & handle auto-advertising
    bleManager.updateConnectionState();

    // 2. Fixed-interval EMG Sampling Loop (50 Hz / 20ms)
    if (currentMillis - lastSampleTime >= SAMPLE_INTERVAL_MS) {
        lastSampleTime = currentMillis;

        // Acquire analog reading and apply EMA filter
        EMGData emg = emgSensor.readData();

        // Send JSON data packet over BLE notify characteristic if connected
        if (bleManager.isConnected()) {
            bleManager.sendEMGData(emg.rawAnalog, emg.filteredVal, emg.voltageVolts);
        }

        // Print telemetry output to Serial Monitor for plot debugging
        Serial.printf(">AD620_Raw:%d,Filtered:%.2f,Voltage:%.3fV,MAV:%.2f\n",
                      emg.rawAnalog, emg.filteredVal, emg.voltageVolts, emg.mav);
    }
}
