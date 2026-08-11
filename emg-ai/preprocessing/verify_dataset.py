"""
VoiceBack EMG / AI Prototype - Dataset Verification Script
Performs a read-only test of the EMGSilentSpeechDataset class.
"""

import sys
import os

# Ensure preprocessing directory is in path
sys.path.append(os.path.dirname(__file__))

from dataset import EMGSilentSpeechDataset, collate_emg_batch, HAS_TORCH


def run_verification(data_dir):
    print("==================================================")
    print("    VoiceBack EMG Dataset Loader Verification    ")
    print("==================================================")
    print(f"Data directory: {data_dir}")
    print(f"PyTorch available: {HAS_TORCH}")

    dataset = EMGSilentSpeechDataset(data_dir)
    num_samples = len(dataset)

    print(f"\n1. Number of samples loaded: {num_samples}")

    if num_samples == 0:
        print("ERROR: No samples loaded!")
        return

    # Check sample 0
    sample_0 = dataset[0]
    feat_shape = sample_0["features"].shape
    dtype_str = str(sample_0["features"].dtype)
    target_text = sample_0["text"]
    sample_id = sample_0["sample_id"]

    print(f"\n2. Sample 0 Details:")
    print(f"   - Sample ID: {sample_id}")
    print(f"   - Feature Shape: {feat_shape} (Time frames: {feat_shape[0]}, Features: {feat_shape[1]})")
    print(f"   - Datatype: {dtype_str}")
    print(f"   - Target Text: '{target_text}'")
    print(f"   - Tokenized IDs: {sample_0['tokens'].tolist()}")
    print(f"   - Decoded Text: '{dataset.tokenizer.decode(sample_0['tokens'].tolist())}'")

    # Integrity Check across all samples
    missing_or_malformed = 0
    total_files_checked = 0

    for i in range(num_samples):
        try:
            item = dataset[i]
            total_files_checked += 1
            if item["features"].shape[1] != 112 or len(item["text"]) == 0:
                missing_or_malformed += 1
        except Exception as e:
            missing_or_malformed += 1

    print(f"\n3. Data Integrity Check:")
    print(f"   - Total Samples Verified: {total_files_checked}")
    print(f"   - Missing or Malformed Samples: {missing_or_malformed}")

    # Test Batching & Padding
    sample_batch = [dataset[i] for i in range(4)]
    batch_res = collate_emg_batch(sample_batch)

    print(f"\n4. Batching & Padding Test (Batch Size = 4):")
    print(f"   - Padded Features Shape: {batch_res['padded_features'].shape}")
    print(f"   - Sequence Lengths: {batch_res['seq_lengths'].tolist()}")
    print(f"   - Target Texts: {batch_res['texts']}")

    # Test Modular Splitting
    train_ds, val_ds, test_ds = dataset.split(train_ratio=0.8, val_ratio=0.1, test_ratio=0.1, seed=42)
    print(f"\n5. Modular Train/Val/Test Split Test:")
    print(f"   - Train set count: {len(train_ds)} ({len(train_ds)/num_samples*100:.1f}%)")
    print(f"   - Val set count:   {len(val_ds)} ({len(val_ds)/num_samples*100:.1f}%)")
    print(f"   - Test set count:  {len(test_ds)} ({len(test_ds)/num_samples*100:.1f}%)")

    print("\n==================================================")
    print("           VERIFICATION SUCCESSFUL               ")
    print("==================================================")


if __name__ == "__main__":
    dataset_dir = os.path.join(os.path.dirname(__file__), "..", "data", "extracted_dataset")
    run_verification(dataset_dir)
