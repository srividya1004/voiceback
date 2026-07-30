/**
 * VoiceBack Smart Neckband - AD620 EMG Sensor Interface
 * 
 * Provides ADC acquisition, Exponential Moving Average (EMA) filtering,
 * baseline calibration, and feature calculation (MAV, RMS).
 */

#ifndef EMG_SENSOR_H
#define EMG_SENSOR_H

#include "config.h"

struct EMGData {
    int rawAnalog;        // Raw 12-bit ADC value (0-4095)
    float filteredVal;    // EMA filtered value
    float voltageVolts;   // Converted analog voltage (0.0V - 3.3V)
    float mav;            // Mean Absolute Value over recent window
};

class EMGSensor {
private:
    uint8_t analogPin;
    float currentFilteredValue;
    float baselineVoltage;
    float alpha;
    
public:
    EMGSensor(uint8_t pin = AD620_ANALOG_PIN, float filterAlpha = EMA_ALPHA);

    void begin();
    EMGData readData();
    void calibrateBaseline(uint16_t numSamples = 100);
    float getFilteredValue() const;
};

#endif // EMG_SENSOR_H
