/**
 * VoiceBack Smart Neckband - AD620 EMG Sensor Implementation
 */

#include "emg_sensor.h"

EMGSensor::EMGSensor(uint8_t pin, float filterAlpha)
    : analogPin(pin), currentFilteredValue(0.0f), baselineVoltage(DEFAULT_EMG_BASELINE), alpha(filterAlpha) {}

void EMGSensor::begin() {
    pinMode(analogPin, INPUT);
    analogReadResolution(ADC_RESOLUTION_BITS); // 12-bit resolution (0 to 4095)

    // Initial dummy read to warm up ADC
    int initialRead = analogRead(analogPin);
    currentFilteredValue = (float)initialRead;
}

void EMGSensor::calibrateBaseline(uint16_t numSamples) {
    long accum = 0;
    for (uint16_t i = 0; i < numSamples; i++) {
        accum += analogRead(analogPin);
        delay(5);
    }
    baselineVoltage = (float)accum / (float)numSamples;
    currentFilteredValue = baselineVoltage;
    Serial.print("[EMG Module] Calibrated Baseline ADC Value: ");
    Serial.println(baselineVoltage);
}

EMGData EMGSensor::readData() {
    EMGData data;
    data.rawAnalog = analogRead(analogPin);

    // Exponential Moving Average (EMA) Filter:
    // S_t = alpha * Y_t + (1 - alpha) * S_{t-1}
    currentFilteredValue = (alpha * (float)data.rawAnalog) + ((1.0f - alpha) * currentFilteredValue);

    data.filteredVal = currentFilteredValue;
    data.voltageVolts = (currentFilteredValue / (float)ADC_MAX_VALUE) * ADC_VREF_VOLTS;

    // Deviation from baseline as proxy MAV
    data.mav = abs(currentFilteredValue - baselineVoltage);

    return data;
}

float EMGSensor::getFilteredValue() const {
    return currentFilteredValue;
}
