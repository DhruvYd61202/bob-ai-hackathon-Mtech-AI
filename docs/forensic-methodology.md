# Digital Forensic Methodology — DeepFake ForensicAI

DeepFake ForensicAI adheres to standardized digital multimedia forensic investigation standards (SWGDE / ENFSI recommendations), combining quantitative deep learning inferences with corroborating physical signal heuristics and an unbroken chain of custody.

---

## 1. Evidence Extraction Workflow

```
[Ingested Media] ──► SHA-256 / MD5 Hash Digest Registered ──► Custody Block 001
        │
        ├── Metadata Extraction: EXIF, XMP, Container Atoms, Software Signatures
        ├── Video Processing: Uniform FPS Sampling (OpenCV / Decord fallback)
        ├── Audio Extraction: 16 kHz Mono Waveform Extraction (Librosa / SoundFile)
        │
        ▼
[Facial Localization] ──► MTCNN Multi-Task Cascades (P-Net / R-Net / O-Net)
        │                 Bounding Box Crop + 20% Anatomical Margin + Landmarks
        ▼
[Deep Learning Inferences]
        ├── Visual: ViT-Base Self-Attention Rollout (12 Transformer Layers)
        ├── Acoustic: Wav2Vec 2.0 Latent Representation Classification
        ├── Temporal: Sequence Variance & Peak Frame Scrubbing
        └── Audio-Visual Sync: Mouth Velocity & Acoustic Energy Correlation
        │
        ▼
[Secondary Forensic Heuristics]
        ├── Error Level Analysis (ELA): JPEG 90-85% Differential Recompression
        ├── 2D-FFT Spectral Analysis: Azimuthal High-Frequency Energy Ratio
        ├── Video Jitter: Inter-frame Laplacian Blur Deviation
        └── Audio Forensics: Spectral Centroid, Rolloff, Zero Crossing Rate
        │
        ▼
[Multimodal Fusion Engine] ──► Verdict & Calibrated Risk Assessment
        │
        ├── Directed Acyclic Graph (DAG) Assembly
        ├── IBM Bob Evidence Package Synthesis
        └── ReportLab PDF (19 Sections) & Standalone JSON Export
```

---

## 2. Multimodal Fusion Engine Calibration

Primary deep learning models constitute **85% to 90%** of the fusion weight. Heuristic signals contribute **10% to 15%** solely as corroborative modifiers:

- **Static Image Media**:
  $$\text{Score}_{\text{fusion}} = 0.85 \cdot P_{\text{ViT}} + 0.08 \cdot \text{ELA}_{\text{anom}} + 0.07 \cdot \text{FFT}_{\text{anom}}$$
- **Video Media**:
  $$\text{Score}_{\text{fusion}} = 0.50 \cdot P_{\text{temporal}} + 0.35 \cdot P_{\text{audio}} + 0.10 \cdot \text{Video}_{\text{heuristics}} + 0.05 \cdot \text{Metadata}$$
  *(If no audio track is present, temporal sequence risk represents 85% of total score).*
- **Pure Audio Media**:
  $$\text{Score}_{\text{fusion}} = 0.90 \cdot P_{\text{Wav2Vec2}} + 0.10 \cdot \text{Acoustic}_{\text{heuristics}}$$

### Threshold Classification:
- **`potentially_manipulated` (High Risk)**: Fusion score $\ge 0.65$
- **`inconclusive` (Medium Risk)**: $0.35 \le$ Fusion score $< 0.65$
- **`authentic` (Low Risk)**: Fusion score $< 0.35$

---

## 3. Explainability via Attention Rollout

Rather than treating deep learning classifications as uninterpretable scores, DeepFake ForensicAI reconstructs attention flow through all 12 Vision Transformer layers. High-activation coordinates indicate:
1. **Facial Boundary Inconsistencies**: Warped skin boundaries, irregular jawline blending, mismatched skin tones.
2. **Frequency Discontinuities**: Artificial smoothing near hair strands, eyes, and mouth contours.
3. **Artifact Localization**: Generative adversarial artifacts localized on the highest-scoring face crop.

---

## 4. Chain of Custody & Evidentiary Admissibility

To satisfy legal admissibility requirements (Federal Rule of Evidence 901/902 / ISO/IEC 27037):
1. **Cryptographic Hashing**: File SHA-256 and MD5 hashes are computed prior to any processing.
2. **Deterministic Processing**: All frame extraction rates, crop dimensions, and normalization parameters are recorded.
3. **Model Provenance**: Specific model repository IDs, checkpoint hashes, parameter counts, and inference devices (CPU/CUDA) are embedded in the case record.
4. **Audit Ledger**: Every event is block-linked with previous event signatures, preventing post-facto alteration.
