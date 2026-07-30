/**
 * VoiceBack Smart Neckband - Hardware Configuration & Constants
 * 
 * Defines pin mappings, BLE GATT UUIDs, sampling rates, and filter coefficients.
 */

#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ============================================================================
// HARDWARE PIN MAPPINGS
// ============================================================================

// AD620 Analog EMG Sensor Input
#define AD620_ANALOG_PIN        34   // GPIO34 (ADC1_CH6 - Input only)

// MAX98357A I2S Audio Amplifier Pins
#define MAX98357_I2S_BCLK       4    // Bit Clock (BCLK)
#define MAX98357_I2S_LRC        5    // Left/Right Word Select (LRC / WS)
#define MAX98357_I2S_DOUT       6    // Serial Data Out (DIN / DOUT)

// Optional Diagnostics / Debug Serial Speed
#define SERIAL_BAUD_RATE        115200

// ============================================================================
// DSP & SIGNAL PROCESSING CONSTANTS
// ============================================================================

// ADC Resolution (12-bit = 0 to 4095)
#define ADC_RESOLUTION_BITS     12
#define ADC_MAX_VALUE           4095
#define ADC_VREF_VOLTS          3.3f

// Sampling Rate (50 Hz loop interval = 20ms)
#define SAMPLE_INTERVAL_MS      20

// Exponential Moving Average (EMA) Filter Weight Alpha (0.0 < ALPHA <= 1.0)
// Lower values = smoother filter; Higher values = faster response to raw signals
#define EMA_ALPHA               0.15f

// Baseline EMG Threshold Calibration Default
#define DEFAULT_EMG_BASELINE    1800.0f

// ============================================================================
// BLE GATT SERVICE & CHARACTERISTIC UUIDS
// ============================================================================

#define BLE_DEVICE_NAME         "VoiceBack-Neckband"
#define SERVICE_UUID            "4fa8c001-1278-472e-b997-63992e716a4d"
#define EMG_CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define AUDIO_CMD_CHAR_UUID     "cba1483e-36e1-4688-b7f5-ea07361b26b9"

// ============================================================================
// AUDIO SPECIFICATIONS
// ============================================================================

#define AUDIO_SAMPLE_RATE       16000  // 16 kHz audio playback rate
#define AUDIO_BITS_PER_SAMPLE   16     // 16-bit PCM mono

#endif // CONFIG_H
