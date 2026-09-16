/**
 * VoiceBack Smart Neckband - INMP441 I2S Microphone Driver
 *
 * ADDITIVE ONLY. Uses I2S_NUM_1 exclusively.
 * Does NOT touch: I2S_NUM_0, GPIO26, GPIO25, GPIO22, GPIO34.
 *
 * Wiring:
 *   INMP441 SCK -> GPIO32  (Bit Clock)
 *   INMP441 WS  -> GPIO33  (Word Select)
 *   INMP441 SD  -> GPIO35  (Serial Data, input-only GPIO)
 *   INMP441 L/R -> GND     (LEFT channel output)
 */

#include "mic_driver.h"
#include "ble_service.h"

extern BLEServiceManager bleManager;

// Global mic enable flag. Shared with ble_service.cpp via extern in mic_driver.h
volatile bool s_micEnabled = false;

MicDriver::MicDriver() : initialized(false), micTaskHandle(nullptr) {}

bool MicDriver::begin() {
    // INMP441 sends 24-bit audio left-justified in a 32-bit I2S frame.
    // L/R pin tied to GND -> microphone outputs on LEFT channel only.
    i2s_config_t cfg = {
        .mode                 = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate          = INMP441_SAMPLE_RATE,        // 16000 Hz
        .bits_per_sample      = I2S_BITS_PER_SAMPLE_32BIT,  // 24-bit in 32-bit frame
        .channel_format       = I2S_CHANNEL_FMT_ONLY_LEFT,  // L/R = GND -> LEFT channel
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags     = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count        = 4,
        .dma_buf_len          = 64,
        .use_apll             = false,
        .tx_desc_auto_clear   = false,
        .fixed_mclk           = 0
    };

    i2s_pin_config_t pins = {
        .bck_io_num   = INMP441_SCK_PIN,    // GPIO32
        .ws_io_num    = INMP441_WS_PIN,     // GPIO33
        .data_out_num = I2S_PIN_NO_CHANGE,  // RX only — no TX
        .data_in_num  = INMP441_SD_PIN      // GPIO35
    };

    esp_err_t err = i2s_driver_install(INMP441_I2S_PORT, &cfg, 0, NULL);
    if (err != ESP_OK) {
        Serial.printf("[MicDriver ERROR] i2s_driver_install(I2S_NUM_1) failed: 0x%x\n", err);
        return false;
    }

    err = i2s_set_pin(INMP441_I2S_PORT, &pins);
    if (err != ESP_OK) {
        Serial.printf("[MicDriver ERROR] i2s_set_pin failed: 0x%x\n", err);
        i2s_driver_uninstall(INMP441_I2S_PORT);
        return false;
    }

    i2s_start(INMP441_I2S_PORT);
    initialized = true;

    BaseType_t res = xTaskCreatePinnedToCore(
        MicDriver::micTaskWrapper,
        "Mic_I2S_Task",
        4096,
        this,
        4,              // Priority 4: below audio playback task (5), above idle
        &micTaskHandle,
        1               // Core 1 (same as audio task, different stack)
    );

    if (res != pdPASS) {
        Serial.println("[MicDriver ERROR] Failed to create mic I2S task.");
        return false;
    }

    Serial.println("[MicDriver] INMP441 on I2S_NUM_1 ready. Mic task idle until START_MIC (0x01).");
    return true;
}

void MicDriver::stop() {
    s_micEnabled = false;
}

void MicDriver::micTaskWrapper(void* parameter) {
    MicDriver* self = static_cast<MicDriver*>(parameter);
    if (self) {
        self->micTaskLoop();
    }
    vTaskDelete(nullptr);
}

void MicDriver::micTaskLoop() {
    // Read 256 samples per cycle.
    // Each I2S frame = 32 bits -> 256 frames = 1024 bytes from i2s_read().
    // After 16-bit conversion: 256 samples * 2 bytes = 512 bytes PCM per BLE NOTIFY packet.
    const size_t READ_SAMPLES = 256;
    const size_t I2S_BUF_BYTES = READ_SAMPLES * sizeof(int32_t);

    int32_t rawBuf[READ_SAMPLES];
    uint8_t pcmBuf[READ_SAMPLES * sizeof(int16_t)];  // 512 bytes output

    while (true) {
        if (!s_micEnabled) {
            vTaskDelay(pdMS_TO_TICKS(20));
            continue;
        }

        size_t bytesRead = 0;
        esp_err_t err = i2s_read(
            INMP441_I2S_PORT,
            rawBuf,
            I2S_BUF_BYTES,
            &bytesRead,
            pdMS_TO_TICKS(200)
        );

        if (err != ESP_OK || bytesRead == 0) {
            vTaskDelay(pdMS_TO_TICKS(10));
            continue;
        }

        size_t samplesRead = bytesRead / sizeof(int32_t);

        // Convert INMP441 32-bit I2S frame -> 16-bit signed PCM.
        // INMP441 sends 24-bit audio left-justified: bits 31-8 = audio, bits 7-0 = zeros.
        // Right-shift by 16 to extract the top 16 bits of audio data as a signed int16.
        for (size_t i = 0; i < samplesRead; i++) {
            int16_t s16 = (int16_t)(rawBuf[i] >> 16);
            pcmBuf[i * 2]     = (uint8_t)(s16 & 0xFF);         // LSB (little-endian)
            pcmBuf[i * 2 + 1] = (uint8_t)((s16 >> 8) & 0xFF); // MSB
        }

        size_t pcmBytes = samplesRead * sizeof(int16_t);

        // Send to PWA via BLE NOTIFY — only if still enabled
        if (s_micEnabled) {
            bleManager.sendMicPCM(pcmBuf, pcmBytes);
        }
    }
}
