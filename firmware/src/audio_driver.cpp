#include "audio_driver.h"
#include "test_audio.h"
#include <math.h>

AudioDriver::AudioDriver(i2s_port_t port)
    : initialized(false), i2sPort(port), audioTaskHandle(nullptr), currentVolume(80) {}

bool AudioDriver::begin() {
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = AUDIO_SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT, // 32 BCLK 2-channel frame for MAX98357A DAC
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 256, // 256 samples per DMA buffer for smooth continuous playback
        .use_apll = false
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = MAX98357_I2S_BCLK,   // GPIO26
        .ws_io_num = MAX98357_I2S_LRC,     // GPIO25
        .data_out_num = MAX98357_I2S_DOUT, // GPIO22
        .data_in_num = I2S_PIN_NO_CHANGE
    };

#ifdef MAX98357_SD_MODE_PIN
    if (MAX98357_SD_MODE_PIN >= 0) {
        pinMode(MAX98357_SD_MODE_PIN, OUTPUT);
        digitalWrite(MAX98357_SD_MODE_PIN, HIGH); // Pull HIGH to enable MAX98357A amplifier
        delay(10);
    }
#endif

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

    i2s_set_sample_rates(i2sPort, AUDIO_SAMPLE_RATE);
    i2s_start(i2sPort);
    i2s_zero_dma_buffer(i2sPort);
    initialized = true;
    Serial.println("[Audio Driver] MAX98357A I2S Audio Initialized & Started Successfully.");
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
        samples[i] = (int16_t)(22000.0f * sinf(angularFreq * t));
    }

    writePCM(reinterpret_cast<const uint8_t*>(samples), numSamples * sizeof(int16_t));
    i2s_zero_dma_buffer(i2sPort);

    delete[] samples;
}

size_t AudioDriver::writePCM(const uint8_t *pcmBuffer, size_t lengthBytes) {
    if (!initialized || pcmBuffer == nullptr || lengthBytes == 0) {
        return 0;
    }

    float scale = (float)currentVolume / 100.0f;
    size_t numMonoSamples = lengthBytes / sizeof(int16_t);
    const int16_t* srcSamples = reinterpret_cast<const int16_t*>(pcmBuffer);

    const size_t CHUNK_MONO_SAMPLES = 256;
    int16_t stereoChunk[CHUNK_MONO_SAMPLES * 2]; // 512 int16_t samples in RAM

    size_t totalBytesWritten = 0;
    size_t samplesProcessed = 0;

    while (samplesProcessed < numMonoSamples) {
        size_t chunkSize = (numMonoSamples - samplesProcessed > CHUNK_MONO_SAMPLES)
            ? CHUNK_MONO_SAMPLES
            : (numMonoSamples - samplesProcessed);

        for (size_t i = 0; i < chunkSize; i++) {
            int16_t rawSample = srcSamples[samplesProcessed + i];
            int32_t val = static_cast<int32_t>(rawSample * scale);
            if (val > 32767) val = 32767;
            if (val < -32768) val = -32768;

            int16_t s = static_cast<int16_t>(val);
            stereoChunk[i * 2]     = s; // Left Channel
            stereoChunk[i * 2 + 1] = s; // Right Channel
        }

        size_t bytesToWrite = chunkSize * 2 * sizeof(int16_t);
        size_t bytesWritten = 0;
        i2s_write(i2sPort, stereoChunk, bytesToWrite, &bytesWritten, portMAX_DELAY);
        totalBytesWritten += (bytesWritten / 2);
        samplesProcessed += chunkSize;
    }

    return totalBytesWritten;
}

void AudioDriver::playConnectedSound() {
    if (!initialized) return;
    Serial.println("[Audio Driver] Playing 'CONNECTED' sound chime via physical speaker...");
    // Professional 3-tone rising chime: C5 (523 Hz) -> E5 (659 Hz) -> G5 (784 Hz)
    playTestTone(523, 90);
    playTestTone(659, 90);
    playTestTone(784, 160);
}

void AudioDriver::playDisconnectedSound() {
    if (!initialized) return;
    Serial.println("[Audio Driver] Playing 'DISCONNECTED' sound chime via physical speaker...");
    // 2-tone falling chime: G5 (784 Hz) -> C5 (523 Hz)
    playTestTone(784, 100);
    playTestTone(523, 150);
}

void AudioDriver::playVoice() {
    startContinuousPlaybackTask();
}

bool AudioDriver::isPlaying() const {
    return (audioTaskHandle != nullptr);
}

bool AudioDriver::startContinuousPlaybackTask() {
    if (!initialized) {
        Serial.println("[Audio Driver ERROR] Cannot start audio task: driver not initialized.");
        return false;
    }

    if (audioTaskHandle != nullptr) {
        Serial.println("[Audio Driver] Voice audio playback is already in progress.");
        return true;
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
        Serial.println("[Audio Driver] Voice audio playback task spawned on Core 1 successfully.");
        return true;
    } else {
        Serial.println("[Audio Driver ERROR] Failed to spawn voice audio playback task.");
        return false;
    }
}

void AudioDriver::audioTaskWrapper(void* parameter) {
    AudioDriver* instance = static_cast<AudioDriver*>(parameter);
    if (instance != nullptr) {
        instance->audioTaskLoop();
        instance->audioTaskHandle = nullptr;
    }
    vTaskDelete(nullptr);
}

void AudioDriver::audioTaskLoop() {
    Serial.println("[Audio Task] Starting voice audio playback via physical speaker (MAX98357A)...");
    const size_t chunkSize = 1024;

    size_t offset = 0;
    while (offset < TEST_AUDIO_PCM_LEN) {
        size_t bytesToWrite = (TEST_AUDIO_PCM_LEN - offset > chunkSize) ? chunkSize : (TEST_AUDIO_PCM_LEN - offset);
        writePCM(&TEST_AUDIO_PCM[offset], bytesToWrite);
        offset += bytesToWrite;
        // i2s_write blocks smoothly until DMA space is ready. No vTaskDelay here to eliminate audio glitching!
    }

    Serial.println("[Audio Task] Voice audio playback completed via physical speaker.");
    stop();
}

void AudioDriver::stop() {
    if (initialized) {
        i2s_zero_dma_buffer(i2sPort);
    }
}
