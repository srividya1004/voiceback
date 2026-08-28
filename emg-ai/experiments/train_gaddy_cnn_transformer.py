"""
VoiceBack EMG / AI Prototype - Gaddy CNN + Transformer Training & Evaluation Script
Trains the 335.1K-parameter CNN + Transformer model (EMGCNNTransformerModel)
on 1,789 verified Gaddy silent-speech training samples, validates across 200 validation samples,
and evaluates performance on the 99 held-out Gaddy test samples.

STRICT PROTOCOL SAFETY CONSTRAINTS:
- Does NOT alter or redesign EMGCNNTransformerModel architecture.
- Does NOT overwrite baseline checkpoint (models/best_baseline.pt).
- Saves best checkpoint to models/checkpoints/gaddy_cnn_transformer_best.pt.
- Runs mandatory pre-training safety assertions before launching full training.
- Uses adaptive length-bucketed batching to guarantee CPU memory stability.
"""

import sys
import os
import random
import time
import json
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "preprocessing")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models")))

from gaddy_dataset import GaddySilentSpeechDataset, collate_gaddy_batch
from cnn_transformer_model import EMGCNNTransformerModel
from features import EMGFeatureScaler
from metrics import ctc_greedy_decode, calculate_cer, calculate_wer


class GaddyTrainingConfig:
    """Configuration dataclass for Gaddy CNN + Transformer training."""

    def __init__(self):
        self.experiment_name = "gaddy_cnn_transformer_silent_speech"
        self.gaddy_dir = os.path.abspath("emg-ai/data/gaddy/emg_data")
        self.split_file = os.path.abspath("emg-ai/data/gaddy/testset_largedev.json")

        self.seed = 42
        self.batch_size = 16
        self.epochs = 15
        self.learning_rate = 1e-3
        self.weight_decay = 1e-5
        self.grad_clip = 5.0
        self.max_frame_cap = 1800  # Cap sequence length at ~18s of speech for memory safety

        self.checkpoint_dir = os.path.abspath("emg-ai/models/checkpoints")
        self.checkpoint_path = os.path.join(self.checkpoint_dir, "gaddy_cnn_transformer_best.pt")
        self.scaler_path = os.path.join(self.checkpoint_dir, "gaddy_feature_scaler.json")


def create_length_bucketed_batches(dataset, base_batch_size=16, shuffle=True):
    """
    Creates length-bucketed batches of dataset indices.
    Groups similar-length samples into batches and adaptively scales batch size
    to keep Transformer autograd memory bounded under 200 MB per step.
    """
    indices = list(range(len(dataset)))
    indices.sort(key=lambda i: dataset[i]["seq_len"])

    raw_buckets = []
    i = 0
    while i < len(indices):
        bucket = indices[i:i + base_batch_size]
        max_len = max(dataset[idx]["seq_len"] for idx in bucket)

        if max_len > 1200:
            actual_size = 4 if max_len > 1800 else 8
            bucket = indices[i:i + actual_size]

        raw_buckets.append(bucket)
        i += len(bucket)

    if shuffle:
        random.shuffle(raw_buckets)

    return raw_buckets


def prepare_batch_items(dataset, batch_indices, max_frame_cap=1800):
    """Prepares batch items, enforcing max frame length capping for extreme sequence outliers."""
    batch_items = []
    for idx in batch_indices:
        item = dataset[idx]
        if item["seq_len"] > max_frame_cap:
            cropped_item = dict(item)
            cropped_item["features"] = item["features"][:max_frame_cap, :]
            cropped_item["features_tensor"] = torch.from_numpy(cropped_item["features"])
            cropped_item["seq_len"] = max_frame_cap
            batch_items.append(cropped_item)
        else:
            batch_items.append(item)
    return batch_items


