/**
 * VoiceBack Smart Neckband - Hardware Configuration & Constants
 * 
 * Target Hardware: ESP32 + MAX98357A I2S Amplifier
 * Current Production Architecture:
 * Microphone/application -> BLE -> ESP32 -> I2S -> MAX98357A -> physical speaker
 *
 * Legacy BioAmp/EMG hardware has been removed and is not part of this architecture.
 */

#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// ============================================================================
// HARDWARE PIN MAPPINGS (MAX98357A I2S Audio Amplifier)
// ============================================================================

#define MAX98357_I2S_BCLK       26   // Bit Clock (BCLK)
#define MAX98357_I2S_LRC        25   // Left/Right Word Select (LRC / WS)
#define MAX98357_I2S_DOUT       22   // Serial Data Out (DIN / DOUT)
#define MAX98357_SD_MODE_PIN    -1   // SD/SD_MODE pin (-1 if tied to 3.3V)

// Diagnostics / Debug Serial Speed
#define SERIAL_BAUD_RATE        115200

// ============================================================================
// BLE GATT SERVICE & CHARACTERISTIC UUIDS
// ============================================================================

#define BLE_DEVICE_NAME         "VoiceBack-Neckband"
#define SERVICE_UUID            "4fa8c001-1278-472e-b997-63992e716a4d"
#define AUDIO_CMD_CHAR_UUID     "cba1483e-36e1-4688-b7f5-ea07361b26b9"
#define VOLUME_CHAR_UUID        "7b9e483e-36e1-4688-b7f5-ea07361b26c0"
#define EMG_CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8" // Inert compatibility UUID for PWA discovery

// ============================================================================
// AUDIO SPECIFICATIONS
// ============================================================================

#define AUDIO_SAMPLE_RATE       16000  // 16 kHz audio playback rate
#define AUDIO_BITS_PER_SAMPLE   16     // 16-bit PCM mono

#endif // CONFIG_H
