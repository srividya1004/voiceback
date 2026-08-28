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

script_dir = os.path.dirname(os.path.abspath(__file__))
emg_ai_dir = os.path.abspath(os.path.join(script_dir, ".."))
models_dir = os.path.join(emg_ai_dir, "models")
checkpoints_dir = os.path.join(models_dir, "checkpoints")

if script_dir not in sys.path:
    sys.path.insert(0, script_dir)
if models_dir not in sys.path:
    sys.path.insert(0, models_dir)

from record_utility import extract_112_features, extract_1channel_features
from features import EMGFeatureScaler, pad_and_mask_sequences
from baseline_model import EMGSilentSpeechModel
from cnn_transformer_model import EMGCNNTransformerModel
from dataset import EMGSilentSpeechDataset, TextTokenizer
from metrics import ctc_greedy_decode


def run_emg_inference(raw_emg_data, mode="target", data_dir=None):
    if data_dir is None:
        data_dir = os.path.join(emg_ai_dir, "data", "extracted_dataset")

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

    # Reshape 1D array to (T, 1)
    if len(raw_emg.shape) == 1:
        raw_emg = raw_emg.reshape(-1, 1)

    if len(raw_emg.shape) != 2:
        return {
            "status": "error",
            "error_code": "INVALID_SHAPE",
            "message": f"Expected 2D matrix (T, num_channels) or 1D vector (T,), got shape {raw_emg.shape}"
        }

    if np.isnan(raw_emg).any() or np.isinf(raw_emg).any():
        return {
            "status": "error",
            "error_code": "INVALID_VALUES",
            "message": "Raw EMG signal contains NaN or Inf values."
        }

    # BioAmp EXG Pill is physical 1-channel acquisition
    if raw_emg.shape[1] == 1:
        try:
            features_14 = extract_1channel_features(raw_emg)
        except Exception as e:
            return {
                "status": "error",
                "error_code": "PREPROCESSING_FAILURE",
                "message": f"1-channel feature extraction failed: {str(e)}"
            }

        bioamp_1ch_ckpt = os.path.join(checkpoints_dir, "bioamp_1ch_model.pt")
        bioamp_target_ckpt = os.path.join(models_dir, "bioamp_target_model.pt")

        ckpt_1ch = bioamp_1ch_ckpt if os.path.exists(bioamp_1ch_ckpt) else (bioamp_target_ckpt if os.path.exists(bioamp_target_ckpt) else None)

        if ckpt_1ch is None:
            return {
                "status": "not_trained",
                "mode": mode,
                "channel_count": 1,
                "predicted_text": "",
                "intent": "Untrained 1-Channel Model",
                "message": "1-channel BioAmp preprocessing and model architecture are ready, but no trained 1-channel BioAmp model checkpoint is present. Patient calibration / BioAmp recording training session is required.",
                "architecture_ready": True,
                "preprocessing_ready": True,
                "model_training_required": True,
                "feature_shape": list(features_14.shape)
            }

        # If trained 1-channel checkpoint exists, execute forward pass
        try:
            state_dict = torch.load(ckpt_1ch, map_location="cpu")
            num_classes = state_dict.get("fc_out.weight", torch.zeros(8, 128)).shape[0]
            model = EMGCNNTransformerModel(
                in_features=14,
                conv_channels=128,
                d_model=128,
                nhead=4,
                num_encoder_layers=2,
                dim_feedforward=256,
                num_classes=num_classes,
                dropout=0.1
            )
            model.load_state_dict(state_dict)
            model.eval()

            scaled_feats = features_14
            padded = pad_and_mask_sequences([scaled_feats])
            input_tensor = torch.from_numpy(padded["padded_features"])

            with torch.no_grad():
                log_probs = model(input_tensor)

            tokenizer = TextTokenizer()
            decoded_text = ctc_greedy_decode(log_probs, tokenizer)[0]

            return {
                "status": "success",
                "mode": mode,
                "channel_count": 1,
                "predicted_text": decoded_text,
                "intent": "BioAmp Silent Speech Recognized",
                "feature_shape": list(features_14.shape)
            }
        except Exception as e:
            return {
                "status": "error",
                "error_code": "INFERENCE_FAILURE",
                "message": f"1-channel model inference failed: {str(e)}"
            }

    if raw_emg.shape[1] != 8:
        return {
            "status": "error",
            "error_code": "WRONG_CHANNEL_COUNT",
            "message": f"Expected 1 or 8 raw EMG channels, got {raw_emg.shape[1]}"
        }

    # 2. Checkpoint Resolution & Model Separation
    target_ckpt = os.path.join(models_dir, "target_vocab_model.pt")
    gaddy_ckpt = os.path.join(checkpoints_dir, "gaddy_cnn_transformer_best.pt")
    gaddy_scaler_path = os.path.join(checkpoints_dir, "gaddy_feature_scaler.json")
    gaddy_tok_path = os.path.join(checkpoints_dir, "gaddy_tokenizer.json")

    baseline_ckpt = os.path.join(models_dir, "best_baseline.pt")
    baseline_scaler_path = os.path.join(models_dir, "feature_scaler.json")

    if mode == "target":
        if os.path.exists(target_ckpt):
            ckpt_path = target_ckpt
            scaler_path = os.path.join(models_dir, "target_feature_scaler.json")
            if not os.path.exists(scaler_path):
                scaler_path = gaddy_scaler_path
            disclaimer = None
        else:
            return {
                "status": "not_calibrated",
                "mode": "target",
                "predicted_text": "",
                "message": "EMG target-vocabulary model is not calibrated yet. Please record patient calibration session."
            }

    elif mode == "gaddy" or mode == "benchmark":
        if os.path.exists(gaddy_ckpt):
            ckpt_path = gaddy_ckpt
            scaler_path = gaddy_scaler_path
            tokenizer_path = gaddy_tok_path
            disclaimer = "BENCHMARK TEST — NOT PATIENT TARGET VOCABULARY"
        elif os.path.exists(baseline_ckpt):
            ckpt_path = baseline_ckpt
            scaler_path = baseline_scaler_path
            tokenizer_path = None
            disclaimer = "BENCHMARK TEST — NOT PATIENT TARGET VOCABULARY"
        else:
            return {
                "status": "error",
                "error_code": "MISSING_BENCHMARK_CHECKPOINT",
                "message": "Benchmark model checkpoint does not exist."
            }
    else:
        return {
            "status": "error",
            "error_code": "INVALID_MODE",
            "message": f"Unknown mode '{mode}'. Must be 'target', 'gaddy', or 'benchmark'."
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

    if not os.path.exists(scaler_path):
        return {
            "status": "error",
            "error_code": "MISSING_SCALER",
            "message": f"Feature scaler configuration file missing at {scaler_path}."
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
        state_dict = torch.load(ckpt_path, map_location="cpu")
        
        # Instantiate model according to checkpoint architecture
        if "fc_out.weight" in state_dict:
            num_classes = state_dict["fc_out.weight"].shape[0]
            model = EMGCNNTransformerModel(
                in_features=112,
                conv_channels=128,
                d_model=128,
                nhead=4,
                num_encoder_layers=2,
                dim_feedforward=256,
                num_classes=num_classes,
                dropout=0.1
            )
        elif "fc.weight" in state_dict:
            num_classes = state_dict["fc.weight"].shape[0]
            model = EMGSilentSpeechModel(
                in_features=112,
                conv_channels=128,
                hidden_size=128,
                num_layers=2,
                num_classes=num_classes
            )
        else:
            raise ValueError(f"Unrecognized checkpoint parameter structure in {ckpt_path}")

        model.load_state_dict(state_dict)
        model.eval()

        tokenizer = TextTokenizer()
        if 'tokenizer_path' in locals() and tokenizer_path and os.path.exists(tokenizer_path):
            tokenizer.load_from_json(tokenizer_path)
        elif os.path.exists(gaddy_tok_path) and num_classes == 79:
            tokenizer.load_from_json(gaddy_tok_path)
        elif os.path.exists(data_dir):
            dataset = EMGSilentSpeechDataset(data_dir)
            tokenizer = dataset.tokenizer

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
    parser.add_argument("--mode", choices=["target", "benchmark", "gaddy"], default="target", help="Inference mode")
    parser.add_argument("--input_file", type=str, help="Path to JSON file containing raw_emg 2D array")
    parser.add_argument("--sample_id", type=str, help="Sample ID to load from extracted_dataset for benchmark test")
    args = parser.parse_args()

    raw_data = None
    if args.sample_id:
        if args.mode not in ["benchmark", "gaddy"]:
            print(json.dumps({
                "status": "error",
                "error_code": "INVALID_SAMPLE_ID_MODE",
                "message": "--sample_id test execution is BENCHMARK ONLY and cannot be used in patient target recognition mode."
            }))
            return

        npy_path = os.path.join(emg_ai_dir, "data", "extracted_dataset", "extracted_emg_features", f"{args.sample_id}_silent.npy")
        if not os.path.exists(npy_path):
            npy_path = os.path.join(emg_ai_dir, "data", "extracted_dataset", f"{args.sample_id}_silent.npy")

        if not os.path.exists(npy_path):
            print(json.dumps({
                "status": "error",
                "error_code": "SAMPLE_NOT_FOUND",
                "message": f"Sample ID '{args.sample_id}' not found in extracted dataset."
            }))
            return
        else:
            print(json.dumps({
                "status": "error",
                "error_code": "RAW_TIME_SERIES_MISSING",
                "message": f"Sample '{args.sample_id}' only contains pre-extracted 112-dim features; raw (T, 8) time-series data is required for inference."
            }))
            return

    elif args.input_file:
        try:
            with open(args.input_file, "r") as f:
                data = json.load(f)
                raw_data = data.get("raw_emg") or data.get("rawAnalogSignal")
        except Exception as e:
            print(json.dumps({
                "status": "error",
                "error_code": "FILE_READ_ERROR",
                "message": f"Failed to read input JSON file: {str(e)}"
            }))
            return
    else:
        # Standard input via stdin
        try:
            stdin_data = sys.stdin.read().strip()
            if stdin_data:
                parsed = json.loads(stdin_data)
                raw_data = parsed.get("raw_emg") or parsed.get("rawAnalogSignal")
        except Exception as e:
            print(json.dumps({
                "status": "error",
                "error_code": "STDIN_PARSE_ERROR",
                "message": f"Failed to parse stdin JSON payload: {str(e)}"
            }))
            return

    if raw_data is None:
        print(json.dumps({
            "status": "error",
            "error_code": "EMPTY_INPUT",
            "message": "No real EMG input was supplied."
        }))
        return

    result = run_emg_inference(raw_data, mode=args.mode)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
