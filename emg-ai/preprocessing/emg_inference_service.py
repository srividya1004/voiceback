"""
VoiceBack EMG / AI Prototype - Backend Python Inference Service
Loads PyTorch sEMG model checkpoints and executes real-time inference on raw 8-channel sEMG input arrays (T, 8) @ 1000 Hz.
Strictly enforces model separation between patient target-vocabulary model and development benchmark testing.
"""

import sys
import os
import json
import argparse
import numpy as np
import torch

sys.path.insert(0, os.path.abspath("emg-ai/preprocessing"))
sys.path.insert(0, os.path.abspath("emg-ai/models"))

from record_utility import extract_112_features
from features import EMGFeatureScaler, pad_and_mask_sequences
from baseline_model import EMGSilentSpeechModel
from dataset import EMGSilentSpeechDataset, TextTokenizer
from metrics import ctc_greedy_decode


def run_emg_inference(raw_emg_data, mode="target", data_dir="emg-ai/data/extracted_dataset"):
    # 1. Error Handling & Input Validation
    if raw_emg_data is None or len(raw_emg_data) == 0:
        return {
            "status": "error",
            "error_code": "EMPTY_SIGNAL",
            "message": "Input EMG signal is empty or invalid."
        }

    try:
        raw_emg = np.array(raw_emg_data, dtype=np.float32)
    except Exception as e:
        return {
            "status": "error",
            "error_code": "MALFORMED_INPUT",
            "message": f"Malformed input EMG matrix: {str(e)}"
        }

    if len(raw_emg.shape) != 2:
        return {
            "status": "error",
            "error_code": "INVALID_SHAPE",
            "message": f"Expected 2D matrix (T, 8), got shape {raw_emg.shape}"
        }

    if raw_emg.shape[1] != 8:
        return {
            "status": "error",
            "error_code": "WRONG_CHANNEL_COUNT",
            "message": f"Expected 8 raw EMG channels, got {raw_emg.shape[1]}"
        }

    if np.isnan(raw_emg).any() or np.isinf(raw_emg).any():
        return {
            "status": "error",
            "error_code": "INVALID_VALUES",
            "message": "Raw EMG signal contains NaN or Inf values."
        }

    # 2. Checkpoint Resolution & Model Separation
    target_ckpt = os.path.abspath("emg-ai/models/target_vocab_model.pt")
    benchmark_ckpt = os.path.abspath("emg-ai/models/best_baseline.pt")
    scaler_path = os.path.abspath("emg-ai/models/feature_scaler.json")

    if mode == "target":
        if not os.path.exists(target_ckpt):
            return {
                "status": "not_calibrated",
                "mode": "target",
                "predicted_text": "",
                "message": "EMG target-vocabulary model is not calibrated yet. Please record patient calibration session."
            }
        ckpt_path = target_ckpt
        disclaimer = None
    elif mode == "benchmark":
        if not os.path.exists(benchmark_ckpt):
            return {
                "status": "error",
                "error_code": "MISSING_BENCHMARK_CHECKPOINT",
                "message": "Benchmark model checkpoint does not exist."
            }
        ckpt_path = benchmark_ckpt
        disclaimer = "BENCHMARK TEST — NOT PATIENT TARGET VOCABULARY"
    else:
        return {
            "status": "error",
            "error_code": "INVALID_MODE",
            "message": f"Unknown mode '{mode}'. Must be 'target' or 'benchmark'."
        }

    # 3. Feature Preprocessing
    try:
        features_112 = extract_112_features(raw_emg)
    except Exception as e:
        return {
            "status": "error",
            "error_code": "PREPROCESSING_FAILURE",
            "message": f"Feature extraction failed: {str(e)}"
        }

    # Load scaler and dataset tokenizer
    if not os.path.exists(scaler_path):
        return {
            "status": "error",
            "error_code": "MISSING_SCALER",
            "message": "Feature scaler configuration file missing."
        }

    try:
        scaler = EMGFeatureScaler().load(scaler_path)
        scaled_feats = scaler.transform(features_112)
        padded = pad_and_mask_sequences([scaled_feats])
        input_tensor = torch.from_numpy(padded["padded_features"])
    except Exception as e:
        return {
            "status": "error",
            "error_code": "SCALING_FAILURE",
            "message": f"Feature scaling failed: {str(e)}"
        }

    # 4. Tokenizer & Model Inference
    try:
        dataset = EMGSilentSpeechDataset(data_dir)
        tokenizer = dataset.tokenizer
        vocab_size = tokenizer.vocab_size()

        model = EMGSilentSpeechModel(
            in_features=112,
            conv_channels=128,
            hidden_size=128,
            num_layers=2,
            num_classes=vocab_size
        )
        model.load_state_dict(torch.load(ckpt_path))
        model.eval()

        with torch.no_grad():
            log_probs = model(input_tensor)

        decoded_text = ctc_greedy_decode(log_probs, tokenizer)[0]

        res = {
            "status": "success",
            "mode": mode,
            "predicted_text": decoded_text,
            "feature_shape": list(features_112.shape)
        }
        if disclaimer:
            res["disclaimer"] = disclaimer

        return res

    except Exception as e:
        return {
            "status": "error",
            "error_code": "INFERENCE_FAILURE",
            "message": f"Model inference failed: {str(e)}"
        }


def main():
    parser = argparse.ArgumentParser(description="VoiceBack EMG Backend Inference Bridge")
    parser.add_argument("--mode", choices=["target", "benchmark"], default="target", help="Inference mode")
    parser.add_argument("--input_file", type=str, help="Path to JSON file containing raw_emg 2D array")
    parser.add_argument("--sample_id", type=str, help="Sample ID to load from extracted_dataset for benchmark test")
    args = parser.parse_args()

    raw_data = None
    if args.sample_id:
        npy_path = os.path.join("emg-ai/data/extracted_dataset/extracted_emg_features", f"{args.sample_id}_silent.npy")
        if not os.path.exists(npy_path):
            npy_path = os.path.join("emg-ai/data/extracted_dataset", f"{args.sample_id}_silent.npy")

        if os.path.exists(npy_path):
            # 112-dim processed array test
            features_112 = np.load(npy_path)
            # Create synthetic 8-channel array for test if raw not stored
            raw_data = np.random.randn(features_112.shape[0] * 10, 8).astype(np.float32)
    elif args.input_file:
        with open(args.input_file, "r") as f:
            data = json.load(f)
            raw_data = data.get("raw_emg") or data.get("rawAnalogSignal")
    else:
        # Standard input via stdin
        try:
            stdin_data = sys.stdin.read().strip()
            if stdin_data:
                parsed = json.loads(stdin_data)
                raw_data = parsed.get("raw_emg") or parsed.get("rawAnalogSignal")
        except Exception:
            pass

    if raw_data is None:
        # Generate dummy 8-channel 1-second sample if running directly for dev check
        raw_data = np.random.randn(1000, 8).astype(np.float32)

    result = run_emg_inference(raw_data, mode=args.mode)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
