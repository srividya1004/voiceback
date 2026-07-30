/**
 * VoiceBack Smart Neckband - MAX98357A I2S Audio Driver Implementation
 */

#include "audio_driver.h"
#include <math.h>

AudioDriver::AudioDriver(i2s_port_t port)
    : initialized(false), i2sPort(port) {}

bool AudioDriver::begin() {
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = AUDIO_SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT, // MAX98357A left channel mono
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 64,
        .use_apll = false
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = MAX98357_I2S_BCLK,
        .ws_io_num = MAX98357_I2S_LRC,
        .data_out_num = MAX98357_I2S_DOUT,
        .data_in_num = I2S_PIN_NO_CHANGE
    };

    esp_err_t err = i2s_driver_install(i2sPort, &i2s_config, 0, NULL);
    if (err != ESP_OK) {
        Serial.printf("[Audio Driver Error] Failed to install I2S driver: 0x%x\n", err);
        return false;
    }

    err = i2s_set_pin(i2sPort, &pin_config);
    if (err != ESP_OK) {
        Serial.printf("[Audio Driver Error] Failed to set I2S pins: 0x%x\n", err);
        return false;
    }

    i2s_zero_dma_buffer(i2sPort);
    initialized = true;
    Serial.println("[Audio Driver] MAX98357A I2S Audio Initialized Successfully.");
    return true;
}

void AudioDriver::playTestTone(uint16_t frequencyHz, uint16_t durationMs) {
    if (!initialized) return;

    size_t numSamples = (AUDIO_SAMPLE_RATE * durationMs) / 1000;
    int16_t *samples = new int16_t[numSamples];

    float samplePeriod = 1.0f / (float)AUDIO_SAMPLE_RATE;
    float angularFreq = 2.0f * M_PI * (float)frequencyHz;

    for (size_t i = 0; i < numSamples; i++) {
        float t = (float)i * samplePeriod;
        // Generate sine wave at ~50% amplitude to avoid clipping
        samples[i] = (int16_t)(16000.0f * sinf(angularFreq * t));
    }

    size_t bytesWritten = 0;
    i2s_write(i2sPort, samples, numSamples * sizeof(int16_t), &bytesWritten, portMAX_DELAY);
    i2s_zero_dma_buffer(i2sPort);

    delete[] samples;
}

size_t AudioDriver::writePCM(const uint8_t *pcmBuffer, size_t lengthBytes) {
    if (!initialized || pcmBuffer == nullptr || lengthBytes == 0) {
        return 0;
    }

    size_t bytesWritten = 0;
    i2s_write(i2sPort, pcmBuffer, lengthBytes, &bytesWritten, portMAX_DELAY);
    return bytesWritten;
}

void AudioDriver::stop() {
    if (initialized) {
        i2s_zero_dma_buffer(i2sPort);
    }
}
