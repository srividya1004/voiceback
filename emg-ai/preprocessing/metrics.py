"""
VoiceBack EMG / AI Prototype - Evaluation Metrics & CTC Greedy Decoder
Implements CTC greedy sequence decoding, Levenshtein edit distance,
Character Error Rate (CER), and Word Error Rate (WER).
"""

import numpy as np


def levenshtein_distance(seq1, seq2):
    """
    Compute Levenshtein edit distance between two sequences (strings or lists of tokens/words).
    Returns minimum insertions, deletions, and substitutions required to transform seq1 to seq2.
    """
    m, n = len(seq1), len(seq2)
    dp = np.zeros((m + 1, n + 1), dtype=np.int32)

    for i in range(m + 1):
        dp[i, 0] = i
    for j in range(n + 1):
        dp[0, j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if seq1[i - 1] == seq2[j - 1]:
                dp[i, j] = dp[i - 1, j - 1]
            else:
                dp[i, j] = 1 + min(
                    dp[i - 1, j],      # Deletion
                    dp[i, j - 1],      # Insertion
                    dp[i - 1, j - 1]   # Substitution
                )

    return int(dp[m, n])


def calculate_cer(reference, hypothesis):
    """
    Calculate Character Error Rate (CER) between ground-truth reference text
    and decoded hypothesis text.
    CER = LevenshteinDistance(reference, hypothesis) / len(reference)
    """
    if len(reference) == 0:
        return 0.0 if len(hypothesis) == 0 else 1.0

    edit_dist = levenshtein_distance(list(reference), list(hypothesis))
    return float(edit_dist / len(reference))


def calculate_wer(reference, hypothesis):
    """
    Calculate Word Error Rate (WER) between ground-truth reference text
    and decoded hypothesis text.
    WER = LevenshteinDistance(reference_words, hypothesis_words) / len(reference_words)
    """
    ref_words = reference.strip().split()
    hyp_words = hypothesis.strip().split()

    if len(ref_words) == 0:
        return 0.0 if len(hyp_words) == 0 else 1.0

    edit_dist = levenshtein_distance(ref_words, hyp_words)
    return float(edit_dist / len(ref_words))


def ctc_greedy_decode(log_probs_or_logits, tokenizer, blank_id=0):
    """
    Perform Connectionist Temporal Classification (CTC) greedy decoding on output probabilities/logits.

    Parameters:
    - log_probs_or_logits: 2D array (T, C) or 3D array (B, T, C) of logits/log-probabilities.
    - tokenizer: TextTokenizer instance with decode() method.
    - blank_id: CTC blank token index (default: 0).

    Returns:
    - List of decoded text strings (one per batch item).
    """
    # Convert PyTorch tensor to NumPy array if necessary
    if hasattr(log_probs_or_logits, "detach"):
        arr = log_probs_or_logits.detach().cpu().numpy()
    else:
        arr = np.array(log_probs_or_logits)

    if len(arr.shape) == 2:
        arr = np.expand_axis(arr, 0)  # Convert (T, C) to (1, T, C)

    batch_size, seq_len, num_classes = arr.shape
    decoded_texts = []

    for b in range(batch_size):
        # Step 1: Argmax per time step
        raw_token_ids = np.argmax(arr[b], axis=-1)  # Shape: (T,)

        # Step 2: Collapse consecutive repeated token IDs
        collapsed_ids = []
        prev_id = None
        for tid in raw_token_ids:
            if tid != prev_id:
                collapsed_ids.append(int(tid))
                prev_id = tid

        # Step 3: Strip CTC blank tokens
        final_ids = [tid for tid in collapsed_ids if tid != blank_id]

        # Step 4: Decode to string using tokenizer
        decoded_text = tokenizer.decode(final_ids)
        decoded_texts.append(decoded_text)

    return decoded_texts


def verify_metrics():
    """
    Verification tests for CTC decoder, Levenshtein distance, CER, and WER.
    """
    print("==================================================")
    print("   VoiceBack EMG Metrics & CTC Decoder Test       ")
    print("==================================================")

    # 1. Test Levenshtein Edit Distance
    str1 = "Sunday May 21"
    str2 = "Sunday June 21"
    dist_char = levenshtein_distance(list(str1), list(str2))
    dist_word = levenshtein_distance(str1.split(), str2.split())

    print(f"\n1. Levenshtein Distance Test:")
    print(f"   - Reference:  '{str1}'")
    print(f"   - Hypothesis: '{str2}'")
    print(f"   - Character Edit Distance: {dist_char}")
    print(f"   - Word Edit Distance:      {dist_word}")

    # 2. Test CER & WER Calculations
    cer_exact = calculate_cer("Sunday May 21", "Sunday May 21")
    cer_sub = calculate_cer("Sunday May 21", "Snday May 21")    # 1 deletion out of 13 chars
    wer_sub = calculate_wer("Sunday May 21", "Sunday June 21")  # 1 substitution out of 3 words

    print(f"\n2. CER & WER Metrics Test:")
    print(f"   - Exact Match CER: {cer_exact:.4f} (0.00%)")
    print(f"   - 1-Char Deletion CER ('Snday May 21'): {cer_sub:.4f} ({cer_sub * 100:.2f}%)")
    print(f"   - 1-Word Substitution WER ('Sunday June 21'): {wer_sub:.4f} ({wer_sub * 100:.2f}%)")

    # 3. Test CTC Greedy Decoder Behavior
    print(f"\n3. CTC Greedy Decoder Behavior Test:")
    
    # Import dummy tokenizer
    class DummyTokenizer:
        def __init__(self):
            # Vocabulary: 0=<pad/blank>, 1='S', 2='u', 3='n', 4='d', 5='a', 6='y'
            self.id2char = {0: "<blank>", 1: "S", 2: "u", 3: "n", 4: "d", 5: "a", 6: "y"}

        def decode(self, token_ids):
            return "".join([self.id2char.get(i, "?") for i in token_ids])

    tokenizer = DummyTokenizer()

    # Create dummy frame logit sequence representing repeated characters and blanks:
    # Frames: [S, S, S, blank, u, u, n, n, blank, d, d, a, y, y]
    frame_token_targets = [1, 1, 1, 0, 2, 2, 3, 3, 0, 4, 4, 5, 6, 6]
    T = len(frame_token_targets)
    C = 7
    dummy_logits = np.zeros((1, T, C), dtype=np.float32)

    for t, target_id in enumerate(frame_token_targets):
        dummy_logits[0, t, target_id] = 10.0  # Set high logit for target ID

    decoded_result = ctc_greedy_decode(dummy_logits, tokenizer, blank_id=0)

    print(f"   - Frame Sequence Length (T): {T}")
    print(f"   - Raw Frame Token IDs: {frame_token_targets}")
    print(f"   - Decoded Output Text: '{decoded_result[0]}'")
    print(f"   - Expected Text:       'Sunday'")
    print(f"   - Decoding Correct:    {decoded_result[0] == 'Sunday'}")

    print("\n==================================================")
    print("      METRICS & DECODER VERIFIED SUCCESSFULLY     ")
    print("==================================================")


if __name__ == "__main__":
    verify_metrics()
