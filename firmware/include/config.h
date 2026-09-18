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

#define MAX98357_I2S_BCLK       27   // Bit Clock (BCLK)
#define MAX98357_I2S_LRC        14   // Left/Right Word Select (LRC / WS)
#define MAX98357_I2S_DOUT       22   // Serial Data Out (DIN / DOUT)
#define MAX98357_SD_MODE_PIN    -1   // SD/SD_MODE pin (-1 if tied to 3.3V)

// ============================================================================
// HARDWARE PIN MAPPINGS (INMP441 I2S Microphone) - runs on I2S_NUM_1,
// independent of the MAX98357A playback peripheral on I2S_NUM_0.
// ============================================================================

#define INMP441_I2S_SCK         26   // Bit Clock (SCK)
#define INMP441_I2S_WS          25   // Word Select (WS / LRCL)
#define INMP441_I2S_SD          34   // Serial Data (SD / DOUT from mic)

#define MIC_SAMPLE_RATE         16000  // Match playback sample rate
#define MIC_BITS_PER_SAMPLE     16     // Effective resolution after shifting the 32-bit frame

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
#define MIC_CTRL_CHAR_UUID      "e1f2a3b4-36e1-4688-b7f5-ea07361b26e1" // Microphone Control (Start 0x01 / Stop 0x00)
#define MIC_AUDIO_CHAR_UUID     "f3d4e5a6-36e1-4688-b7f5-ea07361b26d1" // Microphone PCM Audio Notifications (16kHz 16-bit mono)


// ============================================================================
// AUDIO SPECIFICATIONS
// ============================================================================

#define AUDIO_SAMPLE_RATE       16000  // 16 kHz audio playback rate
#define AUDIO_BITS_PER_SAMPLE   16     // 16-bit PCM mono

#endif // CONFIG_H
