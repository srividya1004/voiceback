"""
VoiceBack EMG / AI Prototype - Gaddy Silent Speech Preprocessing Adapter
Decoupled adapter module for converting raw 8-channel Gaddy sEMG signals (T, 8) @ 1000 Hz
into VoiceBack's 112-dimensional temporal feature frame matrix (T', 112).

STRICT SAFETY CONSTRAINTS:
- Synthetically tested without real Gaddy data download.
- Reuses existing VoiceBack feature extraction (extract_112_features) and scaling (EMGFeatureScaler).
- Core CNN + Transformer model architecture and production modules remain untouched.
"""

import sys
import os
import numpy as np

try:
    import scipy.signal
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False

# Ensure preprocessing directory is in path for relative imports
sys_dir = os.path.dirname(os.path.abspath(__file__))
if sys_dir not in sys.path:
    sys.path.insert(0, sys_dir)

from record_utility import extract_112_features
from features import EMGFeatureScaler


class GaddyEMGAdapter:
    """
    Adapter class for validating, filtering, and converting raw Gaddy sEMG time-series (T, 8) @ 1000 Hz
    into VoiceBack's 112-dimensional feature matrix (T', 112).
    """

    def __init__(
        self,
        expected_channels=8,
        expected_sampling_rate=1000,
        apply_notch=True,
        notch_freq=60.0,
        apply_highpass=True,
        highpass_cutoff=2.0
    ):
        self.expected_channels = expected_channels
        self.expected_sampling_rate = expected_sampling_rate
        self.apply_notch = apply_notch
        self.notch_freq = notch_freq
        self.apply_highpass = apply_highpass
        self.highpass_cutoff = highpass_cutoff

    def validate_raw_emg(self, raw_emg, sampling_rate=None):
        """
        Rigorous data format and numerical validity checks.
        Returns (is_valid: bool, error_message: str).
        """
        if sampling_rate is None:
            sampling_rate = self.expected_sampling_rate

        if sampling_rate != self.expected_sampling_rate:
            return False, f"Invalid sampling rate {sampling_rate} Hz. Expected {self.expected_sampling_rate} Hz."

        if raw_emg is None:
            return False, "Input EMG signal is None."

        if not isinstance(raw_emg, np.ndarray):
            try:
                raw_emg = np.array(raw_emg, dtype=np.float32)
            except Exception as e:
                return False, f"Failed to convert raw input to NumPy array: {str(e)}"

        if raw_emg.size == 0 or raw_emg.shape[0] == 0:
            return False, "Input EMG signal is empty (0 frames)."

        if len(raw_emg.shape) != 2:
            return False, f"Expected 2D matrix (T, {self.expected_channels}), got shape {raw_emg.shape}."

        if raw_emg.shape[1] != self.expected_channels:
            return False, f"Expected {self.expected_channels} channels, got {raw_emg.shape[1]}."

        if np.isnan(raw_emg).any():
            return False, "Input EMG signal contains NaN values."

        if np.isinf(raw_emg).any():
            return False, "Input EMG signal contains Inf values."

        return True, "Valid"

    def filter_signal(self, raw_emg, fs=1000):
        """
        Applies power line notch filtering and DC drift highpass filtering.
        Uses scipy.signal when available, otherwise falls back to pure NumPy implementations.
        """
        filtered = raw_emg.copy()

        # 1. Highpass Filter (2 Hz cutoff) to remove DC drift
        if self.apply_highpass and fs > 2 * self.highpass_cutoff:
            if HAS_SCIPY:
                b_hp, a_hp = scipy.signal.butter(3, self.highpass_cutoff, 'highpass', fs=fs)
                for ch in range(filtered.shape[1]):
                    filtered[:, ch] = scipy.signal.filtfilt(b_hp, a_hp, filtered[:, ch])
            else:
                # NumPy Fallback: Remove DC mean and apply Exponential Moving Average highpass
                alpha = 0.99
                for ch in range(filtered.shape[1]):
                    sig = filtered[:, ch] - np.mean(filtered[:, ch])
                    lowpass = np.zeros_like(sig)
                    for t in range(1, len(sig)):
                        lowpass[t] = alpha * lowpass[t - 1] + (1 - alpha) * sig[t]
                    filtered[:, ch] = sig - lowpass

        # 2. Power line Notch filter (60 Hz + harmonics for US Gaddy data)
        if self.apply_notch and fs > 2 * self.notch_freq:
            if HAS_SCIPY:
                for harmonic in range(1, 8):
                    h_freq = self.notch_freq * harmonic
                    if h_freq >= fs / 2.0:
                        break
                    b_notch, a_notch = scipy.signal.iirnotch(h_freq, Q=30.0, fs=fs)
                    for ch in range(filtered.shape[1]):
                        filtered[:, ch] = scipy.signal.filtfilt(b_notch, a_notch, filtered[:, ch])
            else:
                # NumPy Fallback: Comb / moving average notch subtraction for power line frequency
                period = int(round(fs / self.notch_freq))
                if period > 1 and period < filtered.shape[0]:
                    for ch in range(filtered.shape[1]):
                        sig = filtered[:, ch]
                        pad_sig = np.pad(sig, (period // 2, period // 2), mode='edge')
                        mavg = np.convolve(pad_sig, np.ones(period) / period, mode='valid')[:len(sig)]
                        filtered[:, ch] = sig - mavg

        return filtered

    def adapt_sample(self, raw_emg, sampling_rate=1000, scaler=None):
        """
        Converts Gaddy raw (T, 8) EMG time-series into VoiceBack (T', 112) feature matrix.
        Reuses existing VoiceBack extract_112_features() function.
        """
        # 1. Validate Input
        is_valid, err_msg = self.validate_raw_emg(raw_emg, sampling_rate=sampling_rate)
        if not is_valid:
            raise ValueError(f"GaddyEMGAdapter Validation Error: {err_msg}")

        raw_emg_arr = np.array(raw_emg, dtype=np.float32)

        # 2. Filter Signal
        filtered_emg = self.filter_signal(raw_emg_arr, fs=sampling_rate)

        # 3. Extract VoiceBack 112 Features using existing extract_112_features
        features_112 = extract_112_features(
            filtered_emg,
            sampling_rate=sampling_rate,
            frame_len_ms=27,
            frame_step_ms=10
        )

        # 4. Optional Scaling using existing EMGFeatureScaler
        if scaler is not None:
            features_112 = scaler.transform(features_112)

        return features_112


def test_gaddy_adapter():
    """
    Unit test for GaddyEMGAdapter using synthetic test inputs ONLY.
    Validates input sanity checking, error reporting, and (T, 8) -> (T', 112) shape conversion.
    """
    print("==================================================")
    print("      VoiceBack Gaddy Preprocessing Adapter Test  ")
    print("==================================================")

    adapter = GaddyEMGAdapter(expected_channels=8, expected_sampling_rate=1000)

    # 1. Error Handling Tests
    print("\n1. Testing Error Handling & Input Validation:")
    
    # Test Empty Input
    empty_input = np.zeros((0, 8), dtype=np.float32)
    valid, msg = adapter.validate_raw_emg(empty_input)
    print(f"   - Empty input validation: valid={valid}, msg='{msg}'")
    assert not valid and "empty" in msg

    # Test Invalid Channels
    wrong_ch_input = np.random.randn(1000, 4).astype(np.float32)
    valid, msg = adapter.validate_raw_emg(wrong_ch_input)
    print(f"   - Wrong channels validation: valid={valid}, msg='{msg}'")
    assert not valid and "channels" in msg

    # Test Invalid Sampling Rate
    valid, msg = adapter.validate_raw_emg(np.random.randn(1000, 8), sampling_rate=500)
    print(f"   - Wrong sampling rate validation: valid={valid}, msg='{msg}'")
    assert not valid and "sampling rate" in msg

    # Test NaN Input
    nan_input = np.random.randn(1000, 8).astype(np.float32)
    nan_input[50, 2] = np.nan
    valid, msg = adapter.validate_raw_emg(nan_input)
    print(f"   - NaN input validation: valid={valid}, msg='{msg}'")
    assert not valid and "NaN" in msg

    # Test Inf Input
    inf_input = np.random.randn(1000, 8).astype(np.float32)
    inf_input[100, 5] = np.inf
    valid, msg = adapter.validate_raw_emg(inf_input)
    print(f"   - Inf input validation: valid={valid}, msg='{msg}'")
    assert not valid and "Inf" in msg

    # 2. Transformation Test with Synthetic Test Input
    print("\n2. Testing Shape Transformation (Synthetic Test Input):")
    # Synthetic test signal: 1 second (1000 samples) of 8-channel noise + sine wave
    t = np.linspace(0, 1.0, 1000, endpoint=False)
    synthetic_test_emg = np.zeros((1000, 8), dtype=np.float32)
    for ch in range(8):
        synthetic_test_emg[:, ch] = 0.5 * np.sin(2 * np.pi * 50 * t) + 0.1 * np.random.randn(1000)

    print(f"   - Synthetic Test Input Shape:  {synthetic_test_emg.shape} (T=1000, C=8 @ 1000 Hz)")
    
    # Process through adapter
    output_features = adapter.adapt_sample(synthetic_test_emg, sampling_rate=1000)
    
    print(f"   - Output Feature Matrix Shape: {output_features.shape} (T'={output_features.shape[0]}, F=112)")
    print(f"   - Feature Vector Min Value:    {output_features.min():.4f}")
    print(f"   - Feature Vector Max Value:    {output_features.max():.4f}")
    print(f"   - Contains NaN:                {np.isnan(output_features).any()}")
    print(f"   - Contains Inf:                {np.isinf(output_features).any()}")

    # Assertions for Contract Compliance
    assert len(output_features.shape) == 2, "Output must be a 2D matrix (T', 112)"
    assert output_features.shape[1] == 112, f"Output feature dimension must be 112, got {output_features.shape[1]}"
    assert not np.isnan(output_features).any(), "Output features contain NaN"
    assert not np.isinf(output_features).any(), "Output features contain Inf"

    print("\n==================================================")
    print(" GADDY PREPROCESSING ADAPTER VERIFIED SUCCESSFULLY")
    print("==================================================")


if __name__ == "__main__":
    test_gaddy_adapter()
