/**
 * VoiceBack Smart Neckband - INMP441 I2S Microphone Driver Header
 *
 * ADDITIVE ONLY. Does NOT modify speaker output.
 * Speaker: I2S_NUM_0, GPIO26/GPIO25/GPIO22, MAX98357A — UNTOUCHED.
 * Microphone: I2S_NUM_1, GPIO32/GPIO33/GPIO35, INMP441.
 * GPIO34: NOT referenced here.
 */
#ifndef MIC_DRIVER_H
#define MIC_DRIVER_H

#include "config.h"
#include <driver/i2s.h>

class MicDriver {
private:
    bool initialized;
    TaskHandle_t micTaskHandle;

    static void micTaskWrapper(void* parameter);
    void micTaskLoop();

public:
    MicDriver();
    bool begin();
    void stop();
    bool isInitialized() const { return initialized; }
};

// Mic streaming flag: set true by MicControlCallbacks(0x01), false by (0x00) or BLE disconnect
extern volatile bool s_micEnabled;

#endif // MIC_DRIVER_H
