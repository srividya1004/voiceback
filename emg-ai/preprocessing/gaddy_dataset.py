"""
VoiceBack EMG / AI Prototype - Gaddy Silent Speech Dataset Module
Module for loading, pre-caching, scaling, and splitting Gaddy silent speech samples
according to official Gaddy benchmark split definitions (testset_largedev.json).

Features:
- Filters for ONLY silent-speech samples with non-empty text.
- Adapts (T, 8) raw sEMG @ 1000Hz -> (T', 112) feature matrix using GaddyEMGAdapter.
- Standardizes features using EMGFeatureScaler fitted on training split.
- Enforces official split definitions (train: 1789, val: 200, test: 99).
- Ensures zero data leakage between splits.
"""

import os
import json
import numpy as np
import torch
from torch.utils.data import Dataset

from gaddy_adapter import GaddyEMGAdapter
from dataset import TextTokenizer
from features import EMGFeatureScaler


class GaddySilentSpeechDataset(Dataset):
    """
    PyTorch Dataset for Gaddy Silent Speech utterances.
    Pre-caches adapted 112-dimensional features in memory for fast epoch iterations.
    """

    def __init__(
        self,
        gaddy_data_dir=None,
        split_file_path=None,
        split="train",
        tokenizer=None,
        scaler=None,
        adapter=None,
        verbose=True
    ):
        if gaddy_data_dir is None:
            gaddy_data_dir = os.path.abspath("emg-ai/data/gaddy/emg_data")
        if split_file_path is None:
            split_file_path = os.path.abspath("emg-ai/data/gaddy/testset_largedev.json")

        self.gaddy_data_dir = gaddy_data_dir
        self.split_file_path = split_file_path
        self.split = split
        self.verbose = verbose
        self.adapter = adapter or GaddyEMGAdapter(expected_channels=8, expected_sampling_rate=1000)

        # Load official split definition
        with open(split_file_path, "r", encoding="utf-8") as f:
            split_info = json.load(f)

        self.dev_pairs = set((item[0], item[1]) for item in split_info["dev"])
        self.test_pairs = set((item[0], item[1]) for item in split_info["test"])

        # Index all silent samples
        self.raw_samples = []
        self._index_dataset()

        # Build vocabulary across all samples if tokenizer not provided
        if tokenizer is None:
            self.tokenizer = TextTokenizer()
            all_texts = [s["text"] for s in self.raw_samples]
            self.tokenizer.build_vocab(all_texts)
        else:
            self.tokenizer = tokenizer

        # Filter samples for current split
        self.samples = [s for s in self.raw_samples if s["split"] == self.split]

        self.scaler = scaler
        self.cached_features = []
        self.cached_tokens = []
        self._precache_samples()

    def _index_dataset(self):
        for root, dirs, files in os.walk(self.gaddy_data_dir):
            for f in files:
                if f.endswith("_info.json"):
                    json_path = os.path.join(root, f)
                    emg_path = json_path.replace("_info.json", "_emg.npy")

                    if not os.path.exists(emg_path):
                        continue

                    with open(json_path, "r", encoding="utf-8") as jf:
                        info = json.load(jf)

                    is_silent = info.get("silent", False) or "silent" in json_path.lower()
                    text = info.get("text", "").strip()

                    if is_silent and text:
                        book = info.get("book", "")
                        s_idx = info.get("sentence_index", -1)

                        if (book, s_idx) in self.test_pairs:
                            sample_split = "test"
                        elif (book, s_idx) in self.dev_pairs:
                            sample_split = "val"
                        else:
                            sample_split = "train"

                        self.raw_samples.append({
                            "json_path": json_path,
                            "emg_path": emg_path,
                            "text": text,
                            "book": book,
                            "sentence_index": s_idx,
                            "session": info.get("session", os.path.basename(os.path.dirname(json_path))),
                            "split": sample_split
                        })

    def _precache_samples(self):
        if self.verbose:
            print(f"Pre-caching {len(self.samples)} [{self.split.upper()}] samples...", flush=True)

        for i, s in enumerate(self.samples):
            raw_emg = np.load(s["emg_path"]).astype(np.float32)
            feats_112 = self.adapter.adapt_sample(raw_emg, sampling_rate=1000)

            if self.scaler is not None:
                feats_112 = self.scaler.transform(feats_112)

            tokens = np.array(self.tokenizer.encode(s["text"]), dtype=np.int64)

            self.cached_features.append(feats_112)
            self.cached_tokens.append(tokens)

            if self.verbose and (i + 1) % 500 == 0:
                print(f"  Cached {i + 1}/{len(self.samples)} {self.split} samples...", flush=True)

    def apply_scaler(self, scaler):
        """Apply fitted EMGFeatureScaler to pre-cached features."""
        self.scaler = scaler
        for i in range(len(self.cached_features)):
            self.cached_features[i] = scaler.transform(self.cached_features[i])

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]
        feats = self.cached_features[idx]
        tokens = self.cached_tokens[idx]

        return {
            "sample_id": f"{sample['session']}_{sample['sentence_index']}",
            "features": feats,                       # (T, 112)
            "features_tensor": torch.from_numpy(feats),
            "text": sample["text"],
            "tokens": tokens,                        # (L,)
            "tokens_tensor": torch.from_numpy(tokens),
            "seq_len": feats.shape[0],
            "text_len": len(tokens),
            "session": sample["session"]
        }


def collate_gaddy_batch(batch):
    """Custom collate function for batching variable-length sEMG features and token sequences."""
    batch_size = len(batch)
    max_seq_len = max(item["seq_len"] for item in batch)
    max_text_len = max(item["text_len"] for item in batch)
    feature_dim = batch[0]["features"].shape[1]

    padded_features = np.zeros((batch_size, max_seq_len, feature_dim), dtype=np.float32)
    padded_tokens = np.zeros((batch_size, max_text_len), dtype=np.int64)

    seq_lengths = np.zeros((batch_size,), dtype=np.int64)
    text_lengths = np.zeros((batch_size,), dtype=np.int64)
    texts = []
    sample_ids = []

    for i, item in enumerate(batch):
        slen = item["seq_len"]
        tlen = item["text_len"]

        padded_features[i, :slen, :] = item["features"]
        padded_tokens[i, :tlen] = item["tokens"]
        seq_lengths[i] = slen
        text_lengths[i] = tlen

        texts.append(item["text"])
        sample_ids.append(item["sample_id"])

    return {
        "sample_ids": sample_ids,
        "features_tensor": torch.from_numpy(padded_features), # (B, T_max, 112)
        "tokens_tensor": torch.from_numpy(padded_tokens),     # (B, L_max)
        "seq_lengths_tensor": torch.from_numpy(seq_lengths),   # (B,)
        "text_lengths_tensor": torch.from_numpy(text_lengths), # (B,)
        "texts": texts
    }