def run_pretraining_checks(config, train_ds, val_ds, test_ds):
    """
    Executes mandatory pre-training safety checks:
    1. Verify dataset split counts.
    2. Verify zero data leakage between splits.
    3. Verify class/token vocabulary.
    4. Verify maximum target length and input lengths.
    5. Verify CTC shape constraints (T_input >= L_target).
    6. Run a tiny smoke-test batch.
    7. Confirm forward pass and CTCLoss are finite.
    """
    print("==================================================")
    print("   PHASE 3B-2: PRE-TRAINING SAFETY VERIFICATION   ")
    print("==================================================")

    # 1. Split Counts Verification
    n_train = len(train_ds)
    n_val = len(val_ds)
    n_test = len(test_ds)
    print(f"1. Dataset Split Counts:")
    print(f"   - Training Split:   {n_train} samples (Expected: 1,789)")
    print(f"   - Validation Split: {n_val} samples (Expected: 200)")
    print(f"   - Test Split:       {n_test} samples (Expected: 99)")
    print(f"   - Total Samples:    {n_train + n_val + n_test} samples")
    assert n_train == 1789, f"Train count mismatch! Expected 1,789, got {n_train}"
    assert n_val == 200, f"Val count mismatch! Expected 200, got {n_val}"
    assert n_test == 99, f"Test count mismatch! Expected 99, got {n_test}"
    print("   [PASS] Split counts verified.")

    # 2. Data Leakage Verification
    train_keys = set((s["book"], s["sentence_index"]) for s in train_ds.samples)
    val_keys = set((s["book"], s["sentence_index"]) for s in val_ds.samples)
    test_keys = set((s["book"], s["sentence_index"]) for s in test_ds.samples)

    tv_inter = len(train_keys.intersection(val_keys))
    tt_inter = len(train_keys.intersection(test_keys))
    vt_inter = len(val_keys.intersection(test_keys))

    print(f"\n2. Data Leakage Check:")
    print(f"   - Train & Val Intersection:  {tv_inter}")
    print(f"   - Train & Test Intersection: {tt_inter}")
    print(f"   - Val & Test Intersection:   {vt_inter}")
    assert tv_inter == 0 and tt_inter == 0 and vt_inter == 0, "Data leakage detected between splits!"
    print("   [PASS] Zero data leakage verified across splits.")

    # 3. Vocabulary Verification
    tokenizer = train_ds.tokenizer
    vocab_size = tokenizer.vocab_size()
    print(f"\n3. Token Vocabulary Verification:")
    print(f"   - Vocabulary Size: {vocab_size} character tokens")
    assert vocab_size == 79, f"Vocabulary size mismatch! Expected 79, got {vocab_size}"
    print("   [PASS] Character token vocabulary verified.")

    # 4 & 5. Input/Target Lengths & CTC Constraints
    ctc_violations = 0
    all_cached_feats = train_ds.cached_features + val_ds.cached_features + test_ds.cached_features
    all_cached_toks = train_ds.cached_tokens + val_ds.cached_tokens + test_ds.cached_tokens

    input_lens = [f.shape[0] for f in all_cached_feats]
    target_lens = [len(t) for t in all_cached_toks]

    for t_in, t_tgt in zip(input_lens, target_lens):
        if t_in < t_tgt:
            ctc_violations += 1

    print(f"\n4. Sequence Length & CTC Constraint Verification:")
    print(f"   - Input Frames (T') Range:  [{min(input_lens)}, {max(input_lens)}] (Mean: {np.mean(input_lens):.1f})")
    print(f"   - Target Tokens (L) Range:  [{min(target_lens)}, {max(target_lens)}] (Mean: {np.mean(target_lens):.1f})")
    print(f"   - CTC Violations (T_in < L_target): {ctc_violations}")
    assert ctc_violations == 0, f"Detected {ctc_violations} CTC length violations!"
    print("   [PASS] CTC shape constraints satisfied for all samples.")

    # 6 & 7. Smoke-Test Batch & CTCLoss Verification
    device = torch.device("cpu")
    model = EMGCNNTransformerModel(
        in_features=112,
        conv_channels=128,
        d_model=128,
        nhead=4,
        num_encoder_layers=2,
        dim_feedforward=256,
        num_classes=vocab_size,
        dropout=0.1
    ).to(device)

    criterion = nn.CTCLoss(blank=0, zero_infinity=True)

    smoke_batch = prepare_batch_items(train_ds, [0, 1, 2, 3], max_frame_cap=config.max_frame_cap)
    smoke_dict = collate_gaddy_batch(smoke_batch)

    feats_tensor = smoke_dict["features_tensor"].to(device)       # (B, T, 112)
    seq_lengths = smoke_dict["seq_lengths_tensor"].to(device)     # (B,)
    tokens_tensor = smoke_dict["tokens_tensor"].to(device)         # (B, L)
    text_lengths = smoke_dict["text_lengths_tensor"].to(device)   # (B,)

    log_probs = model(feats_tensor)                             # (B, T, 79)
    log_probs_ctc = log_probs.permute(1, 0, 2)                 # (T, B, 79)

    smoke_loss = criterion(log_probs_ctc, tokens_tensor, seq_lengths, text_lengths)

    is_finite = not torch.isnan(smoke_loss) and not torch.isinf(smoke_loss)
    print(f"\n5. Smoke-Test Batch Execution:")
    print(f"   - Forward Pass Logits Output Shape: {log_probs.shape} (B=4, T={log_probs.shape[1]}, C={vocab_size})")
    print(f"   - Smoke-Test CTCLoss Value:         {smoke_loss.item():.4f}")
    print(f"   - CTCLoss Finite Check:             {is_finite}")
    assert is_finite, "Smoke-test CTCLoss is NaN or Inf!"
    print("   [PASS] Smoke-test forward pass and CTCLoss verified.")

    print("\n==================================================")
    print(" ALL PRE-TRAINING CHECKS PASSED SUCCESSFULLY! ")
    print(" READY TO LAUNCH FULL MODEL TRAINING.            ")
    print("==================================================")
    return True


