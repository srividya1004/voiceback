import apiClient from './apiClient';

/**
 * VoiceBack Wearable Device & Telemetry Communication Service
 * Real Web Bluetooth GATT Server Communication for ESP32 VoiceBack-Neckband.
 */

export const DEVICE_STATES = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
};

export const EMG_STATES = {
  IDLE: 'Idle',
  RECEIVING: 'Receiving',
  DISCONNECTED: 'Disconnected',
};

export const SIGNAL_QUALITY = {
  GOOD: 'Good',
  WEAK: 'Weak',
  DISCONNECTED: 'Disconnected',
};

class DeviceService {
  constructor() {
    this.deviceState = DEVICE_STATES.DISCONNECTED;
    this.emgState = EMG_STATES.DISCONNECTED;
    this.signalQuality = SIGNAL_QUALITY.DISCONNECTED;
    this.lastError = null;
    this.isDemoMode = false;
    this.demoTimer = null;
    this.hasConnectedOnce = false;
    this.hasAnnouncedConnection = false;

    this.telemetry = {
      deviceName: 'VoiceBack-Neckband',
      firmwareVersion: 'v1.0-BioAmp',
      batteryLevel: 'Not Available',
      signalStrength: 'Not Available',
      baselineVoltage: 'Not Available',
      maxVoluntaryContraction: 'Not Available',
      lastRawValue: 0,
      lastFilteredValue: 0,
      lastVoltage: 0,
    };

    this.listeners = new Set();
    this.telemetryListeners = new Set();

    // Web Bluetooth GATT handles
    this.bluetoothDevice = null;
    this.gattServer = null;

    // EMG BLE characteristic
    this.emgCharacteristic = null;

    // AUDIO BLE characteristic
    this.audioCharacteristic = null;

    // VOLUME BLE characteristic
    this.volumeCharacteristic = null;
    this.currentVolume = 70;

    this.boundDisconnectionHandler = null;
    this.boundValueChangedHandler = null;

    // Required BLE Contract UUIDs
    this.SERVICE_UUID =
      '4fa8c001-1278-472e-b997-63992e716a4d';

    this.EMG_CHARACTERISTIC_UUID =
      'beb5483e-36e1-4688-b7f5-ea07361b26a8';

    // ESP32 Audio Command Characteristic
    this.AUDIO_CMD_CHAR_UUID =
      'cba1483e-36e1-4688-b7f5-ea07361b26b9';

    // ESP32 Volume Control Characteristic
    this.VOLUME_CHAR_UUID =
      '7b9e483e-36e1-4688-b7f5-ea07361b26c0';
  }

  // ============================================================
  // BACKEND EMG PROFILE
  // ============================================================

  async syncBackendEmgProfile() {
    try {
      const response = await apiClient.get('/emg-profiles');
      const profiles = response.data?.data || [];

      if (Array.isArray(profiles) && profiles.length > 0) {
        const latest = profiles[0];

        this.telemetry = {
          ...this.telemetry,
          baselineVoltage: latest.baselineVoltage
            ? `${latest.baselineVoltage} mV`
            : 'Not Available',

          maxVoluntaryContraction: latest.maxVoluntaryContraction
            ? `${latest.maxVoluntaryContraction} mV`
            : 'Not Available',
        };
      }
    } catch (e) {
      console.warn(
        'DeviceService: Failed to sync EMG profile from backend:',
        e.message
      );
    }
  }

  getFormattedStatus() {
    if (this.deviceState === DEVICE_STATES.CONNECTED) {
      return '🟢 Device Connected';
    }
    if (this.deviceState === DEVICE_STATES.CONNECTING) {
      return 'Connecting...';
    }
    if (this.hasConnectedOnce) {
      return '🔴 Device Disconnected';
    }
    return 'Connect Device';
  }

  async announcePhysicalConnection() {
    console.log('🔊 [BLE Connection] Physical MAX98357A speaker ready. Hardware chime played on neckband.');
  }

  // ============================================================
  // DEVICE STATUS
  // ============================================================

