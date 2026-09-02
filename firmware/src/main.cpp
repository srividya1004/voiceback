/**
 * VoiceBack Smart Neckband - Main Firmware
 *
 * Hardware:
 * - BioAmp EXG Pill EMG -> GPIO34
 * - ESP32
 * - MAX98357A I2S Amplifier
 *   BCLK -> GPIO26
 *   LRC  -> GPIO25
 *   DIN  -> GPIO22
 * - Physical Speaker
 */

#include <Arduino.h>
#include "config.h"
#include "emg_sensor.h"
#include "ble_service.h"
#include "wifi_ap_service.h"
#include "audio_driver.h"

// ============================================================
// SYSTEM MODULES
// ============================================================

EMGSensor emgSensor(BIOAMP_ANALOG_PIN, EMA_ALPHA);

BLEServiceManager bleManager;

WiFiAPServiceManager wifiAPManager;

AudioDriver audioDriver(I2S_NUM_0);

// ============================================================
// TIMING
// ============================================================



unsigned long lastAdcSampleMicros = 0;
unsigned long lastBleNotifyMillis = 0;
static EMGData latestEMGData;

// ============================================================
// SETUP
// ============================================================

void setup() {

    // --------------------------------------------------------
    // 1. SERIAL
    // --------------------------------------------------------

    Serial.begin(SERIAL_BAUD_RATE);

    delay(200);

#if (EMG_DEBUG_MODE == DEBUG_NORMAL)
    Serial.println();
    Serial.println("==================================================");
    Serial.println("   VoiceBack Smart Neckband Prototype Firmware");
    Serial.println("==================================================");
#endif

    // --------------------------------------------------------
    // 2. EMG SENSOR
    // --------------------------------------------------------

#if (EMG_DEBUG_MODE == DEBUG_NORMAL)
    Serial.println("[Init] Initializing BioAmp EXG Pill...");
#endif

    emgSensor.begin();

    emgSensor.calibrateBaseline(500);

#if (EMG_DEBUG_MODE == DEBUG_NORMAL)
    Serial.println("[Init] EMG sensor ready.");
#endif

    // --------------------------------------------------------
    // 3. BLE
    // --------------------------------------------------------

#if (EMG_DEBUG_MODE == DEBUG_NORMAL)
    Serial.println("[Init] Initializing BLE...");
#endif

    bleManager.begin();

#if (EMG_DEBUG_MODE == DEBUG_NORMAL)
    Serial.println("[Init] BLE ready.");
#endif

    // --------------------------------------------------------
    // 4. WIFI
    // --------------------------------------------------------

#if (EMG_DEBUG_MODE == DEBUG_NORMAL)
    Serial.println("[Init] Initializing WiFi Access Point...");
#endif

    wifiAPManager.begin();

#if (EMG_DEBUG_MODE == DEBUG_NORMAL)
    Serial.println("[Init] WiFi ready.");
#endif

    // --------------------------------------------------------
    // 5. PHYSICAL AUDIO
    // --------------------------------------------------------

#if (EMG_DEBUG_MODE == DEBUG_NORMAL)
    Serial.println("[Init] Initializing MAX98357A audio...");
#endif

    if (audioDriver.begin()) {
        audioDriver.setVolume(80);
        audioDriver.playTestTone(880, 200); // 200ms startup tone on physical speaker
#if (EMG_DEBUG_MODE == DEBUG_NORMAL)
        Serial.println("[Audio] MAX98357A initialized & ready.");
#endif
    } else {
#if (EMG_DEBUG_MODE == DEBUG_NORMAL)
        Serial.println("[Audio ERROR] MAX98357A initialization FAILED.");
#endif
    }

#if (EMG_DEBUG_MODE == DEBUG_NORMAL)
    Serial.println();
    Serial.println("[Init] All subsystems initialized. Entering main loop.");
    Serial.println();
#endif
}


// ============================================================
// LOOP
// ============================================================

void loop() {

    unsigned long currentMicros = micros();
    unsigned long currentMillis = millis();


    // --------------------------------------------------------
    // BLE CONNECTION STATUS
    // --------------------------------------------------------

    static bool lastBleState = false;
    bool currentBleState = bleManager.isConnected();

    if (currentBleState != lastBleState) {
        lastBleState = currentBleState;
#if (EMG_DEBUG_MODE == DEBUG_NORMAL)
        Serial.printf(
            "\n[BLE State Changed] Status: %s\n\n",
            currentBleState
                ? "CONNECTED (Streaming Active)"
                : "DISCONNECTED (Advertising...)"
        );
#endif
        if (currentBleState) {
            Serial.println("[Hardware Event] Application Connected -> Playing 'CONNECTED' sound chime via physical speaker...");
            audioDriver.playConnectedSound();
        } else {
            Serial.println("[Hardware Event] Application Disconnected -> Playing 'DISCONNECTED' sound chime via physical speaker...");
            audioDriver.playDisconnectedSound();
        }
    }


    // --------------------------------------------------------
    // HIGH-SPEED EMG ADC SAMPLING - 500 Hz (every 2000 us)
    // --------------------------------------------------------

    if (currentMicros - lastAdcSampleMicros >= EMG_SAMPLE_INTERVAL_US) {
        lastAdcSampleMicros = currentMicros;

        // Read high-speed raw ADC & process envelope
        latestEMGData = emgSensor.readData();

#if (EMG_DEBUG_MODE == DEBUG_RAW_EMG)
        // Arduino Serial Plotter stream: exactly ONE numeric raw ADC value per line
        Serial.println(latestEMGData.rawAnalog);
#elif (EMG_DEBUG_MODE == DEBUG_NORMAL)
        if (latestEMGData.isSaturated) {
            static unsigned long lastSatWarn = 0;
            if (currentMillis - lastSatWarn >= 10000) {
                lastSatWarn = currentMillis;
                Serial.println("[EMG WARNING] ADC SATURATION DETECTED (GPIO34 >= 4090)");
            }
        }
#endif
    }


    // --------------------------------------------------------
    // BLE TELEMETRY TRANSMISSION - 50 Hz (every 20 ms)
    // --------------------------------------------------------

    if (currentMillis - lastBleNotifyMillis >= BLE_NOTIFY_INTERVAL_MS) {
        lastBleNotifyMillis = currentMillis;

        // Send latest sampled EMG data over BLE & WiFi
        bleManager.queueEMGData(
            latestEMGData.rawAnalog,
            latestEMGData.filteredVal,
            latestEMGData.voltageVolts
        );

        wifiAPManager.queueEMGData(
            latestEMGData.rawAnalog,
            latestEMGData.filteredVal,
            latestEMGData.voltageVolts
        );
    }
}