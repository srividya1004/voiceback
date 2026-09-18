/**
 * VoiceBack Smart Neckband - INMP441 I2S Microphone Driver Header
 *
 * Configures a second, independent ESP32 I2S peripheral (I2S_NUM_1) for
 * digital audio capture from an INMP441 MEMS microphone. Runs alongside
 * the existing MAX98357A playback driver (I2S_NUM_0) without conflict,
 * since each I2S peripheral has its own BCLK/WS/data lines.
 */

#ifndef MIC_DRIVER_H
#define MIC_DRIVER_H

#include "config.h"
#include <driver/i2s.h>

class MicDriver {
private:
    bool initialized;
    i2s_port_t i2sPort;
    TaskHandle_t micTaskHandle;
    volatile bool streamingActive;

    static void micTaskWrapper(void* parameter);
    void micTaskLoop();

public:
    MicDriver(i2s_port_t port = I2S_NUM_1);

    bool begin();
    bool startCaptureTask();
    void stop();
    bool isRunning() const;
    void setStreaming(bool enable);
    bool isStreaming() const;
};

#endif // MIC_DRIVER_H
