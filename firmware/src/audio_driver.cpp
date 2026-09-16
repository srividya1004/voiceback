#include "audio_driver.h"
#include <math.h>

// ============================================================================
// Internal High-Performance Audio Ring Buffer (64 KB = ~2.05 sec of 16kHz mono)
// ============================================================================
struct CircularAudioBuffer {
    static const size_t CAPACITY = 65536;
    uint8_t buffer[CAPACITY];
    size_t head = 0;
    size_t tail = 0;
    size_t count = 0;
    portMUX_TYPE spinlock = portMUX_INITIALIZER_UNLOCKED;

    size_t write(const uint8_t* data, size_t len) {
        if (!data || len == 0) return 0;
        portENTER_CRITICAL(&spinlock);
        size_t written = 0;
        for (size_t i = 0; i < len; i++) {
            if (count >= CAPACITY) {
                // Buffer full: drop oldest sample (2 bytes) to strictly preserve 16-bit alignment
                tail = (tail + 2) % CAPACITY;
                count -= 2;
            }
            buffer[head] = data[i];
            head = (head + 1) % CAPACITY;
            count++;
            written++;
        }
        portEXIT_CRITICAL(&spinlock);
        return written;
    }

    size_t read(uint8_t* dest, size_t maxLen) {
        if (!dest || maxLen == 0) return 0;
        portENTER_CRITICAL(&spinlock);
        // Strictly read an even number of bytes to preserve 16-bit sample integrity
        size_t toRead = (count < maxLen) ? count : maxLen;
        toRead &= ~1;
        for (size_t i = 0; i < toRead; i++) {
            dest[i] = buffer[tail];
            tail = (tail + 1) % CAPACITY;
        }
        count -= toRead;
        portEXIT_CRITICAL(&spinlock);
        return toRead;
    }

    size_t available() {
        portENTER_CRITICAL(&spinlock);
        size_t c = count;
        portEXIT_CRITICAL(&spinlock);
        return c;
    }

    void clear() {
        portENTER_CRITICAL(&spinlock);
        head = 0;
        tail = 0;
        count = 0;
        portEXIT_CRITICAL(&spinlock);
    }
};

static CircularAudioBuffer s_audioBuffer;
static volatile bool s_chimePlaying = false;
static volatile bool s_voicePlaying = false;
static volatile bool s_taskRunning = false;
static volatile uint32_t s_lastWriteTime = 0;
static volatile bool s_ingressActive = false;

AudioDriver::AudioDriver(i2s_port_t port)
    : initialized(false), i2sPort(port), audioTaskHandle(nullptr), currentVolume(70) {}

bool AudioDriver::begin() {
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = AUDIO_SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT, // 32 BCLK 2-channel frame for MAX98357A DAC
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 16,
        .dma_buf_len = 128, // 128 stereo samples per buffer = 512 bytes
        .use_apll = false,
        .tx_desc_auto_clear = true, // Auto clear DMA descriptors on underflow to output silence
        .fixed_mclk = 0
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
        digitalWrite(MAX98357_SD_MODE_PIN, HIGH);
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

    // Start background PCM audio playback task on Core 1
    startContinuousPlaybackTask();

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
    if (!samples) return;

    float samplePeriod = 1.0f / (float)AUDIO_SAMPLE_RATE;
    float angularFreq = 2.0f * M_PI * (float)frequencyHz;

    for (size_t i = 0; i < numSamples; i++) {
        float t = (float)i * samplePeriod;
        samples[i] = (int16_t)(20000.0f * sinf(angularFreq * t));
    }

    // Direct synchronous write to I2S for tones
    float scale = (float)currentVolume / 100.0f;
    const size_t CHUNK = 256;
    int16_t stereoChunk[CHUNK * 2];

    size_t processed = 0;
    while (processed < numSamples) {
        size_t c = (numSamples - processed > CHUNK) ? CHUNK : (numSamples - processed);
        for (size_t i = 0; i < c; i++) {
            int16_t s = (int16_t)(samples[processed + i] * scale);
            stereoChunk[i * 2]     = s;
            stereoChunk[i * 2 + 1] = s;
        }
        size_t bytesToWrite = c * 2 * sizeof(int16_t);
        size_t bytesWritten = 0;
        i2s_write(i2sPort, stereoChunk, bytesToWrite, &bytesWritten, portMAX_DELAY);
        processed += c;
    }

    delete[] samples;
}

size_t AudioDriver::writePCM(const uint8_t *pcmBuffer, size_t lengthBytes) {
    if (!initialized || pcmBuffer == nullptr || lengthBytes == 0) {
        return 0;
    }

    // Push raw 16-bit mono PCM bytes into circular buffer.
    s_lastWriteTime = millis();
    s_ingressActive = true;
    return s_audioBuffer.write(pcmBuffer, lengthBytes);
}

void AudioDriver::playConnectedSound() {
    // Intentionally disabled to satisfy NO UNWANTED SPEAKER SOUND requirement
    return;
}

void AudioDriver::playDisconnectedSound() {
    // Intentionally disabled to satisfy NO UNWANTED SPEAKER SOUND requirement
    return;
}

void AudioDriver::playVoice() {
    // Retained for interface compatibility
    startContinuousPlaybackTask();
}

bool AudioDriver::isPlaying() const {
    return s_voicePlaying || s_chimePlaying;
}

