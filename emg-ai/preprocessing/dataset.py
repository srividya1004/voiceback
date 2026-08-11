"""
VoiceBack EMG / AI Prototype - Dataset & DataLoader Module
Decoupled module for loading silent speech sEMG feature arrays and prompt texts.
"""

import os
import json
import random
import numpy as np

# Try importing torch if available, otherwise fallback gracefully
try:
    import torch
    from torch.utils.data import Dataset, DataLoader
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    Dataset = object


class TextTokenizer:
    """Character-level tokenizer for CTC sequence targets."""

    def __init__(self, pad_tok="<pad>", unk_tok="<unk>"):
        self.pad_tok = pad_tok
        self.unk_tok = unk_tok
        self.pad_id = 0
        self.unk_id = 1
        self.char2id = {pad_tok: 0, unk_tok: 1}
        self.id2char = {0: pad_tok, 1: unk_tok}

    def build_vocab(self, text_list):
        unique_chars = sorted(list(set("".join(text_list))))
        for idx, char in enumerate(unique_chars, start=2):
            self.char2id[char] = idx
            self.id2char[idx] = char

    def encode(self, text):
        return [self.char2id.get(c, self.unk_id) for c in text]

    def decode(self, token_ids):
        res = []
        for tid in token_ids:
            if tid == self.pad_id:
                continue
            res.append(self.id2char.get(tid, self.unk_tok))
        return "".join(res)

    def vocab_size(self):
        return len(self.char2id)


class EMGSilentSpeechDataset(Dataset):
    """
    Dataset class for loading paired silent sEMG feature arrays (*_silent.npy)
    and target prompt text labels (*.json).
    """

    def __init__(self, data_dir, tokenizer=None, ids=None):
        self.data_dir = data_dir
        self.base_dir = self._resolve_data_dir(data_dir)
        self.samples = []
        self.tokenizer = tokenizer or TextTokenizer()

        self._load_metadata(ids=ids)

        if tokenizer is None and len(self.samples) > 0:
            all_texts = [s["text"] for s in self.samples]
            self.tokenizer.build_vocab(all_texts)

    def _resolve_data_dir(self, data_dir):
        if os.path.exists(os.path.join(data_dir, "extracted_emg_features")):
            return os.path.join(data_dir, "extracted_emg_features")
        return data_dir

    def _load_metadata(self, ids=None):
        if not os.path.exists(self.base_dir):
            raise FileNotFoundError(f"Dataset directory not found: {self.base_dir}")

        all_files = os.listdir(self.base_dir)
        json_files = sorted([f for f in all_files if f.endswith(".json")])

        for jf in json_files:
            sample_id = jf.replace(".json", "")
            if ids is not None and sample_id not in ids:
                continue

            json_path = os.path.join(self.base_dir, jf)
            silent_path = os.path.join(self.base_dir, f"{sample_id}_silent.npy")

            if not os.path.exists(silent_path):
                continue

            with open(json_path, "r", encoding="utf-8") as f:
                meta = json.load(f)

            self.samples.append({
                "sample_id": sample_id,
                "json_path": json_path,
                "silent_path": silent_path,
                "sentence_index": meta.get("sentence_index"),
                "text": meta.get("text", ""),
                "book": meta.get("book", "")
            })

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        item = self.samples[idx]
        feature_matrix = np.load(item["silent_path"]).astype(np.float32)
        text = item["text"]
        tokens = self.tokenizer.encode(text)

        sample_dict = {
            "sample_id": item["sample_id"],
            "features": feature_matrix,  # Shape: (T, 112)
            "text": text,
            "tokens": np.array(tokens, dtype=np.int64),
            "seq_len": feature_matrix.shape[0],
            "text_len": len(tokens)
        }

        if HAS_TORCH:
            sample_dict["features_tensor"] = torch.from_numpy(feature_matrix)
            sample_dict["tokens_tensor"] = torch.tensor(tokens, dtype=torch.long)

        return sample_dict

    def split(self, train_ratio=0.8, val_ratio=0.1, test_ratio=0.1, seed=42):
        """Split dataset into train, validation, and test subsets."""
        assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-5, "Ratios must sum to 1.0"
        
        all_ids = [s["sample_id"] for s in self.samples]
        random.seed(seed)
        shuffled_ids = all_ids.copy()
        random.shuffle(shuffled_ids)

        total = len(shuffled_ids)
        n_train = int(total * train_ratio)
        n_val = int(total * val_ratio)

        train_ids = set(shuffled_ids[:n_train])
        val_ids = set(shuffled_ids[n_train:n_train + n_val])
        test_ids = set(shuffled_ids[n_train + n_val:])

        train_ds = EMGSilentSpeechDataset(self.data_dir, tokenizer=self.tokenizer, ids=train_ids)
        val_ds = EMGSilentSpeechDataset(self.data_dir, tokenizer=self.tokenizer, ids=val_ids)
        test_ds = EMGSilentSpeechDataset(self.data_dir, tokenizer=self.tokenizer, ids=test_ids)

        return train_ds, val_ds, test_ds


def collate_emg_batch(batch):
    """
    Custom collate function for batching variable-length sEMG sequences and tokens.
    """
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

    batch_dict = {
        "sample_ids": sample_ids,
        "padded_features": padded_features,  # (B, T_max, 112)
        "padded_tokens": padded_tokens,      # (B, L_max)
        "seq_lengths": seq_lengths,
        "text_lengths": text_lengths,
        "texts": texts
    }

    if HAS_TORCH:
        batch_dict["features_tensor"] = torch.from_numpy(padded_features)
        batch_dict["tokens_tensor"] = torch.from_numpy(padded_tokens)
        batch_dict["seq_lengths_tensor"] = torch.from_numpy(seq_lengths)
        batch_dict["text_lengths_tensor"] = torch.from_numpy(text_lengths)

    return batch_dict
