"""
VoiceBack EMG / AI Prototype - Target Dataset Validation Script
Validates patient-specific sEMG target datasets for sample count, signal integrity,
feature dimensions, phrase labels, participant IDs, and repetition coverage.
"""

import os
import json
import numpy as np


TARGET_PROTOTYPE_PHRASES = [
    "I need water",
    "I am hungry",
    "I need medicine",
    "I have pain",
    "I need the toilet",
    "I am tired",
    "Yes",
    "No",
    "I need help",
    "Thank you"
]


def validate_target_dataset(data_dir="emg-ai/data/extracted_dataset", expected_reps_per_phrase=15):
    print("==================================================")
    print("  VoiceBack Target EMG Dataset Validation Suite   ")
    print("==================================================")
    print(f"Target Data Directory: {data_dir}")
    print(f"Target Phrases Count:  {len(TARGET_PROTOTYPE_PHRASES)}")
    print(f"Expected Reps/Phrase:  {expected_reps_per_phrase}")
    print(f"Total Expected:        {len(TARGET_PROTOTYPE_PHRASES) * expected_reps_per_phrase} samples\n")

    if not os.path.exists(data_dir):
        print(f"STATUS: Target dataset directory '{data_dir}' does not exist yet.")
        print("Required for future real EMG recording session.")
        return False

    all_files = os.listdir(data_dir)
    json_files = sorted([f for f in all_files if f.endswith(".json")])

    valid_samples = 0
    corrupt_samples = 0
    phrase_rep_counts = {p: 0 for p in TARGET_PROTOTYPE_PHRASES}
    participant_ids = set()

    for jf in json_files:
        json_path = os.path.join(data_dir, jf)
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                meta = json.load(f)

            sample_id = meta.get("sample_id", jf.replace(".json", ""))
            phrase = meta.get("phrase") or meta.get("text", "")
            pid = meta.get("participant_id", "unknown")
            condition = meta.get("condition", "silent")

            participant_ids.add(pid)

            # Check feature file
            silent_path = os.path.join(data_dir, f"{sample_id}_silent.npy")
            if not os.path.exists(silent_path):
                # Fallback check standard npy
                silent_path = os.path.join(data_dir, f"{sample_id}.npy")

            if not os.path.exists(silent_path):
                corrupt_samples += 1
                continue

            feats = np.load(silent_path)

            # Integrity checks
            if len(feats.shape) != 2 or feats.shape[1] != 112:
                corrupt_samples += 1
                continue

            if np.isnan(feats).any() or np.isinf(feats).any():
                corrupt_samples += 1
                continue

            if phrase in phrase_rep_counts:
                phrase_rep_counts[phrase] += 1

            valid_samples += 1

        except Exception as e:
            corrupt_samples += 1

    print(f"Validation Audit Results:")
    print(f"  - Total Metadata JSON Files: {len(json_files)}")
    print(f"  - Valid sEMG Samples (T, 112): {valid_samples}")
    print(f"  - Corrupt or Invalid Samples: {corrupt_samples}")
    print(f"  - Participants Identified:   {list(participant_ids) if participant_ids else 'None'}\n")

    print("Phrase Repetition Coverage Audit:")
    all_target_phrases_satisfied = True
    for phrase in TARGET_PROTOTYPE_PHRASES:
        count = phrase_rep_counts[phrase]
        status_str = "[COMPLETE]" if count >= expected_reps_per_phrase else f"[INCOMPLETE: {count}/{expected_reps_per_phrase}]"
        if count < expected_reps_per_phrase:
            all_target_phrases_satisfied = False
        print(f"  - '{phrase}': {count} reps {status_str}")

    print("\n==================================================")
    if valid_samples >= len(TARGET_PROTOTYPE_PHRASES) * expected_reps_per_phrase and all_target_phrases_satisfied:
        print("  DATASET VALIDATION PASSED: 100% READY FOR TRAINING")
    else:
        print(f"  DATASET INCOMPLETE: Found {valid_samples}/{len(TARGET_PROTOTYPE_PHRASES) * expected_reps_per_phrase} target samples.")
        print("  Standing by for real EMG hardware recordings.")
    print("==================================================")

    return all_target_phrases_satisfied


if __name__ == "__main__":
    validate_target_dataset()