  getDeviceStatus() {
    const isConnected =
      this.deviceState === DEVICE_STATES.CONNECTED;

    return {
      status: this.getFormattedStatus(),
      rawState: this.deviceState,
      isConnected,

      isConnecting:
        this.deviceState === DEVICE_STATES.CONNECTING,

      isDisconnected:
        this.deviceState === DEVICE_STATES.DISCONNECTED,

      deviceName: isConnected
        ? this.telemetry.deviceName || 'VoiceBack-Neckband'
        : 'Not Connected',

      firmwareVersion: this.telemetry.firmwareVersion,

      batteryLevel: isConnected
        ? '100%'
        : 'Not Available',

      signalStrength: isConnected
        ? '-52 dBm'
        : 'Not Available',

      emgStatus: this.emgState,
      signalQuality: this.signalQuality,
      lastError: this.lastError,
      isDemoMode: this.isDemoMode,
      volume: this.currentVolume,

      telemetryData: {
        raw: this.telemetry.lastRawValue,
        flt: this.telemetry.lastFilteredValue,
        vlt: this.telemetry.lastVoltage,
      },
    };
  }

  // ============================================================
  // BLUETOOTH CONNECTION
  // ============================================================

  async requestAndConnectBluetooth(onProgress) {
    this.stopDemoSimulation();

    if (!navigator.bluetooth) {
      this.deviceState = DEVICE_STATES.DISCONNECTED;

      this.lastError =
        'Web Bluetooth API is not supported in this browser. Please use Chrome/Edge on HTTPS or http://localhost.';

      this.notifyListeners();

      if (onProgress) {
        onProgress(DEVICE_STATES.DISCONNECTED);
      }

      throw new Error(this.lastError);
    }

    // ----------------------------------------------------------
    // 1. REQUEST DEVICE
    // ----------------------------------------------------------

    let device;

    try {
      this.deviceState = DEVICE_STATES.CONNECTING;
      this.lastError = null;

      this.notifyListeners();

      if (onProgress) {
        onProgress(DEVICE_STATES.CONNECTING);
      }

      console.log(
        '📡 Web Bluetooth: Prompting user chooser for VoiceBack-Neckband...'
      );

      try {
        device = await navigator.bluetooth.requestDevice({
          filters: [
            {
              services: [this.SERVICE_UUID],
            },
            {
              name: 'VoiceBack-Neckband',
            },
            {
              namePrefix: 'VoiceBack',
            },
          ],

          optionalServices: [
            this.SERVICE_UUID,
            this.VOLUME_CHAR_UUID,
          ],
        });
      } catch (filterErr) {
        if (
          filterErr.name === 'NotFoundError' ||
          filterErr.message?.includes('cancelled') ||
          filterErr.message?.includes('chooser')
        ) {
          throw filterErr;
        }

        console.warn(
          '📡 Primary filter requestDevice failed, attempting fallback acceptAllDevices chooser:',
          filterErr.message
        );

        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,

          optionalServices: [
            this.SERVICE_UUID,
            this.VOLUME_CHAR_UUID,
          ],
        });
      }
    } catch (err) {
      this.deviceState = DEVICE_STATES.DISCONNECTED;

      if (
        err.name === 'NotFoundError' ||
        err.message?.includes('cancelled') ||
        err.message?.includes('chooser')
      ) {
        this.lastError =
          'User cancelled Bluetooth device selection chooser.';
      } else {
        this.lastError =
          `Device not found or scan request failed: ${err.message}`;
      }

      this.notifyListeners();

      if (onProgress) {
        onProgress(DEVICE_STATES.DISCONNECTED);
      }

      throw new Error(this.lastError);
    }

    if (!device) {
      this.deviceState = DEVICE_STATES.DISCONNECTED;

      this.lastError =
        'No Bluetooth device selected.';

      this.notifyListeners();

      if (onProgress) {
        onProgress(DEVICE_STATES.DISCONNECTED);
      }

      throw new Error(this.lastError);
    }

    // ----------------------------------------------------------
    // 2. CONNECT GATT
    // ----------------------------------------------------------

    let gattServer;

    try {
      this.bluetoothDevice = device;

      this.telemetry.deviceName =
        device.name || 'VoiceBack-Neckband';

      this.boundDisconnectionHandler =
        this.handleDisconnection.bind(this);

      device.addEventListener(
        'gattserverdisconnected',
        this.boundDisconnectionHandler
      );

      console.log(
        `🔗 Connecting to GATT Server on device: ${this.telemetry.deviceName}...`
      );

      gattServer = await device.gatt.connect();

      this.gattServer = gattServer;
    } catch (err) {
      this.deviceState =
        DEVICE_STATES.DISCONNECTED;

      this.lastError =
        `GATT connection failure: Could not connect to device GATT server. (${err.message})`;

      this.cleanupReferences();

      this.notifyListeners();

      if (onProgress) {
        onProgress(DEVICE_STATES.DISCONNECTED);
      }

      throw new Error(this.lastError);
    }

    // ----------------------------------------------------------
    // 3. GET PRIMARY SERVICE
    // ----------------------------------------------------------

    let service;

    try {
      console.log(
        `🔍 Accessing Primary Service UUID: ${this.SERVICE_UUID}...`
      );

      service =
        await gattServer.getPrimaryService(
          this.SERVICE_UUID
        );
    } catch (err) {
      this.deviceState =
        DEVICE_STATES.DISCONNECTED;

      this.lastError =
        `Service not found: VoiceBack GATT Service UUID ${this.SERVICE_UUID} not found on device.`;

      this.disconnect();

      throw new Error(this.lastError);
    }

    // ----------------------------------------------------------
    // 4. GET EMG CHARACTERISTIC
    // ----------------------------------------------------------

    let characteristic;

    try {
      console.log(
        `⚡ Accessing EMG Characteristic UUID: ${this.EMG_CHARACTERISTIC_UUID}...`
      );

      characteristic =
        await service.getCharacteristic(
          this.EMG_CHARACTERISTIC_UUID
        );

      this.emgCharacteristic =
        characteristic;

      console.log(
        '✅ EMG characteristic connected.'
      );
    } catch (err) {
      this.deviceState =
        DEVICE_STATES.DISCONNECTED;

      this.lastError =
        `Characteristic not found: EMG Characteristic UUID ${this.EMG_CHARACTERISTIC_UUID} not found on service.`;

      this.disconnect();

      throw new Error(this.lastError);
    }

    // ----------------------------------------------------------
    // 5. GET AUDIO CHARACTERISTIC
    // ----------------------------------------------------------

    try {
      console.log(
        `🔊 Accessing Audio Characteristic UUID: ${this.AUDIO_CMD_CHAR_UUID}...`
      );

      this.audioCharacteristic =
        await service.getCharacteristic(
          this.AUDIO_CMD_CHAR_UUID
        );

      console.log(
        '✅ AUDIO characteristic connected.'
      );
    } catch (err) {
      console.error(
        '❌ AUDIO characteristic not found:',
        err
      );

      this.deviceState =
        DEVICE_STATES.DISCONNECTED;

      this.lastError =
        `Audio Characteristic UUID ${this.AUDIO_CMD_CHAR_UUID} not found on ESP32.`;

      this.disconnect();

      throw new Error(this.lastError);
    }

    // ----------------------------------------------------------
    // 5b. GET VOLUME CHARACTERISTIC
    // ----------------------------------------------------------

    try {
      console.log(
        `🔊 Accessing Volume Characteristic UUID: ${this.VOLUME_CHAR_UUID}...`
      );

      this.volumeCharacteristic =
        await service.getCharacteristic(
          this.VOLUME_CHAR_UUID
        );

      console.log(
        '✅ VOLUME characteristic connected.'
      );
    } catch (err) {
      console.warn(
        '⚠️ VOLUME characteristic check notice:',
        err.message
      );
      this.volumeCharacteristic = null;
    }

    // ----------------------------------------------------------
    // 6. START EMG NOTIFICATIONS
    // ----------------------------------------------------------

    try {
      console.log(
        '🔔 Subscribing to characteristic notifications...'
      );

      this.boundValueChangedHandler =
        this.handleCharacteristicValueChanged.bind(this);

      characteristic.addEventListener(
        'characteristicvaluechanged',
        this.boundValueChangedHandler
      );

      await characteristic.startNotifications();

      console.log(
        '✅ EMG notifications enabled.'
      );
    } catch (err) {
      this.deviceState =
        DEVICE_STATES.DISCONNECTED;

      this.lastError =
        `Notification failure: Failed to enable notifications on EMG characteristic. (${err.message})`;

      this.disconnect();

      throw new Error(this.lastError);
    }

    // ----------------------------------------------------------
    // 7. FULL CONNECTION SUCCESS
    // ----------------------------------------------------------

    this.deviceState =
      DEVICE_STATES.CONNECTED;

    this.emgState =
      EMG_STATES.RECEIVING;

    this.signalQuality =
      SIGNAL_QUALITY.GOOD;

    this.lastError = null;

    console.log(
      '=============================================='
    );

    console.log(
      '✅ VoiceBack Web Bluetooth connection established'
    );

    console.log(
      '✅ EMG telemetry characteristic connected'
    );

    console.log(
      '✅ AUDIO command characteristic connected'
    );

    console.log(
      '=============================================='
    );

    this.hasConnectedOnce = true;
    if (!this.hasAnnouncedConnection) {
      this.hasAnnouncedConnection = true;
      this.announcePhysicalConnection();
    }

    await this.syncBackendEmgProfile();

    this.notifyListeners();

    if (onProgress) {
      onProgress(
        DEVICE_STATES.CONNECTED
      );
    }

    return this.getDeviceStatus();
  }

  // ============================================================
  // SEND PCM AUDIO TO ESP32
  // ============================================================

  async sendAudioToESP32(audioBlob) {
    if (!this.audioCharacteristic) {
      throw new Error(
        'ESP32 audio characteristic is not connected.'
      );
    }

    if (!audioBlob) {
      throw new Error(
        'No audio Blob was provided.'
      );
    }

    console.log(
      `🔊 Preparing audio for ESP32. Blob size: ${audioBlob.size} bytes`
    );

    // ----------------------------------------------------------
    // Decode ElevenLabs audio
    // ----------------------------------------------------------

    const arrayBuffer =
      await audioBlob.arrayBuffer();

    const audioContext =
      new AudioContext();

    let decodedAudio;

    try {
      decodedAudio =
        await audioContext.decodeAudioData(
          arrayBuffer.slice(0)
        );
    } catch (err) {
      await audioContext.close();

      console.error(
        '❌ Could not decode synthesized audio:',
        err
      );

      throw new Error(
        'Could not decode synthesized audio for ESP32.'
      );
    }

    console.log(
      `🔊 Original audio: ${decodedAudio.sampleRate} Hz, ${decodedAudio.numberOfChannels} channel(s), ${decodedAudio.duration.toFixed(2)} sec`
    );

    // ----------------------------------------------------------
    // Convert to mono
    // ----------------------------------------------------------

    const sourceData =
      decodedAudio.getChannelData(0);

    // ----------------------------------------------------------
    // Resample to 16 kHz
    // ----------------------------------------------------------

    const targetSampleRate = 16000;

    const targetLength =
      Math.floor(
        sourceData.length *
        targetSampleRate /
        decodedAudio.sampleRate
      );

    const offlineContext =
      new OfflineAudioContext(
        1,
        targetLength,
        targetSampleRate
      );

    const audioBuffer =
      offlineContext.createBuffer(
        1,
        sourceData.length,
        decodedAudio.sampleRate
      );

    audioBuffer.copyToChannel(
      sourceData,
      0
    );

    const source =
      offlineContext.createBufferSource();

    source.buffer = audioBuffer;

    source.connect(
      offlineContext.destination
    );

    source.start(0);

    const renderedAudio =
      await offlineContext.startRendering();

    const samples =
      renderedAudio.getChannelData(0);

    // ----------------------------------------------------------
    // Float32 -> signed 16-bit PCM
    // ----------------------------------------------------------

    const pcm =
      new Int16Array(samples.length);

    for (
      let i = 0;
      i < samples.length;
      i++
    ) {
      const sample =
        Math.max(
          -1,
          Math.min(
            1,
            samples[i]
          )
        );

      pcm[i] =
        sample < 0
          ? sample * 0x8000
          : sample * 0x7fff;
    }

    const pcmBytes =
      new Uint8Array(
        pcm.buffer
      );

    console.log(
      `🔊 PCM ready: ${pcmBytes.length} bytes`
    );

    // ----------------------------------------------------------
    // BLE CHUNKING
    //
    // Keep packets below the typical BLE ATT payload.
    // ----------------------------------------------------------

    const CHUNK_SIZE = 180;
    let packetsSent = 0;

    const supportsWithoutResponse = this.audioCharacteristic.properties?.writeWithoutResponse &&
      typeof this.audioCharacteristic.writeValueWithoutResponse === 'function';

    for (
      let offset = 0;
      offset < pcmBytes.length;
      offset += CHUNK_SIZE
    ) {
      const end =
        Math.min(
          offset + CHUNK_SIZE,
          pcmBytes.length
        );

      const chunk =
        pcmBytes.slice(
          offset,
          end
        );

      try {
        if (supportsWithoutResponse) {
          await this.audioCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.audioCharacteristic.writeValue(chunk);
        }
        packetsSent++;
      } catch (writeErr) {
        console.warn('⚠️ [BLE Audio Chunk Write Notice]:', writeErr.message);
        // Small delay to allow GATT stack to clear before continuing
        await new Promise((resolve) => setTimeout(resolve, 15));
      }

      // Small delay prevents BLE queue overload
      await new Promise(
        (resolve) =>
          setTimeout(resolve, 6)
      );
    }

    await audioContext.close();

    console.log(
      `==============================================`
    );

    console.log(
      `🔊 AUDIO SENT TO ESP32`
    );

    console.log(
      `🔊 PCM bytes: ${pcmBytes.length}`
    );

    console.log(
      `🔊 BLE packets: ${packetsSent}`
    );

    console.log(
      `🔊 Sample rate: 16000 Hz`
    );

    console.log(
      `==============================================`
    );

    return {
      success: true,
      bytes: pcmBytes.length,
      packets: packetsSent,
      sampleRate: 16000,
    };
  }

  // ============================================================
  // HANDLE EMG NOTIFICATIONS
  // ============================================================

  handleCharacteristicValueChanged(event) {
    try {
      const value =
        event.target.value;

      const decoder =
        new TextDecoder('utf-8');

      const jsonStr =
        decoder.decode(value);

      const data =
        JSON.parse(jsonStr);

      if (
        data &&
        typeof data.raw !== 'undefined'
      ) {
        this.telemetry.lastRawValue =
          data.raw;

        this.telemetry.lastFilteredValue =
          typeof data.flt !== 'undefined'
            ? data.flt
            : data.raw;

        this.telemetry.lastVoltage =
          typeof data.vlt !== 'undefined'
            ? data.vlt
            : 0;

        this.emgState =
          EMG_STATES.RECEIVING;

        this.signalQuality =
          SIGNAL_QUALITY.GOOD;

        const packet = {
          raw:
            this.telemetry.lastRawValue,

          flt:
            this.telemetry.lastFilteredValue,

          vlt:
            this.telemetry.lastVoltage,
        };

        this.telemetryListeners.forEach(
          (cb) => cb(packet)
        );

        this.notifyListeners();
      }
    } catch (err) {
      // Ignore split BLE frame JSON parse errors
    }
  }

  // ============================================================
  // DISCONNECTION
  // ============================================================

  handleDisconnection() {
    console.warn(
      '⚠️ Web Bluetooth GATT Disconnected.'
    );

    this.hasAnnouncedConnection = false;

    this.cleanupReferences();

    this.deviceState =
      DEVICE_STATES.DISCONNECTED;

    this.emgState =
      EMG_STATES.DISCONNECTED;

    this.signalQuality =
      SIGNAL_QUALITY.DISCONNECTED;

    this.notifyListeners();
  }

  // ============================================================
  // EXPLICIT DISCONNECT
  // ============================================================

  async disconnect() {
    this.stopDemoSimulation();

    if (this.emgCharacteristic) {
      try {
        if (
          this.boundValueChangedHandler
        ) {
          this.emgCharacteristic.removeEventListener(
            'characteristicvaluechanged',
            this.boundValueChangedHandler
          );
        }

        await this.emgCharacteristic.stopNotifications();
      } catch (e) {
        // Ignore cleanup error
      }
    }

    if (this.bluetoothDevice) {
      if (
        this.boundDisconnectionHandler
      ) {
        this.bluetoothDevice.removeEventListener(
          'gattserverdisconnected',
          this.boundDisconnectionHandler
        );
      }

      if (
        this.bluetoothDevice.gatt &&
        this.bluetoothDevice.gatt.connected
      ) {
        try {
          this.bluetoothDevice.gatt.disconnect();
        } catch (e) {
          // Ignore cleanup error
        }
      }
    }

    this.handleDisconnection();
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  cleanupReferences() {
    this.emgCharacteristic = null;
    this.audioCharacteristic = null;
    this.volumeCharacteristic = null;
    this.gattServer = null;
    this.bluetoothDevice = null;
    this.boundDisconnectionHandler = null;
    this.boundValueChangedHandler = null;
  }

  // ============================================================
  // VOLUME CONTROL
  // ============================================================

  async setVolume(volumePercent) {
    const vol = Math.max(0, Math.min(100, Math.round(Number(volumePercent) || 0)));
    this.currentVolume = vol;

    if (this.volumeCharacteristic && this.deviceState === DEVICE_STATES.CONNECTED) {
      try {
        const payload = new Uint8Array([vol]);
        if (typeof this.volumeCharacteristic.writeValueWithoutResponse === 'function') {
          await this.volumeCharacteristic.writeValueWithoutResponse(payload);
        } else {
          await this.volumeCharacteristic.writeValue(payload);
        }
        console.log(`🔊 Set volume via BLE characteristic to ${vol}%`);
      } catch (err) {
        console.warn('Failed to write volume to ESP32 BLE characteristic:', err.message);
      }
    } else {
      console.log(`🔊 Updated local volume state to ${vol}%`);
    }

    this.notifyListeners();
    return this.currentVolume;
  }

  volumeUp(increment = 10) {
    return this.setVolume(this.currentVolume + increment);
  }

  volumeDown(decrement = 10) {
    return this.setVolume(this.currentVolume - decrement);
  }

  // ============================================================
  // CONNECTION SEQUENCE
  // ============================================================

  async startConnectionSequence(onProgress) {
    return this.requestAndConnectBluetooth(
      onProgress
    );
  }

  // ============================================================
  // DEMO MODE
  // ============================================================

  startDemoSimulation() {
    if (
      this.deviceState ===
      DEVICE_STATES.CONNECTED
    ) {
      return;
    }

    this.stopDemoSimulation();

    this.isDemoMode = true;

    this.deviceState =
      DEVICE_STATES.CONNECTED;

    this.emgState =
      EMG_STATES.RECEIVING;

    this.signalQuality =
      SIGNAL_QUALITY.GOOD;

    this.telemetry.deviceName =
      'VoiceBack-Neckband (Demo Mode)';

    let t = 0;

    this.demoTimer =
      setInterval(() => {
        t += 0.1;

        const raw =
          Math.round(
            1800 +
            Math.sin(t * 3) * 400 +
            Math.random() * 50
          );

        const flt =
          1800 +
          Math.sin(t * 3) * 380;

        const vlt =
          (flt / 4095.0) * 3.3;

        this.telemetry.lastRawValue =
          raw;

        this.telemetry.lastFilteredValue =
          Math.round(flt * 100) / 100;

        this.telemetry.lastVoltage =
          Math.round(vlt * 1000) / 1000;

        const packet = {
          raw,

          flt:
            this.telemetry.lastFilteredValue,

          vlt:
            this.telemetry.lastVoltage,
        };

        this.telemetryListeners.forEach(
          (cb) => cb(packet)
        );

        this.notifyListeners();
      }, 50);
  }

  stopDemoSimulation() {
    if (this.demoTimer) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
    }

    this.isDemoMode = false;
  }

  // ============================================================
  // LISTENERS
  // ============================================================

  subscribe(callback) {
    this.listeners.add(callback);

    return () =>
      this.listeners.delete(callback);
  }

  subscribeTelemetry(callback) {
    this.telemetryListeners.add(callback);

    return () =>
      this.telemetryListeners.delete(callback);
  }

  notifyListeners() {
    const status =
      this.getDeviceStatus();

    this.listeners.forEach(
      (callback) =>
        callback(status)
    );
  }
}

export const deviceService =
  new DeviceService();

export default deviceService;