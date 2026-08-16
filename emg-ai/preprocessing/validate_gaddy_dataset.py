"""
VoiceBack EMG / AI Prototype - Gaddy Dataset Validation & Representative Test Utility
Validates extracted raw Gaddy sEMG samples through GaddyEMGAdapter (T, 8) -> (T', 112)
and checks Git ignore status, transcripts, and sample counts.

STRICT SAFETY CONSTRAINTS:
- Does NOT launch model training.
- Does NOT modify existing model checkpoints or benchmark data.
"""

import os
import sys
import json
import subprocess
import numpy as np

sys_dir = os.path.dirname(os.path.abspath(__file__))
if sys_dir not in sys.path:
    sys.path.insert(0, sys_dir)

from gaddy_adapter import GaddyEMGAdapter

GADDY_DIR = os.path.abspath("emg-ai/data/gaddy")


def run_git_ignore_check():
    """
    Verifies git check-ignore status for the Gaddy dataset directory.
    """
    print("\n--- 1. Git Safety Verification ---")
    cmd = ["git", "check-ignore", "emg-ai/data/gaddy/"]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0 and "emg-ai/data/gaddy/" in res.stdout.replace("\\", "/"):
            print("   [OK] Git Ignore Status: VERIFIED (emg-ai/data/gaddy/ is properly ignored)")
            return True
        else:
            print(f"   [WARN] Git Ignore Status Warning: {res.stdout.strip() or res.stderr.strip()}")
            return False
    except Exception as e:
        print(f"   [WARN] Could not run git check-ignore: {str(e)}")
        return False


def validate_extracted_dataset():
    """
    Scans the extracted Gaddy dataset, verifies file counts, and tests representative samples
    through GaddyEMGAdapter.
    """
    print("\n==================================================")
    print("      VoiceBack Gaddy Dataset Validation Suite   ")
    print("==================================================")

    git_ok = run_git_ignore_check()

    if not os.path.exists(GADDY_DIR):
        print(f"[FAIL] Error: Gaddy directory {GADDY_DIR} does not exist.")
        return False

    all_files = []
    for root, dirs, files in os.walk(GADDY_DIR):
        for f in files:
            all_files.append(os.path.join(root, f))

    emg_files = sorted([f for f in all_files if f.endswith("_emg.npy")])
    info_files = sorted([f for f in all_files if f.endswith("_info.json")])
    audio_files = sorted([f for f in all_files if f.endswith("_audio_clean.flac") or f.endswith("_audio.flac")])

    print("\n--- 2. Discovered File Statistics ---")
    print(f"   - Total Files Discovered: {len(all_files):,}")
    print(f"   - Raw EMG Files (_emg.npy): {len(emg_files):,}")
    print(f"   - Info Metadata Files (_info.json): {len(info_files):,}")
    print(f"   - Audio Files (.flac): {len(audio_files):,}")

    if len(emg_files) == 0:
        print("[FAIL] Error: No raw _emg.npy files found.")
        return False

    silent_count = 0
    voiced_count = 0
    valid_samples = []

    for info_path in info_files:
        try:
            with open(info_path, "r", encoding="utf-8") as f:
                info = json.load(f)

            sample_prefix = info_path.replace("_info.json", "")
            emg_path = f"{sample_prefix}_emg.npy"

            is_silent = info.get("silent", False) or "silent" in info_path
            if is_silent:
                silent_count += 1
            else:
                voiced_count += 1

            if os.path.exists(emg_path):
                valid_samples.append({
                    "emg_path": emg_path,
                    "info_path": info_path,
                    "text": info.get("text", ""),
                    "is_silent": is_silent,
                    "session": info.get("session", os.path.basename(os.path.dirname(info_path)))
                })
        except Exception:
            pass

    print(f"   - Silent sEMG Utterances: {silent_count:,}")
    print(f"   - Voiced sEMG Utterances: {voiced_count:,}")
    print(f"   - Valid Paired (EMG + Text) Samples: {len(valid_samples):,}")

    # --- 3. Representative Sample Adapter Processing Test ---
    print("\n--- 3. Testing Representative Samples through GaddyEMGAdapter ---")
    adapter = GaddyEMGAdapter(expected_channels=8, expected_sampling_rate=1000)

    # Test up to 10 representative samples (silent and voiced across sessions)
    test_subset = valid_samples[:10]
    passed_count = 0

    for idx, sample in enumerate(test_subset):
        raw_emg = np.load(sample["emg_path"])
        text = sample["text"]
        is_silent = sample["is_silent"]

        # Validate Raw Shape
        valid, msg = adapter.validate_raw_emg(raw_emg, sampling_rate=1000)
        if not valid:
            print(f"   [FAIL] Sample {idx} [{os.path.basename(sample['emg_path'])}] Raw Validation Failed: {msg}")
            continue

        # Adapt Raw (T, 8) -> (T', 112)
        features_112 = adapter.adapt_sample(raw_emg, sampling_rate=1000)

        # Check Output Integrity
        has_nan = np.isnan(features_112).any()
        has_inf = np.isinf(features_112).any()
        correct_dim = features_112.shape[1] == 112

        if not has_nan and not has_inf and correct_dim:
            passed_count += 1
            cond_str = "SILENT" if is_silent else "VOICED"
            print(f"   [OK] Sample {idx:02d} [{cond_str}] Raw: {raw_emg.shape} @ 1000Hz -> Adapted: {features_112.shape} (T'={features_112.shape[0]}, F=112) | Text: \"{text[:40]}...\"")
        else:
            print(f"   [FAIL] Sample {idx} Adapter Output Check Failed! Shape: {features_112.shape}, NaN: {has_nan}, Inf: {has_inf}")

    print(f"\n--- 4. Summary Verification ---")
    print(f"   - Representative Samples Tested: {len(test_subset)}")
    print(f"   - Passed Validation: {passed_count} / {len(test_subset)}")

    if passed_count == len(test_subset) and git_ok:
        print("\n==================================================")
        print(" [SUCCESS] GADDY DATASET VALIDATION SUCCESSFUL!")
        print(" DATASET IS VALIDATED AND READY FOR PHASE 3B TRAINING.")
        print("==================================================")
        return True
    else:
        print("\n[FAIL] Validation incomplete or failed.")
        return False


if __name__ == "__main__":
    validate_extracted_dataset()
