"""
VoiceBack EMG / AI Prototype - Baseline Training Experiment Script
Trains the 549.3K-parameter baseline 1D Conv + BiGRU sequence model using CTC loss
on 400 silent sEMG training samples and evaluates validation CER/WER across 50 validation samples.
"""

import sys
import os
import random
import time
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

# Ensure preprocessing and models directories are in path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "preprocessing"))
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "models"))

import baseline_model
from dataset import EMGSilentSpeechDataset
from features import EMGFeatureScaler, pad_and_mask_sequences
from metrics import ctc_greedy_decode, calculate_cer, calculate_wer


class TrainingConfig:
    """Configuration dataclass for baseline EMG-to-speech training."""

    def __init__(self):
        self.experiment_name = "baseline_emg_ctc"
        self.data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "extracted_dataset")

        # Dataset & Split Parameters
        self.seed = 42
        self.train_ratio = 0.8
        self.val_ratio = 0.1
        self.test_ratio = 0.1

        # Model Parameters
        self.in_features = 112
        self.conv_channels = 128
        self.hidden_size = 128
        self.num_layers = 2
        self.dropout = 0.2

        # Optimization Parameters
        self.batch_size = 16
        self.epochs = 30
        self.learning_rate = 1e-3
        self.weight_decay = 1e-5
        self.grad_clip = 5.0

        # Checkpoint directory
        self.checkpoint_dir = os.path.join(os.path.dirname(__file__), "..", "models")
        self.checkpoint_path = os.path.join(self.checkpoint_dir, "best_baseline.pt")
        self.scaler_path = os.path.join(self.checkpoint_dir, "feature_scaler.json")


def evaluate(model, dataset_split, scaler, tokenizer, criterion, device, batch_size=16):
    """Evaluate model on a dataset split and return loss, CER, WER, and predictions."""
    model.eval()
    samples = [dataset_split[i] for i in range(len(dataset_split))]

    total_loss = 0.0
    total_batches = 0
    cer_list = []
    wer_list = []
    predictions = []

    with torch.no_grad():
        for i in range(0, len(samples), batch_size):
            batch = samples[i:i + batch_size]

            # Scale features
            scaled_features = [scaler.transform(item["features"]) for item in batch]
            padded_dict = pad_and_mask_sequences(scaled_features)

            input_feats = torch.from_numpy(padded_dict["padded_features"]).to(device)  # (B, T_max, 112)
            input_lengths = torch.from_numpy(padded_dict["seq_lengths"]).to(device)   # (B,)

            # Prepare target tokens
            target_list = [item["tokens"] for item in batch]
            target_lengths = torch.tensor([len(t) for t in target_list], dtype=torch.long, device=device)

            max_target_len = max(len(t) for t in target_list)
            padded_targets = np.zeros((len(batch), max_target_len), dtype=np.int64)
            for b_idx, t_arr in enumerate(target_list):
                padded_targets[b_idx, :len(t_arr)] = t_arr
            target_tokens = torch.from_numpy(padded_targets).to(device)

            # Model Forward Pass: (B, T_max, num_classes)
            log_probs = model(input_feats)

            # Permute log_probs for PyTorch CTCLoss: (T_max, B, num_classes)
            log_probs_ctc = log_probs.permute(1, 0, 2)

            loss = criterion(log_probs_ctc, target_tokens, input_lengths, target_lengths)
            if not torch.isnan(loss) and not torch.isinf(loss):
                total_loss += loss.item()
                total_batches += 1

            # Decode Predictions
            decoded_texts = ctc_greedy_decode(log_probs, tokenizer, blank_id=0)

            for item, hyp_text in zip(batch, decoded_texts):
                ref_text = item["text"]
                cer = calculate_cer(ref_text, hyp_text)
                wer = calculate_wer(ref_text, hyp_text)
                cer_list.append(cer)
                wer_list.append(wer)
                predictions.append((ref_text, hyp_text, cer, wer))

    avg_loss = total_loss / max(1, total_batches)
    avg_cer = float(np.mean(cer_list))
    avg_wer = float(np.mean(wer_list))

    return avg_loss, avg_cer, avg_wer, predictions


