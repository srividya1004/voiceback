#include "mic_driver.h"
#include <math.h>
#include "ble_service.h"

extern BLEServiceManager bleManager;

static volatile bool s_micTaskRunning = false;

MicDriver::MicDriver(i2s_port_t port)
    : initialized(false), i2sPort(port), micTaskHandle(nullptr), streamingActive(false) {}

bool MicDriver::begin() {
    i2s_config_t i2s_config = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = MIC_SAMPLE_RATE,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT, // INMP441 outputs 24-bit audio in a 32-bit frame
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,  // Mono capture (tie mic L/R pin to GND)
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 256,
        .use_apll = false,
        .tx_desc_auto_clear = false,
        .fixed_mclk = 0
    };

    i2s_pin_config_t pin_config = {
        .bck_io_num = INMP441_I2S_SCK,      // GPIO26 (Bit Clock)
        .ws_io_num = INMP441_I2S_WS,        // GPIO25 (Word Select)
        .data_out_num = I2S_PIN_NO_CHANGE,  // RX only, no data out
        .data_in_num = INMP441_I2S_SD       // GPIO34 (Serial Data in)
    };

    esp_err_t err = i2s_driver_install(i2sPort, &i2s_config, 0, NULL);
    if (err != ESP_OK) {
        Serial.printf("[Mic Driver Error] Failed to install I2S driver: 0x%x\n", err);
        return false;
    }

    err = i2s_set_pin(i2sPort, &pin_config);
    if (err != ESP_OK) {
        Serial.printf("[Mic Driver Error] Failed to set I2S pins: 0x%x\n", err);
        return false;
    }

    i2s_set_sample_rates(i2sPort, MIC_SAMPLE_RATE);
    i2s_start(i2sPort);
    initialized = true;

    Serial.println("[Mic Driver] INMP441 I2S Microphone Initialized & Started Successfully.");
    return true;
}

bool MicDriver::startCaptureTask() {
    if (!initialized) {
        Serial.println("[Mic Driver ERROR] Cannot start capture task: driver not initialized.");
        return false;
    }
    if (micTaskHandle != nullptr) {
        return true;
    }

    s_micTaskRunning = true;
    BaseType_t res = xTaskCreatePinnedToCore(
        MicDriver::micTaskWrapper,
        "Mic_Capture_Task",
        4096,
        this,
        4, // Priority 4, alongside playback task (5)
        &micTaskHandle,
        1  // Core 1
    );

    if (res == pdPASS) {
        Serial.println("[Mic Driver] Microphone capture task spawned on Core 1 successfully.");
        return true;
    } else {
        Serial.println("[Mic Driver ERROR] Failed to spawn microphone capture task.");
        return false;
    }
}

void MicDriver::micTaskWrapper(void* parameter) {
    MicDriver* instance = static_cast<MicDriver*>(parameter);
    if (instance != nullptr) {
        instance->micTaskLoop();
        instance->micTaskHandle = nullptr;
    }
    vTaskDelete(nullptr);
}

void MicDriver::micTaskLoop() {
    Serial.println("[Mic Task] Microphone capture task started on Core 1.");

    const size_t SAMPLES_PER_READ = 256;
    int32_t rawSamples[SAMPLES_PER_READ]; // Raw 32-bit I2S frames from the INMP441
    int16_t pcm16[SAMPLES_PER_READ];

    uint32_t lastLog = 0;

    while (s_micTaskRunning) {
        size_t bytesRead = 0;
        esp_err_t err = i2s_read(i2sPort, (void*)rawSamples, sizeof(rawSamples), &bytesRead, portMAX_DELAY);
        if (err != ESP_OK || bytesRead == 0) {
            vTaskDelay(pdMS_TO_TICKS(10));
            continue;
        }

        size_t samplesRead = bytesRead / sizeof(int32_t);

        int64_t sumSquares = 0;
        for (size_t i = 0; i < samplesRead; i++) {
            // INMP441 outputs 24-bit audio in a 32-bit frame.
            // Right shift by 14 gives 16-bit audio with appropriate gain for soft/aphasic speech.
            int32_t s = rawSamples[i] >> 14;
            if (s > 32767) s = 32767;
            else if (s < -32768) s = -32768;
            pcm16[i] = (int16_t)s;
            sumSquares += (int64_t)pcm16[i] * (int64_t)pcm16[i];
        }
        float rms = sqrtf((float)sumSquares / (float)samplesRead);

        // Stream real 16-bit PCM audio chunks over BLE notifications to PWA
        if (streamingActive && bleManager.isConnected()) {
            const size_t CHUNK_SIZE = 128; // 128 samples = 256 bytes per packet (fits comfortably in MTU 517)
            for (size_t offset = 0; offset < samplesRead; offset += CHUNK_SIZE) {
                size_t toSend = (samplesRead - offset > CHUNK_SIZE) ? CHUNK_SIZE : (samplesRead - offset);
                bleManager.sendMicAudioChunk((const uint8_t*)&pcm16[offset], toSend * sizeof(int16_t));
            }
        }

        uint32_t now = millis();
        if (now - lastLog >= 1000) {
            Serial.printf("[Mic Task] RMS level: %.1f%s\n", rms, streamingActive ? " (STREAMING)" : "");
            lastLog = now;
        }
    }
}

void MicDriver::stop() {
    s_micTaskRunning = false;
    streamingActive = false;
    if (initialized) {
        i2s_stop(i2sPort);
    }
}

bool MicDriver::isRunning() const {
    return s_micTaskRunning;
}

void MicDriver::setStreaming(bool enable) {
    streamingActive = enable;
    Serial.printf("[Mic Driver] Microphone streaming %s.\n", enable ? "ENABLED" : "DISABLED");
}

bool MicDriver::isStreaming() const {
    return streamingActive;
}