def evaluate(model, dataset, tokenizer, criterion, device, batch_size=16, max_frame_cap=1800):
    """Evaluate model on a dataset split and return average loss, CER, WER, and predictions."""
    model.eval()
    total_loss = 0.0
    total_batches = 0
    cer_list = []
    wer_list = []
    predictions = []

    eval_batches = create_length_bucketed_batches(dataset, base_batch_size=batch_size, shuffle=False)

    with torch.no_grad():
        for batch_indices in eval_batches:
            batch_items = prepare_batch_items(dataset, batch_indices, max_frame_cap=max_frame_cap)
            batch_dict = collate_gaddy_batch(batch_items)

            feats_tensor = batch_dict["features_tensor"].to(device)
            seq_lengths = batch_dict["seq_lengths_tensor"].to(device)
            tokens_tensor = batch_dict["tokens_tensor"].to(device)
            text_lengths = batch_dict["text_lengths_tensor"].to(device)

            log_probs = model(feats_tensor) # (B, T, C)
            log_probs_ctc = log_probs.permute(1, 0, 2)

            loss = criterion(log_probs_ctc, tokens_tensor, seq_lengths, text_lengths)
            if not torch.isnan(loss) and not torch.isinf(loss):
                total_loss += loss.item()
                total_batches += 1

            decoded_texts = ctc_greedy_decode(log_probs, tokenizer, blank_id=0)

            for ref_text, hyp_text in zip(batch_dict["texts"], decoded_texts):
                cer = calculate_cer(ref_text, hyp_text)
                wer = calculate_wer(ref_text, hyp_text)
                cer_list.append(cer)
                wer_list.append(wer)
                predictions.append((ref_text, hyp_text, cer, wer))

    avg_loss = total_loss / max(1, total_batches)
    avg_cer = float(np.mean(cer_list))
    avg_wer = float(np.mean(wer_list))

    return avg_loss, avg_cer, avg_wer, predictions


