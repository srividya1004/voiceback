# VoiceBack AI Architecture v1.0

**Version:** 1.0

**Last Updated:** 04 August 2026

**Status:** AI Design Phase

---

# 1. AI Vision

The objective of VoiceBack AI is to enable people with aphasia to communicate naturally by converting silent, whispered, or attempted speech into fluent spoken language using the patient's own regenerated voice.

The AI system is designed as a modular pipeline where each stage performs a specific task and can be improved independently.

---

# 2. AI Pipeline

```
Patient intends to communicate
        │
        ▼
Silent Speech
Whispered Speech
Attempted Speech
        │
        ▼
Speech Muscle Activation
        │
        ▼
Wearable EMG Neckband
        │
        ▼
Signal Conditioning & Filtering
        │
        ▼
Feature Extraction
        │
        ▼
AI Module 1
Silent Speech Recognition
        │
        ▼
Predicted Text
        │
        ▼
AI Module 2
Context Engine
        │
        ▼
Meaning & Intent
        │
        ▼
AI Module 3
Emotion Engine
        │
        ▼
Sentence + Emotion
        │
        ▼
AI Module 4
Voice Cloning
        │
        ▼
Patient's Own Voice
        │
        ▼
Speaker Output
```



# 3. AI Module 1 – Silent Speech Recognition

## Objective

Convert EMG signals into text.

## Input

Filtered EMG signal captured from the wearable neckband.

## Output

Predicted words or sentences.

Example

```
EMG Signal

↓

"I need water."
```

## Responsibilities

- Interpret EMG patterns.
- Predict intended speech.
- Handle silent speech.
- Handle whispered speech.
- Handle attempted speech.

---

# 4. AI Module 2 – Context Engine

## Objective

Improve the predicted sentence using contextual understanding and patient personalization.

## Responsibilities

- Understand the intended meaning.
- Complete incomplete sentences.
- Predict frequently used phrases.
- Improve grammatical correctness.
- Learn personalized vocabulary.
- Support multilingual communication.

## Context Sources

- Previous conversations
- Frequently used words
- Family member names
- Medicines
- Daily routine
- Time of day
- Location (future)
- Therapy history
- Communication history
- Emergency mode
- Patient preferences

## Example

Initial Prediction

```
Water
```

↓

Context Engine

```
I want water.
```

Another Example

```
Call
```

↓

```
Call my daughter.
```
# AI Module 3 – Safety & Confirmation Engine

## Objective

The Safety & Confirmation Engine ensures that VoiceBack preserves the patient's intended meaning before generating speech.

This module is especially important for medical and emergency communication where an incorrect interpretation could have serious consequences.

---

## Responsibilities

- Evaluate the confidence score of the predicted sentence.
- Determine whether confirmation is required.
- Prevent incorrect AI-generated responses.
- Preserve patient intent.
- Improve communication safety.

---

## Confidence Levels

### High Confidence (≥95%)

The predicted sentence is highly reliable.

Example

Predicted Text

"I want water."

↓

Speak automatically.

---

### Medium Confidence (70–95%)

The prediction is uncertain.

The system displays possible intended meanings.

Example

Patient Prediction

"Help"

↓

Suggested Responses

• Help me sit up.

• I need water.

• Call my caregiver.

• Call my doctor.

The patient selects the intended message before speech is generated.

---

### Low Confidence (<70%)

The AI is unable to determine the patient's intent reliably.

The original predicted text is displayed without expansion.

The system requests additional patient input rather than making assumptions.

---

## Medical Safety Principles

The AI must never invent emergency situations.

The AI must never change the patient's intended meaning.

Patient intent always has the highest priority.

When uncertainty exists, confirmation is required before generating speech.

---

## Learning

Over time, the system learns frequently selected responses.

For example,

If the patient repeatedly selects

"Help me sit up."

after predicting

"Help",

that option is prioritized in future suggestions while still allowing patient confirmation.

This enables personalization without sacrificing safety.