bool AudioDriver::startContinuousPlaybackTask() {
    if (!initialized) {
        Serial.println("[Audio Driver ERROR] Cannot start audio task: driver not initialized.");
        return false;
    }

    if (audioTaskHandle != nullptr) {
        return true;
    }

    s_taskRunning = true;
    BaseType_t res = xTaskCreatePinnedToCore(
        AudioDriver::audioTaskWrapper,
        "Audio_Play_Task",
        4096,
        this,
        5, // Priority 5
        &audioTaskHandle,
        1  // Core 1 (separate from NimBLE host task on Core 0)
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
    Serial.println("[Audio Task] Voice audio playback task started on Core 1.");

    const size_t CHUNK_MONO_SAMPLES = 256;
    const size_t CHUNK_BYTES = CHUNK_MONO_SAMPLES * sizeof(int16_t); // 512 bytes mono
    uint8_t monoBytes[CHUNK_BYTES];
    int16_t stereoChunk[CHUNK_MONO_SAMPLES * 2]; // 512 int16_t samples = 1024 bytes stereo

    // Ultra-low-latency streaming jitter buffer:
    // Start I2S playback as soon as PREBUFFER_START_BYTES are received (~32ms of audio),
    // then stream concurrently while BLE packets continue to arrive.
    // Utterance END is detected when the buffer drains AND no new packet arrives for INGRESS_PAUSE_MS.
    const size_t PREBUFFER_START_BYTES = 1024; // ~32ms pre-buffer before playback starts
    const uint32_t INGRESS_PAUSE_MS = 200;     // Quiet period to detect end-of-utterance

    bool streamActive = false;
    uint32_t totalStreamBytes = 0;

    while (s_taskRunning) {
        // CRITICAL AUDIO EXCLUSIVITY:
        // Connection chime has exclusive ownership of I2S while active.
        if (s_chimePlaying) {
            vTaskDelay(pdMS_TO_TICKS(10));
            continue;
        }

        size_t avail = s_audioBuffer.available();

        if (!streamActive) {
            // Start playback as soon as the jitter pre-buffer is filled (or buffer near capacity as safety)
            bool readyToPlay = s_ingressActive && (avail >= PREBUFFER_START_BYTES);
            bool bufferNearCapacity = (avail >= (CircularAudioBuffer::CAPACITY - 4096));

            if (readyToPlay || bufferNearCapacity) {
                streamActive = true;
                s_voicePlaying = true;
                totalStreamBytes = 0;
                Serial.printf("[Audio Task] Jitter buffer ready (%u bytes). Streaming to I2S now...\n",
                              (unsigned int)avail);
            } else {
                vTaskDelay(pdMS_TO_TICKS(2)); // Tight poll — waiting for first packets
                continue;
            }
        }

        // Active voice playback: continuously stream from ring buffer to I2S
        if (avail >= 2) {
            size_t toRead = (avail > CHUNK_BYTES) ? CHUNK_BYTES : (avail & ~1);
            size_t bytesRead = s_audioBuffer.read(monoBytes, toRead);
            size_t numSamples = bytesRead / sizeof(int16_t);

            if (numSamples > 0) {
                int32_t vol = (int32_t)currentVolume; // 0 to 100

                for (size_t i = 0; i < numSamples; i++) {
                    // Safe, unaligned, little-endian signed 16-bit PCM unpacking
                    size_t offset = i * 2;
                    int16_t rawSample = (int16_t)((uint16_t)monoBytes[offset] | ((uint16_t)monoBytes[offset + 1] << 8));

                    // Fast integer volume scaling preserving exact waveform shape and harmonics
                    int32_t val = ((int32_t)rawSample * vol) / 100;
                    if (val > 32767) val = 32767;
                    if (val < -32768) val = -32768;

                    int16_t s = (int16_t)val;
                    stereoChunk[i * 2]     = s; // Left Channel
                    stereoChunk[i * 2 + 1] = s; // Right Channel
                }

                size_t bytesToWrite = numSamples * 2 * sizeof(int16_t);
                size_t bytesWritten = 0;
                i2s_write(i2sPort, stereoChunk, bytesToWrite, &bytesWritten, portMAX_DELAY);
                totalStreamBytes += bytesRead;
            }
        } else {
            // Buffer temporarily empty during streaming.
            // Check if we're mid-stream (packets still arriving) or truly done.
            uint32_t now = millis();
            uint32_t msSinceLastWrite = now - s_lastWriteTime;

            if (s_ingressActive || msSinceLastWrite < INGRESS_PAUSE_MS) {
                // Packets may still be in transit — output a brief silence and keep stream alive
                // This prevents audible pops/cuts during momentary BLE gaps mid-phrase
                vTaskDelay(pdMS_TO_TICKS(4));
                continue;
            }

            // No packet for INGRESS_PAUSE_MS — utterance is truly complete.
            // Drain DMA hardware buffer before silencing.
            vTaskDelay(pdMS_TO_TICKS(120));

            streamActive = false;
            s_voicePlaying = false;
            s_ingressActive = false;
            i2s_zero_dma_buffer(i2sPort);

            // Safe index reset: only zero head/tail if buffer remains empty
            portENTER_CRITICAL(&s_audioBuffer.spinlock);
            if (s_audioBuffer.count == 0) {
                s_audioBuffer.head = 0;
                s_audioBuffer.tail = 0;
            }
            portEXIT_CRITICAL(&s_audioBuffer.spinlock);

            Serial.printf("[Audio Task] Utterance complete (%u PCM bytes streamed). Speaker silent.\n",
                          (unsigned int)totalStreamBytes);
        }
    }
}

void AudioDriver::stop() {
    s_audioBuffer.clear();
    s_voicePlaying = false;
    s_ingressActive = false;
    if (initialized) {
        i2s_zero_dma_buffer(i2sPort);
    }
}
