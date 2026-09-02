/**
 * VoiceBack Smart Neckband - MAX98357A I2S Audio Driver Header
 * 
 * Configures ESP32 I2S peripheral for digital audio playback to MAX98357A amplifier.
 */

#ifndef AUDIO_DRIVER_H
#define AUDIO_DRIVER_H

#include "config.h"
#include <driver/i2s.h>

class AudioDriver {
private:
    bool initialized;
    i2s_port_t i2sPort;
    TaskHandle_t audioTaskHandle;
    uint8_t currentVolume;

    static void audioTaskWrapper(void* parameter);
    void audioTaskLoop();

public:
    AudioDriver(i2s_port_t port = I2S_NUM_0);

    bool begin();
    void playTestTone(uint16_t frequencyHz = 440, uint16_t durationMs = 300);
    void playVoice();
    void playConnectedSound();
    void playDisconnectedSound();
    size_t writePCM(const uint8_t *pcmBuffer, size_t lengthBytes);
    void setVolume(uint8_t volumePercent);
    uint8_t getVolume() const;
    bool startContinuousPlaybackTask();
    void stop();
    bool isPlaying() const;
};

#endif // AUDIO_DRIVER_H
