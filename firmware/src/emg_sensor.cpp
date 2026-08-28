/**
 * VoiceBack Smart Neckband - BioAmp EXG Pill EMG Sensor Implementation
 */

#include "emg_sensor.h"

EMGSensor::EMGSensor(uint8_t pin, float filterAlpha)
    : analogPin(pin), currentFilteredValue(0.0f), baselineADC(DEFAULT_EMG_BASELINE), alpha(filterAlpha), saturatedState(false) {}

void EMGSensor::begin() {
    pinMode(analogPin, INPUT);
    // Explicitly configure 11 dB attenuation for full 0V - 3.3V range on ESP32 ADC
    analogSetPinAttenuation(analogPin, ADC_11db);
    analogReadResolution(ADC_RESOLUTION_BITS); // 12-bit resolution (0 to 4095)

    // Initial dummy read to warm up ADC
    int initialRead = analogRead(analogPin);
    currentFilteredValue = 0.0f;
}

void EMGSensor::calibrateBaseline(uint16_t numSamples) {
    long accum = 0;
    uint16_t validCount = 0;

    for (uint16_t i = 0; i < numSamples; i++) {
        int val = analogRead(analogPin);
        accum += val;
        validCount++;
        delayMicroseconds(2000); // 500 Hz sampling pace during calibration
    }

    if (validCount > 0) {
        baselineADC = (float)accum / (float)validCount;
    } else {
        baselineADC = DEFAULT_EMG_BASELINE;
    }

    currentFilteredValue = 0.0f;
#if (EMG_DEBUG_MODE == DEBUG_NORMAL)
    Serial.printf("[EMG Module] Calibrated Baseline ADC Value: %.2f (from %u samples)\n", baselineADC, validCount);
#endif
}

EMGData EMGSensor::readData() {
    EMGData data;
    data.rawAnalog = analogRead(analogPin);

    // Detect saturation explicitly
    saturatedState = (data.rawAnalog >= ADC_SATURATION_THRESHOLD);
    data.isSaturated = saturatedState;
    data.baselineADC = baselineADC;

    // Use ESP32 factory eFuse calibrated millivolt conversion if available
    uint32_t mv = analogReadMilliVolts(analogPin);
    data.voltageVolts = (float)mv / 1000.0f;

    // Preserve raw sample as unrectified ADC value.
    // For filteredVal, compute smoothed rectified amplitude envelope:
    float rectVal = abs((float)data.rawAnalog - baselineADC);
    currentFilteredValue = (alpha * rectVal) + ((1.0f - alpha) * currentFilteredValue);

    data.filteredVal = currentFilteredValue;
    data.mav = currentFilteredValue;

    return data;
}

float EMGSensor::getFilteredValue() const {
    return currentFilteredValue;
}

float EMGSensor::getBaseline() const {
    return baselineADC;
}

bool EMGSensor::isSaturated() const {
    return saturatedState;
}
