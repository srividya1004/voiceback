"""
VoiceBack EMG / AI Prototype - Real Recording Utility Module
Converts raw 8-channel sEMG signals (T, 8) @ 1000 Hz into 112-dimensional
feature matrices (T', 112) and saves paired JSON metadata matching the
EMGSilentSpeechDataset training contract.
"""

import os
import json
import numpy as np


def extract_112_features(raw_emg, sampling_rate=1000, frame_len_ms=27, frame_step_ms=10):
    """
    Extracts 112-dimensional sEMG feature frames from raw (T, 8) signal array.
    - 8 channels
    - 5 Time Domain features per channel (MAV, ZC, SSC, WL, RMS)
    - 9 STFT frequency magnitude bins per channel (16-pt FFT)
    Total per channel = 14 features -> 8 * 14 = 112 features per temporal frame.
    """
    T, num_channels = raw_emg.shape
    if num_channels != 8:
        raise ValueError(f"Expected 8 raw EMG channels, got {num_channels}")

    frame_len = int(sampling_rate * frame_len_ms / 1000)   # 27 samples
    frame_step = int(sampling_rate * frame_step_ms / 1000) # 10 samples

    if T < frame_len:
        num_frames = 1
    else:
        num_frames = (T - frame_len) // frame_step + 1

    features_out = np.zeros((num_frames, 112), dtype=np.float32)

    for i in range(num_frames):
        start = i * frame_step
        end = start + frame_len
        window = raw_emg[start:end, :]

        if window.shape[0] < frame_len:
            pad_len = frame_len - window.shape[0]
            window = np.pad(window, ((0, pad_len), (0, 0)), mode='edge')

        frame_feats = []
        for ch in range(8):
            sig = window[:, ch]
            # Time domain (5)
            mav = np.mean(np.abs(sig))
            zc = np.sum(np.diff(np.sign(sig) != 0))
            ssc = np.sum(np.diff(np.sign(np.diff(sig))) != 0)
            wl = np.sum(np.abs(np.diff(sig)))
            rms = np.sqrt(np.mean(sig ** 2))

            # STFT frequency domain (9)
            stft_mags = np.abs(np.fft.rfft(sig, n=16))

            ch_feats = [mav, zc, ssc, wl, rms] + stft_mags.tolist()
            frame_feats.extend(ch_feats)

        features_out[i, :] = frame_feats

    return features_out


def save_real_emg_sample(
    participant_id,
    phrase,
    repetition_num,
    raw_emg_signal,
    is_silent=True,
    output_dir="emg-ai/data/extracted_dataset"
):
    """
    Saves a real sEMG recording into the dataset format expected by EMGSilentSpeechDataset.
    """
    os.makedirs(output_dir, exist_ok=True)

    # Validate raw signal shape
    if not isinstance(raw_emg_signal, np.ndarray):
        raw_emg_signal = np.array(raw_emg_signal, dtype=np.float32)

    if len(raw_emg_signal.shape) != 2 or raw_emg_signal.shape[1] != 8:
        raise ValueError(f"Raw EMG signal must be shape (T, 8). Got {raw_emg_signal.shape}")

    # Extract 112 features
    feature_matrix = extract_112_features(raw_emg_signal)

    # Sanitize sample ID
    sanitized_participant = str(participant_id).lower().replace(" ", "_")
    sanitized_phrase = "".join([c.lower() if c.isalnum() else "_" for c in phrase]).strip("_")
    sample_id = f"{sanitized_participant}_{sanitized_phrase}_rep{repetition_num:02d}"

    condition_str = "silent" if is_silent else "voiced"
    feature_filename = f"{sample_id}_{condition_str}.npy"
    metadata_filename = f"{sample_id}.json"

    feature_path = os.path.join(output_dir, feature_filename)
    metadata_path = os.path.join(output_dir, metadata_filename)

    # Save feature array
    np.save(feature_path, feature_matrix)

    # Save metadata JSON
    meta_dict = {
        "sample_id": sample_id,
        "participant_id": participant_id,
        "phrase": phrase,
        "text": phrase,
        "repetition": repetition_num,
        "condition": condition_str,
        "sampling_rate_hz": 1000,
        "raw_channels": 8,
        "raw_samples": raw_emg_signal.shape[0],
        "feature_shape": list(feature_matrix.shape)
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(meta_dict, f, indent=2)

    return {
        "sample_id": sample_id,
        "feature_path": feature_path,
        "metadata_path": metadata_path,
        "feature_shape": feature_matrix.shape
    }
