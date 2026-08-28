"""
VoiceBack EMG / AI Fix #2 — Automated Unit & Integration Tests
Verifies real PyTorch model inference loading, checkpoint resolution, 1-channel rejection without fabrication,
and error handling contracts.
"""

import sys
import os
import numpy as np

# Ensure pathing to preprocessing and models
test_dir = os.path.dirname(os.path.abspath(__file__))
emg_ai_dir = os.path.abspath(os.path.join(test_dir, ".."))
preprocessing_dir = os.path.join(emg_ai_dir, "preprocessing")
models_dir = os.path.join(emg_ai_dir, "models")

if preprocessing_dir not in sys.path:
    sys.path.insert(0, preprocessing_dir)
if models_dir not in sys.path:
    sys.path.insert(0, models_dir)

from emg_inference_service import run_emg_inference


def test_19a_missing_input():
    """Test A: Missing/empty input signal error handling."""
    res_none = run_emg_inference(None, mode="benchmark")
    assert res_none["status"] == "error", f"Expected error, got {res_none}"
    assert res_none["error_code"] == "EMPTY_SIGNAL", f"Expected EMPTY_SIGNAL, got {res_none}"

    res_empty = run_emg_inference([], mode="benchmark")
    assert res_empty["status"] == "error", f"Expected error, got {res_empty}"
    assert res_empty["error_code"] == "EMPTY_SIGNAL", f"Expected EMPTY_SIGNAL, got {res_empty}"
    print("  [PASS] Test 19A: Missing Input Handling")


def test_19b_valid_checkpoint_resolution():
    """Test B: Valid Gaddy checkpoint resolution in benchmark/gaddy mode."""
    valid_8ch_emg = np.random.randn(1000, 8).astype(np.float32)
    res = run_emg_inference(valid_8ch_emg, mode="gaddy")

    assert res["status"] == "success", f"Expected success, got {res}"
    assert res["mode"] == "gaddy"
    assert "predicted_text" in res
    assert res["feature_shape"] == [98, 112]
    assert res["disclaimer"] == "BENCHMARK TEST — NOT PATIENT TARGET VOCABULARY"
    print("  [PASS] Test 19B: Valid Checkpoint Resolution")


def test_19c_missing_target_checkpoint_handling():
    """Test C: Missing target patient checkpoint returns 'not_calibrated' without fallback claims."""
    valid_8ch_emg = np.random.randn(1000, 8).astype(np.float32)
    res = run_emg_inference(valid_8ch_emg, mode="target")

    assert res["status"] == "not_calibrated", f"Expected not_calibrated, got {res}"
    assert res["mode"] == "target"
    assert res["predicted_text"] == ""
    assert "not calibrated" in res["message"].lower()
    print("  [PASS] Test 19C: Missing Target Checkpoint Handling")


def test_19d_one_channel_bioamp_native_preprocessing_without_fabrication():
    """Test D: Physical 1-channel BioAmp acquisition extracts 14-dim features natively and returns status 'not_trained' when no trained 1-channel model checkpoint exists."""
    from record_utility import extract_1channel_features
    physical_bioamp_1ch = np.random.randn(1000, 1).astype(np.float32)

    # Verify 1-channel feature extractor yields (num_frames, 14)
    feats_14 = extract_1channel_features(physical_bioamp_1ch)
    assert feats_14.shape == (98, 14), f"Expected shape (98, 14), got {feats_14.shape}"

    # Verify inference service returns status='not_trained' without channel fabrication
    res = run_emg_inference(physical_bioamp_1ch, mode="target")
    assert res["status"] == "not_trained", f"Expected not_trained, got {res}"
    assert res["channel_count"] == 1, f"Expected channel_count 1, got {res.get('channel_count')}"
    assert res["predicted_text"] == "", f"Expected empty predicted_text, got '{res.get('predicted_text')}'"
    assert res["intent"] == "Untrained 1-Channel Model", f"Expected 'Untrained 1-Channel Model', got '{res.get('intent')}'"
    assert res["architecture_ready"] is True
    assert res["preprocessing_ready"] is True
    assert res["model_training_required"] is True
    assert res["feature_shape"] == [98, 14]

    # Verify 1D vector input (T,) is supported
    physical_1d = np.random.randn(1000).astype(np.float32)
    res_1d = run_emg_inference(physical_1d, mode="target")
    assert res_1d["status"] == "not_trained"
    assert res_1d["channel_count"] == 1
    assert res_1d["feature_shape"] == [98, 14]
    print("  [PASS] Test 19D: One-Channel BioAmp Native Preprocessing & 'not_trained' Status")


def test_19e_8channel_input_reaches_real_pytorch_model():
    """Test E: 8-channel input reaches the real PyTorch model and executes full forward pass."""
    raw_8ch = np.random.randn(1500, 8).astype(np.float32)
    res = run_emg_inference(raw_8ch, mode="benchmark")

    assert res["status"] == "success", f"Expected success, got {res}"
    assert isinstance(res["predicted_text"], str)
    assert res["feature_shape"] == [148, 112]
    print("  [PASS] Test 19E: 8-Channel Input Reaching Real PyTorch Model")


def test_19f_invalid_mode_handling():
    """Test F: Invalid mode parameter handling."""
    valid_8ch = np.random.randn(1000, 8).astype(np.float32)
    res = run_emg_inference(valid_8ch, mode="unknown_mode")

    assert res["status"] == "error", f"Expected error, got {res}"
    assert res["error_code"] == "INVALID_MODE"
    print("  [PASS] Test 19F: Invalid Mode Handling")


def run_all_tests():
    print("==================================================")
    print(" VOICEBACK FIX #5 — AUTOMATED VERIFICATION SUITE  ")
    print("==================================================")
    test_19a_missing_input()
    test_19b_valid_checkpoint_resolution()
    test_19c_missing_target_checkpoint_handling()
    test_19d_one_channel_bioamp_native_preprocessing_without_fabrication()
    test_19e_8channel_input_reaches_real_pytorch_model()
    test_19f_invalid_mode_handling()
    print("==================================================")
    print(" ALL 6 VERIFICATION TESTS PASSED SUCCESSFULLY!    ")
    print("==================================================")


if __name__ == "__main__":
    run_all_tests()
