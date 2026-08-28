/**
 * VoiceBack Smart Neckband - BioAmp EXG Pill EMG Sensor Interface
 * 
 * Provides ADC acquisition, Exponential Moving Average (EMA) filtering,
 * baseline calibration, and feature calculation (MAV, RMS).
 */

#ifndef EMG_SENSOR_H
#define EMG_SENSOR_H

#include "config.h"

struct EMGData {
    int rawAnalog;        // Raw 12-bit ADC value (0-4095)
    float filteredVal;    // Processed envelope / AC signal value
    float voltageVolts;   // Converted analog voltage via ESP32 eFuse calibration (0.0V - 3.3V)
    float mav;            // Mean Absolute Value over recent window
    float baselineADC;    // Measured resting ADC baseline
    bool isSaturated;     // True if ADC is near 4095 saturation threshold
};

class EMGSensor {
private:
    uint8_t analogPin;
    float currentFilteredValue;
    float baselineADC;
    float alpha;
    bool saturatedState;
    
public:
    EMGSensor(uint8_t pin = BIOAMP_ANALOG_PIN, float filterAlpha = EMA_ALPHA);

    void begin();
    EMGData readData();
    void calibrateBaseline(uint16_t numSamples = 500);
    float getFilteredValue() const;
    float getBaseline() const;
    bool isSaturated() const;
};

#endif // EMG_SENSOR_H
