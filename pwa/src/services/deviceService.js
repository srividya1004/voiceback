import apiClient from './apiClient';

/**
 * VoiceBack Wearable Device & Telemetry Communication Service
 * Manages ESP32 neckband connection states, sEMG profile data, and sensor telemetry.
 */

// Device Communication States
export const DEVICE_STATES = {
  CONNECTED: 'Connected',
  DISCONNECTED: 'Disconnected',
  SEARCHING: 'Searching',
  WAITING: 'Waiting for Device',
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
    this.deviceState = DEVICE_STATES.WAITING;
    this.emgState = EMG_STATES.DISCONNECTED;
    this.signalQuality = SIGNAL_QUALITY.DISCONNECTED;
    this.telemetry = {
      deviceName: 'VoiceBack Neckband v1.0',
      firmwareVersion: 'Not Available',
      batteryLevel: 'Not Available',
      signalStrength: 'Not Available',
      baselineVoltage: 'Not Available',
      maxVoluntaryContraction: 'Not Available',
    };
    this.listeners = new Set();
  }

  // Fetch EMG Profile from Express REST API backend
  async syncBackendEmgProfile() {
    try {
      const response = await apiClient.get('/emg-profiles');
      const profiles = response.data?.data || [];
      if (Array.isArray(profiles) && profiles.length > 0) {
        const latest = profiles[0];
        this.telemetry = {
          ...this.telemetry,
          baselineVoltage: latest.baselineVoltage ? `${latest.baselineVoltage} mV` : 'Not Available',
          maxVoluntaryContraction: latest.maxVoluntaryContraction ? `${latest.maxVoluntaryContraction} mV` : 'Not Available',
        };
      }
    } catch (e) {
      console.warn('DeviceService: Failed to sync EMG profile from backend:', e.message);
    }
  }

  // Get current device status summary
  getDeviceStatus() {
    return {
      status: this.deviceState,
      deviceName: this.deviceState === DEVICE_STATES.DISCONNECTED || this.deviceState === DEVICE_STATES.WAITING ? 'Not Available' : this.telemetry.deviceName,
      firmwareVersion: this.telemetry.firmwareVersion,
      batteryLevel: this.telemetry.batteryLevel,
      signalStrength: this.telemetry.signalStrength,
      emgStatus: this.emgState,
      signalQuality: this.signalQuality,
    };
  }

  // Trigger simulated device search / connection workflow
  async startConnectionSequence(onProgress) {
    this.deviceState = DEVICE_STATES.SEARCHING;
    this.notifyListeners();
    if (onProgress) onProgress(DEVICE_STATES.SEARCHING);

    return new Promise((resolve) => {
      setTimeout(async () => {
        // Attempt backend sync
        await this.syncBackendEmgProfile();

        // Check if WebBluetooth API is available in browser
        if (navigator.bluetooth) {
          this.deviceState = DEVICE_STATES.WAITING;
          this.emgState = EMG_STATES.DISCONNECTED;
          this.signalQuality = SIGNAL_QUALITY.DISCONNECTED;
        } else {
          this.deviceState = DEVICE_STATES.WAITING;
          this.emgState = EMG_STATES.DISCONNECTED;
          this.signalQuality = SIGNAL_QUALITY.DISCONNECTED;
        }

        this.notifyListeners();
        if (onProgress) onProgress(this.deviceState);
        resolve(this.getDeviceStatus());
      }, 1500);
    });
  }

  // Subscribe to device status changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const status = this.getDeviceStatus();
    this.listeners.forEach((callback) => callback(status));
  }
}

export const deviceService = new DeviceService();
export default deviceService;