def run_gaddy_training_pipeline():
    config = GaddyTrainingConfig()

    # Reproducibility seeds
    random.seed(config.seed)
    np.random.seed(config.seed)
    torch.manual_seed(config.seed)

    print("==================================================")
    print(" VoiceBack Phase 3B-2: Gaddy Silent-Speech Training")
    print("==================================================")
    print(f"Target Checkpoint: {config.checkpoint_path}")
    print("--------------------------------------------------")

    # 1. Load Dataset Splits
    print("\n1. Initializing and Pre-caching Gaddy Silent Speech Splits:")
    train_ds = GaddySilentSpeechDataset(
        gaddy_data_dir=config.gaddy_dir,
        split_file_path=config.split_file,
        split="train",
        verbose=True
    )
    val_ds = GaddySilentSpeechDataset(
        gaddy_data_dir=config.gaddy_dir,
        split_file_path=config.split_file,
        split="val",
        tokenizer=train_ds.tokenizer,
        verbose=True
    )
    test_ds = GaddySilentSpeechDataset(
        gaddy_data_dir=config.gaddy_dir,
        split_file_path=config.split_file,
        split="test",
        tokenizer=train_ds.tokenizer,
        verbose=True
    )

    # 2. Fit EMGFeatureScaler on Train Split and Scale All Splits
    scaler = EMGFeatureScaler()
    all_train_feats = np.concatenate(train_ds.cached_features, axis=0) # (Total_frames, 112)
    scaler.mean = np.mean(all_train_feats, axis=0)
    scaler.std = np.std(all_train_feats, axis=0) + 1e-8
    scaler.is_fitted = True

    train_ds.apply_scaler(scaler)
    val_ds.apply_scaler(scaler)
    test_ds.apply_scaler(scaler)

    os.makedirs(config.checkpoint_dir, exist_ok=True)
    scaler.save(config.scaler_path)
    print(f"\n2. EMG Feature Preprocessing:")
    print(f"   - Feature scaler fitted on {len(train_ds)} training samples and saved to {config.scaler_path}")

    # 3. Execute Pre-Training Safety Assertions
    run_pretraining_checks(config, train_ds, val_ds, test_ds)

    # 4. Instantiate Model, Loss, Optimizer
    device = torch.device("cpu")
    tokenizer = train_ds.tokenizer
    vocab_size = tokenizer.vocab_size()

    model = EMGCNNTransformerModel(
        in_features=112,
        conv_channels=128,
        d_model=128,
        nhead=4,
        num_encoder_layers=2,
        dim_feedforward=256,
        num_classes=vocab_size,
        dropout=0.1
    ).to(device)

    criterion = nn.CTCLoss(blank=0, zero_infinity=True)
    optimizer = optim.Adam(model.parameters(), lr=config.learning_rate, weight_decay=config.weight_decay)

    param_count = model.count_parameters()

    print(f"\n3. Model & Optimizer Setup:")
    print(f"   - Model Architecture:          1D Conv1D (128) + Sinusoidal PosEncoding + 2-Layer Transformer Encoder (4 heads, d_ff=256) + Linear Head")
    print(f"   - Parameter Count:             {param_count:,} parameters")
    print(f"   - Output Token Classes:        {vocab_size} character tokens")
    print(f"   - Training Device:             {device}")
    print(f"   - Base Batch Size:             {config.batch_size} (Length-Bucketed)")
    print(f"   - Max Frame Length Cap:        {config.max_frame_cap} frames")
    print(f"   - Learning Rate:               {config.learning_rate}")
    print(f"   - Weight Decay:                {config.weight_decay}")
    print(f"   - Gradient Clipping:           {config.grad_clip}")
    print(f"   - Epochs:                      {config.epochs}")
    print(f"   - Estimated Duration:          ~25-30 minutes on CPU (Length-Bucketed)")

    # 5. Pre-Training Initial State Evaluation
    print(f"\n4. Evaluating Initial (Pre-Training) Model State:")
    init_val_loss, init_cer, init_wer, init_preds = evaluate(
        model, val_ds, tokenizer, criterion, device, batch_size=config.batch_size, max_frame_cap=config.max_frame_cap
    )
    print(f"   - Initial Val Loss: {init_val_loss:.4f}")
    print(f"   - Initial Val CER:  {init_cer * 100:.2f}%")
    print(f"   - Initial Val WER:  {init_wer * 100:.2f}%")

    # 6. Epoch-by-Epoch Training Loop
    print(f"\n5. Starting Training Execution ({config.epochs} Epochs):")
    print("-----------------------------------------------------------------------------------------")
    print(f"{'Epoch':<8} | {'Train Loss':<12} | {'Val Loss':<12} | {'Val CER (%)':<14} | {'Val WER (%)':<14} | {'Checkpoint'}")
    print("-----------------------------------------------------------------------------------------")

    best_val_loss = float("inf")
    start_time = time.time()

    for epoch in range(1, config.epochs + 1):
        model.train()
        train_batches = create_length_bucketed_batches(train_ds, base_batch_size=config.batch_size, shuffle=True)

        epoch_train_loss = 0.0
        successful_batches = 0
        ep_t0 = time.time()

        for batch_indices in train_batches:
            batch_items = prepare_batch_items(train_ds, batch_indices, max_frame_cap=config.max_frame_cap)
            batch_dict = collate_gaddy_batch(batch_items)

            feats_tensor = batch_dict["features_tensor"].to(device)
            seq_lengths = batch_dict["seq_lengths_tensor"].to(device)
            tokens_tensor = batch_dict["tokens_tensor"].to(device)
            text_lengths = batch_dict["text_lengths_tensor"].to(device)

            optimizer.zero_grad()
            log_probs = model(feats_tensor)
            log_probs_ctc = log_probs.permute(1, 0, 2)

            loss = criterion(log_probs_ctc, tokens_tensor, seq_lengths, text_lengths)

            if not torch.isnan(loss) and not torch.isinf(loss):
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), config.grad_clip)
                optimizer.step()
                epoch_train_loss += loss.item()
                successful_batches += 1

        avg_train_loss = epoch_train_loss / max(1, successful_batches)

        # Epoch Validation Evaluation
        val_loss, val_cer, val_wer, _ = evaluate(
            model, val_ds, tokenizer, criterion, device, batch_size=config.batch_size, max_frame_cap=config.max_frame_cap
        )

        saved_ckpt = False
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), config.checkpoint_path)
            saved_ckpt = True

        ep_elapsed = time.time() - ep_t0
        ckpt_str = "[SAVED BEST]" if saved_ckpt else ""
        print(f"Epoch {epoch:02d}/{config.epochs:02d} | {avg_train_loss:<12.4f} | {val_loss:<12.4f} | {val_cer * 100:<14.2f} | {val_wer * 100:<14.2f} | {ckpt_str} ({ep_elapsed:.1f}s)", flush=True)

    total_elapsed = time.time() - start_time
    print("-----------------------------------------------------------------------------------------")
    print(f"Training completed in {total_elapsed / 60:.2f} minutes ({total_elapsed:.1f} seconds).")

    # 7. Post-Training Held-Out Test Split Evaluation
    print(f"\n6. Loading Best Model Checkpoint from {config.checkpoint_path}:")
    model.load_state_dict(torch.load(config.checkpoint_path))

    test_loss, test_cer, test_wer, test_preds = evaluate(
        model, test_ds, tokenizer, criterion, device, batch_size=config.batch_size, max_frame_cap=config.max_frame_cap
    )

    print("\n==================================================")
    print("   HELD-OUT GADDY TEST SPLIT EVALUATION RESULTS   ")
    print("==================================================")
    print(f"Evaluated Test Samples: {len(test_ds)}")
    print(f"Test Loss:             {test_loss:.4f}")
    print(f"Test CER:              {test_cer * 100:.2f}%")
    print(f"Test WER:              {test_wer * 100:.2f}%")
    print("--------------------------------------------------")

    print("\nActual Expected vs Predicted Transcripts (Held-Out Test Set):")
    for idx, (ref, hyp, cer, wer) in enumerate(test_preds[:5]):
        print(f"\n[{idx + 1}] Reference:  \"{ref}\"")
        print(f"    Predicted:  \"{hyp}\"")
        print(f"    CER: {cer * 100:.1f}%, WER: {wer * 100:.1f}%")

    print("\n==================================================")
    print("   IMPORTANT CLINICAL LIMITATION NOTICE           ")
    print("==================================================")
    print("The trained model is a GENERAL SILENT-SPEECH MODEL trained on Gaddy healthy-speaker sEMG data.")
    print("It is NOT an aphasia-trained or clinically validated patient model.")
    print("Patient-specific calibration and fine-tuning is required in future phases after authorized clinical EMG data is acquired.")
    print("==================================================")

    # Summary Report Dict for Programmatic Verification
    results_summary = {
        "training_completed": True,
        "best_val_loss": best_val_loss,
        "test_cer": test_cer,
        "test_wer": test_wer,
        "test_loss": test_loss,
        "checkpoint_path": config.checkpoint_path,
        "evaluated_test_samples": len(test_ds),
        "total_elapsed_seconds": total_elapsed,
        "sample_predictions": test_preds[:5]
    }

    summary_json_path = os.path.join(config.checkpoint_dir, "gaddy_training_summary.json")
    with open(summary_json_path, "w", encoding="utf-8") as f:
        json.dump(results_summary, f, indent=2)

    return results_summary


if __name__ == "__main__":
    run_gaddy_training_pipeline()
