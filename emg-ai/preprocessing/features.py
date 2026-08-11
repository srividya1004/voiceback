"""
VoiceBack EMG / AI Prototype - Feature Preprocessing & Normalization Module
Reusable normalization, scaling, sequence padding, and masking utilities
for 112-dimensional surface EMG feature matrices.
"""

import os
import json
import numpy as np

# Try importing PyTorch if available, otherwise fallback to NumPy
try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


class EMGFeatureScaler:
    """
    Standardization scaler (Z-score normalization) for 112-dimensional sEMG feature vectors.
    Computes per-feature mean and standard deviation across all time frames.
    """

    def __init__(self, eps=1e-8):
        self.eps = eps
        self.mean = None
        self.std = None
        self.is_fitted = False

    def fit(self, samples_or_dataset):
        """
        Compute mean and standard deviation per feature dimension (112,)
        across all time frames of all samples.
        """
        all_frames = []

        for item in samples_or_dataset:
            feats = item["features"] if isinstance(item, dict) else item
            all_frames.append(feats)

        concatenated_frames = np.concatenate(all_frames, axis=0)  # Shape: (Total_T, 112)
        self.mean = np.mean(concatenated_frames, axis=0, keepdims=True).astype(np.float32)  # (1, 112)
        self.std = np.std(concatenated_frames, axis=0, keepdims=True).astype(np.float32)    # (1, 112)

        # Replace zero/tiny std values with 1.0 to prevent division by zero
        self.std[self.std < self.eps] = 1.0
        self.is_fitted = True

        return self

    def transform(self, feature_matrix):
        """
        Normalize a 2D feature matrix (T, 112) or 3D batch (B, T, 112).
        Preserves temporal sequence structure.
        """
        if not self.is_fitted:
            raise ValueError("Scaler has not been fitted yet. Call fit() first.")

        normalized = (feature_matrix - self.mean) / (self.std + self.eps)

        if HAS_TORCH and isinstance(feature_matrix, torch.Tensor):
            mean_t = torch.from_numpy(self.mean).to(feature_matrix.device)
            std_t = torch.from_numpy(self.std).to(feature_matrix.device)
            normalized = (feature_matrix - mean_t) / (std_t + self.eps)

        return normalized.astype(np.float32) if isinstance(normalized, np.ndarray) else normalized

    def fit_transform(self, samples_or_dataset):
        self.fit(samples_or_dataset)
        return [self.transform(item["features"] if isinstance(item, dict) else item) for item in samples_or_dataset]

    def save(self, file_path):
        """Save scaler parameters to JSON file."""
        data = {
            "mean": self.mean.flatten().tolist(),
            "std": self.std.flatten().tolist(),
            "eps": self.eps
        }
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load(self, file_path):
        """Load scaler parameters from JSON file."""
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.mean = np.array(data["mean"], dtype=np.float32).reshape(1, -1)
        self.std = np.array(data["std"], dtype=np.float32).reshape(1, -1)
        self.eps = data.get("eps", 1e-8)
        self.is_fitted = True
        return self


def create_sequence_mask(seq_lengths, max_len=None):
    """
    Generate boolean attention/padding mask matrix (B, max_len).
    Returns True for valid sequence positions, False for padded positions.
    """
    batch_size = len(seq_lengths)
    if max_len is None:
        max_len = max(seq_lengths)

    mask = np.zeros((batch_size, max_len), dtype=bool)
    for i, length in enumerate(seq_lengths):
        mask[i, :length] = True

    if HAS_TORCH:
        return torch.from_numpy(mask)
    return mask


def pad_and_mask_sequences(feature_list, fill_value=0.0):
    """
    Pad variable-length sequence arrays (T_i, 112) into a batch tensor (B, max_T, 112)
    and return padded array alongside sequence lengths and boolean masks.
    """
    batch_size = len(feature_list)
    seq_lengths = np.array([f.shape[0] for f in feature_list], dtype=np.int64)
    max_len = max(seq_lengths)
    feat_dim = feature_list[0].shape[1]

    padded_features = np.full((batch_size, max_len, feat_dim), fill_value, dtype=np.float32)
    mask = np.zeros((batch_size, max_len), dtype=bool)

    for i, feats in enumerate(feature_list):
        length = seq_lengths[i]
        padded_features[i, :length, :] = feats
        mask[i, :length] = True

    return {
        "padded_features": padded_features,  # (B, T_max, 112)
        "seq_lengths": seq_lengths,          # (B,)
        "mask": mask                         # (B, T_max)
    }


