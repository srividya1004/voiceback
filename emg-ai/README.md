# VoiceBack EMG / AI Prototype Module

> [!IMPORTANT]
> **Clinical & Ethical Disclaimer:**
> 1. **Offline Benchmark Dataset Only:** The dataset in `emg-ai/data/` (`extracted_emg_features-20250530T194147Z-1-001.zip`) contains 1,000 paired (500 silent, 500 voiced) pre-extracted sEMG feature arrays (`(T, 112)`) and text labels.
> 2. **No Clinical Patient / Aphasia Data:** This benchmark dataset does **not** contain participant clinical metadata or aphasia diagnoses. It must **not** be presented as an aphasia patient dataset.
> 3. **Software & Pipeline Validation Scope:** This dataset is used strictly for offline software architecture, dataset loading, feature preprocessing, and baseline machine learning model development.
> 4. **Ethical & Clinical Permissions:** Real clinical patient data (e.g., from aphasia patients) must only be collected and utilized under proper IRB, ethical, and clinical approvals.
> 5. **Validation Scope:** Model performance on offline benchmark data does **not** guarantee clinical efficacy or real-world patient accuracy.

---

## Overview

This module (`emg-ai/`) serves as an isolated sandbox for prototyping signal processing, feature extraction, dataset loading, and machine learning pipelines for silent speech recognition from EMG signals in VoiceBack.

It is decoupled from the main VoiceBack application stack (`backend/`, `pwa/`, `firmware/`) to ensure standalone development, testing, and validation.

---

## Directory Structure

- `data/` — Storage directory for sEMG dataset archives (`extracted_emg_features-20250530T194147Z-1-001.zip`).
- `preprocessing/` — Signal filtering, feature normalization, detrending, and sequence padding modules.
- `features/` — Feature extraction and sequence formatting utilities for 112-dimensional sEMG vectors.
- `models/` — Machine learning model definitions, baseline classifiers, and checkpoint weights.
- `experiments/` — Pipeline execution scripts, training loops, and validation runs.
- `notebooks/` — Exploratory data analysis (EDA) and interactive visualization notebooks.

---

## Usage Guidelines

- **Dataset Usage:** Primary software pipeline prototyping and algorithm validation use the 1,000 pre-extracted sEMG feature matrices (`(T, 112)`) and 500 JSON text labels in `emg-ai/data/`.
- **Decoupled Development:** Do not import or modify core VoiceBack production modules (`pwa/`, `backend/`, `firmware/`) while working inside `emg-ai/`.

