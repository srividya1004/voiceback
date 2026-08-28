/**
 * VoiceBack Smart Neckband - MAX98357A I2S Audio Driver Implementation
 */

#include "audio_driver.h"
#include "test_audio.h"
#include <math.h>
#include "audio_driver.h"

AudioDriver::AudioDriver(i2s_port_t port)
    : initialized(false), i2sPort(port), audioTaskHandle(nullptr), currentVolume(70) {}

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

void AudioDriver::setVolume(uint8_t volumePercent) {
    if (volumePercent > 100) {
        currentVolume = 100;
    } else {
        currentVolume = volumePercent;
    }
    Serial.printf("[Audio Driver] Volume set to %u%%\n", currentVolume);
}

uint8_t AudioDriver::getVolume() const {
    return currentVolume;
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

    writePCM(reinterpret_cast<const uint8_t*>(samples), numSamples * sizeof(int16_t));
    i2s_zero_dma_buffer(i2sPort);

    delete[] samples;
}

size_t AudioDriver::writePCM(const uint8_t *pcmBuffer, size_t lengthBytes) {
    if (!initialized || pcmBuffer == nullptr || lengthBytes == 0) {
        return 0;
    }

    if (currentVolume == 0) {
        // Mute: send zeroed samples
        uint8_t zeroBuf[256];
        memset(zeroBuf, 0, sizeof(zeroBuf));
        size_t totalWritten = 0;
        while (totalWritten < lengthBytes) {
            size_t toWrite = (lengthBytes - totalWritten > sizeof(zeroBuf)) ? sizeof(zeroBuf) : (lengthBytes - totalWritten);
            size_t bytesWritten = 0;
            i2s_write(i2sPort, zeroBuf, toWrite, &bytesWritten, portMAX_DELAY);
            totalWritten += bytesWritten;
            if (bytesWritten == 0) break;
        }
        return totalWritten;
    }

    if (currentVolume == 100) {
        // 100% volume: direct passthrough
        size_t bytesWritten = 0;
        i2s_write(i2sPort, pcmBuffer, lengthBytes, &bytesWritten, portMAX_DELAY);
        return bytesWritten;
    }

    // Digital volume scaling for 16-bit PCM mono samples
    float scale = (float)currentVolume / 100.0f;
    size_t numSamples = lengthBytes / sizeof(int16_t);

    const size_t CHUNK_SAMPLES = 128;
    int16_t scaledChunk[CHUNK_SAMPLES];
    const int16_t* srcSamples = reinterpret_cast<const int16_t*>(pcmBuffer);

    size_t totalBytesWritten = 0;
    size_t samplesProcessed = 0;

    while (samplesProcessed < numSamples) {
        size_t chunkSize = (numSamples - samplesProcessed > CHUNK_SAMPLES) ? CHUNK_SAMPLES : (numSamples - samplesProcessed);

        for (size_t i = 0; i < chunkSize; i++) {
            int32_t val = static_cast<int32_t>(srcSamples[samplesProcessed + i] * scale);
            if (val > 32767) val = 32767;
            if (val < -32768) val = -32768;
            scaledChunk[i] = static_cast<int16_t>(val);
        }

        size_t bytesWritten = 0;
        i2s_write(i2sPort, scaledChunk, chunkSize * sizeof(int16_t), &bytesWritten, portMAX_DELAY);
        totalBytesWritten += bytesWritten;
        samplesProcessed += chunkSize;
    }

    // Handle any trailing byte
    if (lengthBytes % 2 != 0 && samplesProcessed * 2 < lengthBytes) {
        uint8_t lastByte = pcmBuffer[lengthBytes - 1];
        size_t bw = 0;
        i2s_write(i2sPort, &lastByte, 1, &bw, portMAX_DELAY);
        totalBytesWritten += bw;
    }

    return totalBytesWritten;
}

bool AudioDriver::startContinuousPlaybackTask() {
    if (!initialized) {
        Serial.println("[Audio Driver ERROR] Cannot start audio task: driver not initialized.");
        return false;
    }

    BaseType_t res = xTaskCreatePinnedToCore(
        AudioDriver::audioTaskWrapper,
        "Audio_Play_Task",
        4096,
        this,
        1,
        &audioTaskHandle,
        1
    );

    if (res == pdPASS) {
        Serial.println("[Audio Driver] Continuous test audio task spawned on Core 1 successfully.");
        return true;
    } else {
        Serial.println("[Audio Driver ERROR] Failed to spawn continuous test audio task.");
        return false;
    }
}

void AudioDriver::audioTaskWrapper(void* parameter) {
    AudioDriver* instance = static_cast<AudioDriver*>(parameter);
    if (instance != nullptr) {
        instance->audioTaskLoop();
    }
    vTaskDelete(nullptr);
}

void AudioDriver::audioTaskLoop() {
    Serial.println("[Audio Task] Starting h.wav single-shot audio playback...");
    const size_t chunkSize = 1024;

    size_t offset = 0;
    while (offset < TEST_AUDIO_PCM_LEN) {
        size_t bytesToWrite = (TEST_AUDIO_PCM_LEN - offset > chunkSize) ? chunkSize : (TEST_AUDIO_PCM_LEN - offset);
        writePCM(&TEST_AUDIO_PCM[offset], bytesToWrite);
        offset += bytesToWrite;
        vTaskDelay(pdMS_TO_TICKS(1));
    }

    Serial.println("[Audio Task] Single-shot playback of h.wav completed successfully.");
    stop();

    // Idle thread without repeating playback
    while (true) {
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

void AudioDriver::stop() {
    if (initialized) {
        i2s_zero_dma_buffer(i2sPort);
    }
}
