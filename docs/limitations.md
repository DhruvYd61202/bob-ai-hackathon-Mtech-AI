# Forensic Limitations & Caveats — DeepFake ForensicAI

Digital forensic analysis of manipulated media involves probabilistic signal processing and neural feature extraction. DeepFake ForensicAI explicitly documents its operational boundaries and caveats.

---

## 1. Known Forensic Constraints

### 1.1 Social Media Recompression & Transcoding
Platforms like WhatsApp, Instagram, TikTok, and X apply lossy compression, spatial downscaling, and chroma subsampling.
- **Impact**: High-frequency generative artifacts and Error Level Analysis (ELA) signatures can be partially erased or artificially created by standard JPEG compression grids.
- **Mitigation**: The system inspects container metadata and down-weights heuristic compression signals when heavy social transcoding signatures are detected.

### 1.2 Adversarial Perturbations & Anti-Forensics
State-of-the-art synthetic generators may apply imperceptible noise perturbations to mislead neural classifiers into predicting `authentic`.
- **Impact**: Feature activations in Vision Transformer patch embeddings can be attenuated.
- **Mitigation**: Multimodal cross-examination—even if visual artifacts are suppressed, audio vocoder anomalies or facial landmark jitter often betray manipulation.

### 1.3 Resolution & Scale Constraints
- **Minimum Face Resolution**: MTCNN facial landmark localization requires face crops of at least $60 \times 60$ pixels for reliable 5-point alignment.
- **Audio Duration**: Audio deepfake detection (Wav2Vec 2.0) requires at least $0.5$ seconds of speech audio to extract latent acoustic representations.

### 1.4 Audio-Visual Desynchronization as a Supporting Signal
- Mouth landmark correlation with speech energy envelopes is explicitly designated as a **supporting signal**. Non-native speech rhythms, camera angle occlusions, or background noise can affect correlation without synthetic manipulation.

---

## 2. Courtroom & Legal Admissibility Notice

> [!IMPORTANT]
> **Probabilistic AI Evidence**:
> Automated neural network classifications provide statistical indicators of synthetic manipulation. Under international forensic standards (e.g., Daubert standard, Federal Rule of Evidence 702), automated results must be corroborated by a qualified digital forensic examiner prior to presentation in legal proceedings.
