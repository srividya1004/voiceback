"""
VoiceBack EMG / AI Prototype - End-to-End Pipeline Evaluation Runner
Connects Dataset, Feature Scaler, Baseline Model, and CTC Decoder to evaluate
signal flow and baseline predictions on the 50-sample validation split.
"""

import sys
import os
import numpy as np

# Ensure preprocessing and models directories are in path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "preprocessing"))
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "models"))

import baseline_model
from dataset import EMGSilentSpeechDataset, collate_emg_batch
from features import EMGFeatureScaler, pad_and_mask_sequences
from metrics import ctc_greedy_decode, calculate_cer, calculate_wer

HAS_TORCH = baseline_model.HAS_TORCH



def run_pipeline_evaluation(data_dir=None, seed=42):
    print("==================================================")
    print("  VoiceBack EMG End-to-End Evaluation Pipeline   ")
    print("==================================================")

    if data_dir is None:
        data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "extracted_dataset")

    # 1. Load Dataset & Create 50-Sample Validation Split
    full_dataset = EMGSilentSpeechDataset(data_dir)
    num_total = len(full_dataset)
    train_ds, val_ds, test_ds = full_dataset.split(train_ratio=0.8, val_ratio=0.1, test_ratio=0.1, seed=seed)

    print(f"\n1. Dataset & Split Setup:")
    print(f"   - Total Dataset Samples: {num_total}")
    print(f"   - Training Split:   {len(train_ds)} samples")
    print(f"   - Validation Split: {len(val_ds)} samples")
    print(f"   - Test Split:       {len(test_ds)} samples")
    print(f"   - Vocabulary Size:  {full_dataset.tokenizer.vocab_size()} tokens")

    # 2. Fit Feature Scaler on Training Split
    scaler = EMGFeatureScaler()
    scaler.fit(train_ds)

    print(f"\n2. Feature Preprocessing:")
    print(f"   - Scaler fitted on {len(train_ds)} training samples")
    print(f"   - Global Feature Mean Range: [{scaler.mean.min():.4f}, {scaler.mean.max():.4f}]")
    print(f"   - Global Feature Std Range:  [{scaler.std.min():.4f}, {scaler.std.max():.4f}]")

    # 3. Instantiate Baseline Model
    vocab_size = full_dataset.tokenizer.vocab_size()
    if HAS_TORCH:
        import torch
        model = baseline_model.EMGSilentSpeechModel(in_features=112, conv_channels=128, hidden_size=128, num_layers=2, num_classes=vocab_size)
        model.eval()
    else:
        model = baseline_model.NumPyEMGBaselineModel(in_features=112, conv_channels=128, hidden_size=128, num_layers=2, num_classes=vocab_size)


    param_count = model.count_parameters()
    print(f"\n3. Baseline Model Loaded:")
    print(f"   - Architecture: 1D Conv + 2-layer BiGRU + Linear Head")
    print(f"   - Parameter Count: {param_count:,}")
    print(f"   - Input Dimension: 112 -> Output Classes: {vocab_size}")

    # 4. Evaluate Validation Split (Batch Size = 8)
    batch_size = 8
    val_samples = [val_ds[i] for i in range(len(val_ds))]
    
    cer_scores = []
    wer_scores = []
    evaluation_pairs = []

    for i in range(0, len(val_samples), batch_size):
        batch = val_samples[i:i + batch_size]
        
        # Scale features per sample
        scaled_features = [scaler.transform(item["features"]) for item in batch]
        padded_dict = pad_and_mask_sequences(scaled_features)
        
        input_feats = padded_dict["padded_features"]  # (B, T_max, 112)
        ref_texts = [item["text"] for item in batch]

        # Model Forward Pass
        if HAS_TORCH:
            with torch.no_grad():
                feats_tensor = torch.from_numpy(input_feats)
                log_probs = model(feats_tensor)
        else:
            log_probs = model.forward(input_feats)

        # CTC Greedy Decoding
        decoded_texts = ctc_greedy_decode(log_probs, full_dataset.tokenizer, blank_id=0)

        # Calculate metrics for batch
        for ref, hyp in zip(ref_texts, decoded_texts):
            cer = calculate_cer(ref, hyp)
            wer = calculate_wer(ref, hyp)
            cer_scores.append(cer)
            wer_scores.append(wer)
            evaluation_pairs.append((ref, hyp, cer, wer))

    # 5. Summary Statistics
    avg_cer = float(np.mean(cer_scores))
    avg_wer = float(np.mean(wer_scores))

    print(f"\n4. End-to-End Validation Results (50 Samples Evaluated):")
    print(f"   - Evaluated Batches: {int(np.ceil(len(val_ds)/batch_size))}")
    print(f"   - Average Validation CER: {avg_cer:.4f} ({avg_cer * 100:.2f}%)")
    print(f"   - Average Validation WER: {avg_wer:.4f} ({avg_wer * 100:.2f}%)")

    print(f"\n5. Representative Sample Predictions (Untrained Baseline Initial State):")
    for idx, (ref, hyp, cer, wer) in enumerate(evaluation_pairs[:6]):
        print(f"   [{idx + 1}] Reference:  '{ref}'")
        print(f"       Hypothesis: '{hyp}'")
        print(f"       CER: {cer * 100:.1f}%, WER: {wer * 100:.1f}%\n")

    print("==================================================")
    print("      PIPELINE EVALUATION COMPLETED CLEANLY       ")
    print("==================================================")


if __name__ == "__main__":
    run_pipeline_evaluation()
