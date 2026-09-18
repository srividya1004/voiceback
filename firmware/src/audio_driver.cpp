#include "audio_driver.h"
#include <math.h>
#include <freertos/semphr.h>

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
static SemaphoreHandle_t s_i2sWriteMutex = nullptr;

AudioDriver::AudioDriver(i2s_port_t port)
: initialized(false), i2sPort(port), audioTaskHandle(nullptr), currentVolume(100) {}

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
.bck_io_num = MAX98357_I2S_BCLK,   // GPIO27 (BCLK)
.ws_io_num = MAX98357_I2S_LRC,     // GPIO14 (LRC / WS)
.data_out_num = MAX98357_I2S_DOUT, // GPIO22 (DIN / DOUT)
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

if (s_i2sWriteMutex == nullptr) {
s_i2sWriteMutex = xSemaphoreCreateMutex();
}

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
if (s_i2sWriteMutex != nullptr) xSemaphoreTake(s_i2sWriteMutex, portMAX_DELAY);
i2s_write(i2sPort, stereoChunk, bytesToWrite, &bytesWritten, portMAX_DELAY);
if (s_i2sWriteMutex != nullptr) xSemaphoreGive(s_i2sWriteMutex);
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
if (!initialized) return;
s_chimePlaying = true;
Serial.println("[Audio Driver] Playing 'CONNECTED' sound chime via physical speaker...");

// Professional 3-tone rising chime: C5 (523 Hz) -> E5 (659 Hz) -> G5 (784 Hz)
playTestTone(523, 90);
playTestTone(659, 90);
playTestTone(784, 160);

// Ensure chime playback physically finishes clocking out of DMA/DAC
vTaskDelay(pdMS_TO_TICKS(180));
if (s_i2sWriteMutex != nullptr) xSemaphoreTake(s_i2sWriteMutex, portMAX_DELAY);
i2s_zero_dma_buffer(i2sPort);
if (s_i2sWriteMutex != nullptr) xSemaphoreGive(s_i2sWriteMutex);

s_chimePlaying = false;
Serial.println("[Audio Driver] Connection chime finished. I2S available for voice playback.");
}

void AudioDriver::playDisconnectedSound() {
if (!initialized) return;
s_chimePlaying = true;
Serial.println("[Audio Driver] Playing 'DISCONNECTED' sound chime via physical speaker...");

// 2-tone falling chime: G5 (784 Hz) -> C5 (523 Hz)
playTestTone(784, 100);
playTestTone(523, 150);

// Drain and clear
vTaskDelay(pdMS_TO_TICKS(170));
if (s_i2sWriteMutex != nullptr) xSemaphoreTake(s_i2sWriteMutex, portMAX_DELAY);
i2s_zero_dma_buffer(i2sPort);
if (s_i2sWriteMutex != nullptr) xSemaphoreGive(s_i2sWriteMutex);

s_chimePlaying = false;
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

// Ingress pause threshold: if no new BLE packet for 800ms, the phrase transfer has completed!
const uint32_t INGRESS_PAUSE_MS = 800;

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
uint32_t now = millis();

if (!streamActive) {
// Determine if we should begin I2S playback:
// Condition 1: Buffer has sufficient head start (16KB = ~0.5s) to prevent buffer overflows on fast BLE links.
// Condition 2: Ingress was active, we have audio in buffer, and the BLE sender paused for > 800ms
//              (meaning the PWA has finished sending the complete speech phrase into RAM!)
bool bufferNearCapacity = (avail >= 16384);
bool ingressFinished = (s_ingressActive && avail >= 180 && (now - s_lastWriteTime >= INGRESS_PAUSE_MS));

if (bufferNearCapacity || ingressFinished) {
streamActive = true;
s_voicePlaying = true;
s_ingressActive = false;
totalStreamBytes = 0;
Serial.printf("[Audio Task] Utterance ready (%u bytes buffered, reason: %s). Starting continuous I2S voice playback...\n",
(unsigned int)avail, bufferNearCapacity ? "buffer threshold met" : "transmission complete");
} else {
vTaskDelay(pdMS_TO_TICKS(5));
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

// Clean 2.5x digital speech gain boost: TTS PCM sits around -12dBFS.
// This boost makes voice loud, crisp, and punchy on small neckband speakers.
int32_t boosted = ((int32_t)rawSample * 5) / 2; // 2.5x gain
int32_t val = (boosted * vol) / 100;
if (val > 32767) val = 32767;
if (val < -32768) val = -32768;

int16_t s = (int16_t)val;
stereoChunk[i * 2]     = s; // Left Channel
stereoChunk[i * 2 + 1] = s; // Right Channel
}

size_t bytesToWrite = numSamples * 2 * sizeof(int16_t);
size_t bytesWritten = 0;
if (s_i2sWriteMutex != nullptr) xSemaphoreTake(s_i2sWriteMutex, portMAX_DELAY);
i2s_write(i2sPort, stereoChunk, bytesToWrite, &bytesWritten, portMAX_DELAY);
if (s_i2sWriteMutex != nullptr) xSemaphoreGive(s_i2sWriteMutex);
totalStreamBytes += bytesRead;
}
} else {
// Ring buffer has been temporarily or permanently consumed!
bool isPhraseFinished = (now - s_lastWriteTime >= INGRESS_PAUSE_MS);

if (isPhraseFinished) {
// Utterance complete: output clean silence and reset state cleanly
// Wait 140ms for the hardware DMA buffer (128ms) to finish physically clocking out through MAX98357A
vTaskDelay(pdMS_TO_TICKS(140));

streamActive = false;
s_voicePlaying = false;
if (s_i2sWriteMutex != nullptr) xSemaphoreTake(s_i2sWriteMutex, portMAX_DELAY);
i2s_zero_dma_buffer(i2sPort);
if (s_i2sWriteMutex != nullptr) xSemaphoreGive(s_i2sWriteMutex);

// Safe index reset: only zero head/tail if no new packet arrived during DMA drain delay
portENTER_CRITICAL(&s_audioBuffer.spinlock);
if (s_audioBuffer.count == 0) {
s_audioBuffer.head = 0;
s_audioBuffer.tail = 0;
}
portEXIT_CRITICAL(&s_audioBuffer.spinlock);

Serial.printf("[Audio Task] Voice playback complete (%u PCM bytes clocked). Physical speaker silent.\n",
              (unsigned int)totalStreamBytes);
} else {
// Buffer Starvation / BLE lag spike:
// PWA hasn't finished sending, but we played faster than it arrived.
// Output silence temporarily to prevent stutter-looping, and wait for more data.
if (s_i2sWriteMutex != nullptr) xSemaphoreTake(s_i2sWriteMutex, portMAX_DELAY);
i2s_zero_dma_buffer(i2sPort);
if (s_i2sWriteMutex != nullptr) xSemaphoreGive(s_i2sWriteMutex);
vTaskDelay(pdMS_TO_TICKS(10)); // wait for more data to arrive
}
}
}
}

void AudioDriver::stop() {
s_audioBuffer.clear();
s_voicePlaying = false;
s_ingressActive = false;
if (initialized) {
if (s_i2sWriteMutex != nullptr) xSemaphoreTake(s_i2sWriteMutex, portMAX_DELAY);
i2s_zero_dma_buffer(i2sPort);
if (s_i2sWriteMutex != nullptr) xSemaphoreGive(s_i2sWriteMutex);
}
}