def verify_feature_preprocessing(data_dir=None):
    """
    Verification test for feature scaler, normalization, padding, and masking.
    """
    print("==================================================")
    print("    VoiceBack EMG Feature Scaling Verification   ")
    print("==================================================")

    # Import dataset loader
    sys_dir = os.path.dirname(__file__)
    if sys_dir not in os.sys.path:
        os.sys.path.append(sys_dir)

    from dataset import EMGSilentSpeechDataset

    if data_dir is None:
        data_dir = os.path.join(sys_dir, "..", "data", "extracted_dataset")

    dataset = EMGSilentSpeechDataset(data_dir)
    print(f"Loaded dataset containing {len(dataset)} samples.")

    # 1. Inspect Sample 0 Raw Features
    raw_feats_0 = dataset[0]["features"]
    raw_shape = raw_feats_0.shape
    print(f"\n1. Input Feature Details (Sample 0):")
    print(f"   - Raw Shape: {raw_shape}")
    print(f"   - Raw Min: {raw_feats_0.min():.4f}")
    print(f"   - Raw Max: {raw_feats_0.max():.4f}")
    print(f"   - Raw Mean: {raw_feats_0.mean():.4f}")
    print(f"   - Raw Std: {raw_feats_0.std():.4f}")

    # 2. Fit Feature Scaler
    scaler = EMGFeatureScaler()
    scaler.fit(dataset)
    print(f"\n2. Scaler Fitted across all {len(dataset)} samples:")
    print(f"   - Fitted Mean Vector Shape: {scaler.mean.shape}")
    print(f"   - Fitted Std Vector Shape: {scaler.std.shape}")
    print(f"   - Global Mean Range: [{scaler.mean.min():.4f}, {scaler.mean.max():.4f}]")
    print(f"   - Global Std Range:  [{scaler.std.min():.4f}, {scaler.std.max():.4f}]")

    # 3. Transform Features
    norm_feats_0 = scaler.transform(raw_feats_0)
    norm_shape = norm_feats_0.shape
    print(f"\n3. Normalized Feature Details (Sample 0):")
    print(f"   - Transformed Shape: {norm_shape}")
    print(f"   - Normalized Min: {norm_feats_0.min():.4f}")
    print(f"   - Normalized Max: {norm_feats_0.max():.4f}")
    print(f"   - Normalized Mean: {norm_feats_0.mean():.4f}")
    print(f"   - Normalized Std: {norm_feats_0.std():.4f}")

    # 4. Check for NaNs / Infs
    has_nan = np.isnan(norm_feats_0).any()
    has_inf = np.isinf(norm_feats_0).any()
    print(f"\n4. Numerical Safety Verification:")
    print(f"   - Contains NaN values: {has_nan}")
    print(f"   - Contains Inf values: {has_inf}")

    # 5. Variable-Length Padding & Masking Test
    sample_feats_list = [dataset[i]["features"] for i in range(5)]
    padded_res = pad_and_mask_sequences(sample_feats_list)

    print(f"\n5. Variable-Length Padding & Masking Test (Batch Size = 5):")
    print(f"   - Input Lengths: {padded_res['seq_lengths'].tolist()}")
    print(f"   - Padded Batch Shape: {padded_res['padded_features'].shape}")
    print(f"   - Boolean Mask Shape: {padded_res['mask'].shape}")
    print(f"   - Valid Mask Count per Sample: {padded_res['mask'].sum(axis=1).tolist()}")

    print("\n==================================================")
    print("      FEATURE PREPROCESSING VERIFIED SUCCESSFULLY  ")
    print("==================================================")


if __name__ == "__main__":
    verify_feature_preprocessing()
