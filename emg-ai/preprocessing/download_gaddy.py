"""
VoiceBack EMG / AI Prototype - Official Gaddy Dataset Acquisition & Verification Utility
Downloads and extracts the official Gaddy Silent Speech dataset from Zenodo DOI: 10.5281/zenodo.4064408.

Official Record: https://zenodo.org/records/4064409
Artifact: emg_data.tar.gz (3,919,507,637 bytes ~3.92 GB)
MD5: 7f97d2182b896652999b1b2d0c69fd7b
License: Creative Commons Attribution 4.0 International (CC-BY 4.0)

Safety: Raw data extracted to emg-ai/data/gaddy/ (excluded from Git via .gitignore).
Existing benchmark dataset in emg-ai/data/extracted_dataset/ is untouched.
"""

import os
import sys
import hashlib
import tarfile
import json
import urllib.request

ZENODO_URL = "https://zenodo.org/api/records/4064409/files/emg_data.tar.gz/content"
EXPECTED_MD5 = "7f97d2182b896652999b1b2d0c69fd7b"
EXPECTED_SIZE_BYTES = 3919507637

DATA_DIR = os.path.abspath("emg-ai/data")
GADDY_DIR = os.path.join(DATA_DIR, "gaddy")
TAR_PATH = os.path.join(DATA_DIR, "emg_data.tar.gz")


def calculate_md5(file_path):
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def download_gaddy_dataset():
    os.makedirs(GADDY_DIR, exist_ok=True)
    print("==================================================")
    print(" VoiceBack Gaddy Dataset Acquisition Utility")
    print("==================================================")
    print(f"Target URL:        {ZENODO_URL}")
    print(f"Expected Size:     {EXPECTED_SIZE_BYTES:,} bytes (~3.92 GB)")
    print(f"Expected MD5:      {EXPECTED_MD5}")
    print(f"Target Directory:  {GADDY_DIR}")
    print("--------------------------------------------------")

    if not os.path.exists(TAR_PATH):
        print(f"Downloading {TAR_PATH} ...")
        def progress(count, block_size, total_size):
            percent = int(count * block_size * 100 / total_size)
            downloaded_mb = (count * block_size) / (1024 * 1024)
            total_mb = total_size / (1024 * 1024)
            sys.stdout.write(f"\rProgress: {percent}% [{downloaded_mb:.1f} MB / {total_mb:.1f} MB]")
            sys.stdout.flush()

        urllib.request.urlretrieve(ZENODO_URL, TAR_PATH, reporthook=progress)
        print("\nDownload complete.")
    else:
        print(f"Archive file already exists at {TAR_PATH}")

    # Check MD5
    print("Verifying MD5 checksum...")
    actual_md5 = calculate_md5(TAR_PATH)
    print(f"Actual MD5:   {actual_md5}")
    if actual_md5 != EXPECTED_MD5:
        raise ValueError(f"MD5 Checksum Mismatch! Expected {EXPECTED_MD5}, got {actual_md5}")
    print("MD5 checksum verified successfully.")

    # Extract Archive
    print(f"Extracting {TAR_PATH} into {GADDY_DIR} ...")
    with tarfile.open(TAR_PATH, "r:gz") as tar:
        tar.extractall(path=GADDY_DIR)
    print("Extraction complete.")

    verify_dataset_structure()


def verify_dataset_structure():
    """
    Verifies dataset files and counts silent/voiced samples.
    """
    print("\n==================================================")
    print(" Dataset Structure Verification")
    print("==================================================")

    if not os.path.exists(GADDY_DIR):
        print(f"Directory {GADDY_DIR} does not exist.")
        return

    all_files = []
    for root, dirs, files in os.walk(GADDY_DIR):
        for f in files:
            all_files.append(os.path.join(root, f))

    emg_files = [f for f in all_files if f.endswith("_emg.npy")]
    info_files = [f for f in all_files if f.endswith("_info.json")]
    audio_files = [f for f in all_files if f.endswith("_audio_clean.flac")]

    silent_count = 0
    voiced_count = 0

    for info_path in info_files:
        try:
            with open(info_path, "r", encoding="utf-8") as f:
                info = json.load(f)
                if info.get("silent", False) or "silent" in info_path:
                    silent_count += 1
                else:
                    voiced_count += 1
        except Exception:
            pass

    print(f"Total Files Discovered: {len(all_files):,}")
    print(f"Raw EMG Arrays (.npy):  {len(emg_files):,}")
    print(f"Info Metadata (.json):  {len(info_files):,}")
    print(f"Audio Files (.flac):    {len(audio_files):,}")
    print(f"Silent sEMG Utterances: {silent_count:,}")
    print(f"Voiced sEMG Utterances: {voiced_count:,}")
    print("==================================================")


if __name__ == "__main__":
    download_gaddy_dataset()