def run_training_experiment():
    config = TrainingConfig()

    # Reproducibility seeds
    random.seed(config.seed)
    np.random.seed(config.seed)
    torch.manual_seed(config.seed)

    print("==================================================")
    print("   VoiceBack EMG Baseline Model Training Run      ")
    print("==================================================")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training Device: {device}")

    # 1. Load Dataset & Splits
    full_dataset = EMGSilentSpeechDataset(config.data_dir)
    total_samples = len(full_dataset)
    train_ds, val_ds, test_ds = full_dataset.split(
        train_ratio=config.train_ratio,
        val_ratio=config.val_ratio,
        test_ratio=config.test_ratio,
        seed=config.seed
    )

    tokenizer = full_dataset.tokenizer
    vocab_size = tokenizer.vocab_size()

    print(f"\n1. Dataset Splits & Setup:")
    print(f"   - Input Signal: Silent sEMG Feature Matrices (*_silent.npy)")
    print(f"   - Total Samples: {total_samples}")
    print(f"   - Train Split:   {len(train_ds)} samples (80%)")
    print(f"   - Val Split:     {len(val_ds)} samples (10%)")
    print(f"   - Test Split:    {len(test_ds)} samples (10%)")
    print(f"   - Vocabulary:    {vocab_size} tokens")

    # 2. Fit and Save Feature Scaler
    scaler = EMGFeatureScaler()
    scaler.fit(train_ds)
    os.makedirs(config.checkpoint_dir, exist_ok=True)
    scaler.save(config.scaler_path)
    print(f"\n2. Feature Preprocessing:")
    print(f"   - Scaler fitted on {len(train_ds)} training samples and saved to {config.scaler_path}")

    # 3. Instantiate Model, Loss, Optimizer
    model = baseline_model.EMGSilentSpeechModel(
        in_features=config.in_features,
        conv_channels=config.conv_channels,
        hidden_size=config.hidden_size,
        num_layers=config.num_layers,
        num_classes=vocab_size,
        dropout=config.dropout
    ).to(device)

    criterion = nn.CTCLoss(blank=0, zero_infinity=True)
    optimizer = optim.Adam(model.parameters(), lr=config.learning_rate, weight_decay=config.weight_decay)

    param_count = model.count_parameters()
    print(f"\n3. Model & Optimizer:")
    print(f"   - Architecture: 1D Conv (128) + 2-layer BiGRU (128) + Linear Head ({vocab_size})")
    print(f"   - Total Parameters: {param_count:,}")
    print(f"   - Loss Function: PyTorch CTCLoss(blank=0, zero_infinity=True)")
    print(f"   - Optimizer: Adam (lr={config.learning_rate}, weight_decay={config.weight_decay})")

    # 4. Pre-Training Initial State Evaluation
    print(f"\n4. Evaluating Initial (Pre-Training) Model State:")
    initial_val_loss, initial_cer, initial_wer, initial_preds = evaluate(
        model, val_ds, scaler, tokenizer, criterion, device, batch_size=config.batch_size
    )
    print(f"   - Initial Val Loss: {initial_val_loss:.4f}")
    print(f"   - Initial Val CER:  {initial_cer * 100:.2f}%")
    print(f"   - Initial Val WER:  {initial_wer * 100:.2f}%")

    print(f"\n   Sample Initial Predictions (Before Training):")
    for idx, (ref, hyp, cer, wer) in enumerate(initial_preds[:3]):
        print(f"     [{idx + 1}] Ref:  '{ref}'")
        print(f"         Hyp:  '{hyp[:60]}...'")
        print(f"         CER: {cer * 100:.1f}%, WER: {wer * 100:.1f}%")

    # 5. Epoch-by-Epoch Training Loop
    print(f"\n5. Starting Training Execution ({config.epochs} Epochs):")
    print("-----------------------------------------------------------------------------------------")
    print(f"{'Epoch':<8} | {'Train Loss':<12} | {'Val Loss':<12} | {'Val CER (%)':<14} | {'Val WER (%)':<14} | {'Checkpoint'}")
    print("-----------------------------------------------------------------------------------------")

    best_val_loss = float("inf")
    train_samples = [train_ds[i] for i in range(len(train_ds))]
    start_time = time.time()

    for epoch in range(1, config.epochs + 1):
        model.train()
        random.shuffle(train_samples)
        epoch_train_loss = 0.0
        train_batches = 0

        for i in range(0, len(train_samples), config.batch_size):
            batch = train_samples[i:i + config.batch_size]

            # Scale features
            scaled_features = [scaler.transform(item["features"]) for item in batch]
            padded_dict = pad_and_mask_sequences(scaled_features)

            input_feats = torch.from_numpy(padded_dict["padded_features"]).to(device)  # (B, T_max, 112)
            input_lengths = torch.from_numpy(padded_dict["seq_lengths"]).to(device)   # (B,)

            # Prepare target tokens
            target_list = [item["tokens"] for item in batch]
            target_lengths = torch.tensor([len(t) for t in target_list], dtype=torch.long, device=device)

            max_target_len = max(len(t) for t in target_list)
            padded_targets = np.zeros((len(batch), max_target_len), dtype=np.int64)
            for b_idx, t_arr in enumerate(target_list):
                padded_targets[b_idx, :len(t_arr)] = t_arr
            target_tokens = torch.from_numpy(padded_targets).to(device)

            optimizer.zero_grad()
            log_probs = model(input_feats)               # (B, T_max, num_classes)
            log_probs_ctc = log_probs.permute(1, 0, 2)   # (T_max, B, num_classes)

            loss = criterion(log_probs_ctc, target_tokens, input_lengths, target_lengths)

            if not torch.isnan(loss) and not torch.isinf(loss):
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), config.grad_clip)
                optimizer.step()
                epoch_train_loss += loss.item()
                train_batches += 1

        avg_train_loss = epoch_train_loss / max(1, train_batches)

        # Validation evaluation at end of epoch
        val_loss, val_cer, val_wer, _ = evaluate(
            model, val_ds, scaler, tokenizer, criterion, device, batch_size=config.batch_size
        )

        saved_checkpoint = False
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), config.checkpoint_path)
            saved_checkpoint = True

        ckpt_str = "[SAVED BEST]" if saved_checkpoint else ""
        print(f"Epoch {epoch:02d}/{config.epochs:02d} | {avg_train_loss:<12.4f} | {val_loss:<12.4f} | {val_cer * 100:<14.2f} | {val_wer * 100:<14.2f} | {ckpt_str}")

    elapsed = time.time() - start_time
    print("-----------------------------------------------------------------------------------------")
    print(f"Training completed in {elapsed:.1f} seconds.")

    # 6. Load Best Model Checkpoint & Evaluate Post-Training Predictions
    print(f"\n6. Loading Best Model Checkpoint from {config.checkpoint_path}:")
    model.load_state_dict(torch.load(config.checkpoint_path))

    final_val_loss, final_cer, final_wer, final_preds = evaluate(
        model, val_ds, scaler, tokenizer, criterion, device, batch_size=config.batch_size
    )

    print(f"\n7. Final Post-Training Validation Metrics:")
    print(f"   - Best Val Loss:  {final_val_loss:.4f} (Pre-training: {initial_val_loss:.4f})")
    print(f"   - Best Val CER:   {final_cer * 100:.2f}% (Pre-training: {initial_cer * 100:.2f}%)")
    print(f"   - Best Val WER:   {final_wer * 100:.2f}% (Pre-training: {initial_wer * 100:.2f}%)")

    print(f"\n   Sample Post-Training Predictions (After Training):")
    for idx, (ref, hyp, cer, wer) in enumerate(final_preds[:5]):
        print(f"     [{idx + 1}] Reference:  '{ref}'")
        print(f"         Hypothesis: '{hyp}'")
        print(f"         CER: {cer * 100:.1f}%, WER: {wer * 100:.1f}%\n")

    print("==================================================")
    print("    BASELINE TRAINING EXPERIMENT COMPLETED        ")
    print("==================================================")


if __name__ == "__main__":
    run_training_experiment()