```
# 5. AI Module 3 – Emotion Engine

## Objective

Generate emotionally appropriate speech based on the patient's intended communication.

The Emotion Engine does not change the meaning of the sentence.

It determines how the sentence should be spoken.

## Supported Emotional States

- Neutral
- Happy
- Sad
- Fear
- Pain
- Urgent
- Angry
- Calm
- Gratitude

## Inputs

- Context Engine Output
- Emergency Status
- Conversation Context
- User Preferences
- Future physiological indicators

## Example

Input

```
Help
```

↓

Emotion

```
Urgent
```

↓

Output

```
Help!
```

spoken with urgency.

Another Example

Input

```
Thank you
```

↓

Emotion

```
Gratitude
```

↓

Patient's cloned voice expresses gratitude naturally.

The Emotion Engine should always preserve the patient's intended meaning while making speech sound more natural and expressive.

# 6. AI Module 3 – Voice Cloning

## Objective

Generate emotionally expressive speech using the patient's own cloned voice.

The Voice Cloning module receives:

- Corrected sentence
- Emotional state
- Patient voice model

and synthesizes natural speech while preserving both the patient's identity and emotional expression.

## Input

Corrected sentence.

Patient voice model.

## Output

Natural speech in the patient's cloned voice.

Example

```
Text

↓

Patient's Voice
```

---

# 7. Voice Dataset

Each patient owns a personalized voice dataset.

Dataset Components

- Voice recordings
- Metadata
- Recording language
- Recording quality
- Recording date

Recommended

50–100 recordings

10–20 minutes of speech.

---

# 8. EMG Dataset

Each EMG recording should include

- Raw EMG signal
- Filtered EMG signal
- Timestamp
- Intended sentence
- Session ID
- Patient ID

This dataset will be used to train the Silent Speech Recognition model.

---

# 9. Personalized Learning

VoiceBack should continuously improve.

Sources of learning

- Daily conversations
- Therapy sessions
- Frequently used phrases
- User corrections

The AI should adapt to each individual patient rather than relying only on a general model.

---
# AI Memory

VoiceBack maintains a personalized AI Memory for every patient.

This memory improves communication over time without changing the patient's identity.

The AI Memory may include:

- Frequently used words
- Family member names
- Caregiver names
- Doctor names
- Medicines
- Daily routine
- Favorite phrases
- Preferred language
- Communication history

The AI Memory is used only to improve prediction accuracy and contextual understanding.

It never replaces the patient's intended message.



# Emergency Mode

Emergency Mode combines predefined emergency phrases with Context Engine analysis.

Examples

- I need help.
- I cannot breathe.
- I have severe pain.
- Call my caregiver.
- Call my doctor.
- Call an ambulance.

The system should prioritize reliability over creativity.

Emergency responses must always preserve the patient's intended message and avoid generating false emergency alerts.
---

# 11. Frequently Used Vocabulary

The AI should maintain a personalized vocabulary for each patient.

Examples

- Water
- Medicine
- Food
- Family member names
- Home
- Hospital

Frequently used words should improve prediction accuracy.

---

# 13. Therapy Intelligence

Therapy sessions should generate additional training data.

Each session can provide:

- EMG signals
- Intended words
- Success rate
- Accuracy
- Patient corrections

This information can later be used to improve personalized models.

---

# 14. Doctor AI

Future capabilities

- Therapy progress analysis
- Improvement trends
- Communication statistics
- Recommended exercises

---

# 15. Caregiver AI

Future capabilities

- Daily communication summaries
- Emergency notifications
- Frequently requested needs
- Progress reports

---

# 16. Future AI Models

Module 1

Silent Speech Recognition

EMG → Text

Module 2

Context Engine

Text → Correct Sentence

Module 3

Voice Cloning

Sentence → Patient Voice

---

# 17. AI Development Roadmap

Phase 1

Dataset Collection

Phase 2

Signal Processing

Phase 3

Silent Speech Recognition

Phase 4

Context Engine

Phase 5

Voice Cloning

Phase 6

Model Optimization

Phase 7

Real-Time Inference

---

# 18. Design Principles

- Modular AI architecture.
- Patient-specific personalization.
- No fake medical outputs.
- Human validation where appropriate.
- Privacy-first design.
- Continuous improvement through therapy.
- Explainable AI wherever possible.

---
# Core AI Mission

VoiceBack aims to restore natural communication for people with aphasia by converting silent, whispered, or attempted speech into emotionally expressive spoken language using wearable EMG sensing, personalized artificial intelligence, contextual understanding, and the patient's own regenerated voice.

# AI Design Principles

The VoiceBack AI follows these principles:

1. Patient intent is always preserved.
2. AI assists communication but does not invent new meanings.
3. Context improves clarity, not correctness at the expense of intent.
4. Emotion enhances naturalness without changing the intended message.
5. Personalization is based on the patient's own communication patterns.
6. Emergency responses prioritize reliability and safety.
7. Each AI module is independent and can be upgraded without redesigning the complete system.