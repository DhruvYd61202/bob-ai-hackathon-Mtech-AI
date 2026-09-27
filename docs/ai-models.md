# Pre-Trained Deep Learning Models & AI Architecture — DeepFake ForensicAI

DeepFake ForensicAI strictly employs verified, pre-trained neural network architectures for primary deepfake classification across visual, facial, acoustic, and temporal modalities.

---

## 1. Visual Deepfake Detection: Vision Transformer (ViT)

- **Model ID**: `dima806/deepfake_vs_real_image_detection`
- **Architecture**: `ViT-Base-Patch16-224` (Vision Transformer, Base configuration)
- **Parameters**: ~86 Million
- **Input Dimensions**: 224 &times; 224 &times; 3 RGB
- **Patch Resolution**: 16 &times; 16 pixels (196 total spatial patch tokens + 1 `[CLS]` token)
- **Role**: Primary visual classifier for static images and extracted video frames.
- **Explainability**: Computes self-attention rollout across all 12 transformer encoder blocks. The resulting attention weight distribution highlights localized boundaries, warped facial seams, blended contours, or unnatural textures.

### Mathematical Formulation of Patch Attention Rollout:
Given attention weight matrices $A_l$ for each layer $l \in [1, L]$:
$$A_{\text{rollout}} = \prod_{l=1}^{L} (0.5 \cdot A_l + 0.5 \cdot I)$$
Where $I$ is the identity matrix reflecting residual connections. The `[CLS]` token attention over spatial patches provides the raw heatmap for Grad-CAM overlay generation.

---

## 2. Facial Detection & Landmark Localization: MTCNN

- **Model ID**: `facenet-pytorch/mtcnn`
- **Architecture**: Multi-Task Cascaded Convolutional Networks (P-Net, R-Net, O-Net)
- **Role**: Locates human faces in raw imagery, calculates 5-point facial keypoints (`left_eye`, `right_eye`, `nose`, `mouth_left`, `mouth_right`), and performs 20% margin bounding box expansion to capture boundary blending artifacts.
- **Fail-Soft Behavior**: If no human faces are detected (e.g., synthetic landscape or full-body shot), analysis gracefully shifts to full-image Vision Transformer evaluation.

---

## 3. Audio Deepfake & Voice Clone Detection: Wav2Vec 2.0

- **Model ID**: `MelodyMachine/Deepfake-audio-detection`
- **Architecture**: Wav2Vec 2.0 (Self-Supervised Pretrained Acoustic Model)
- **Parameters**: ~95 Million
- **Input Format**: 16 kHz Mono Raw Audio Waveform
- **Role**: Analyzes voice tracks extracted from MP4, WebM, WAV, MP3, and FLAC containers for synthetic vocoder signatures, text-to-speech (TTS) latent anomalies, and voice conversion artifacts.
- **Preprocessing**: Automatic stereo-to-mono downmixing and librosa/soundfile 16,000 Hz resampling.

---

## 4. Video-Level Temporal Consistency Aggregator

- **Model ID**: `forensic_ai/temporal_aggregator_v1`
- **Architecture**: Multi-Frame Sequence Anomaly & Variance Tracking Engine
- **Role**: Models frame-to-frame stability across sampled video frames.
- **Metrics Computed**:
  - `temporal_risk_score`: Weighted combination of prediction jitter, variance, and peak anomalies.
  - `inter_frame_jitter`: $\frac{1}{N-1}\sum_{i=1}^{N-1} |P(F_{i+1}) - P(F_i)|$
  - `variance`: $\sigma^2(P(F))$ across all sampled frames.
  - `peak_frame_index`: Identifies the exact video timestamp of maximum anomalous synthetic probability for forensic scrutiny.

---

## 5. Audio-Visual Synchronization Analyzer

- **Model ID**: `sync_analyzer_v1`
- **Role**: Supporting signal tracking the temporal coherence between facial articulation and speech acoustics.
- **Methodology**:
  1. Computes Mouth Aspect Ratio (MAR) proxy across frames from MTCNN landmarks.
  2. Computes mouth opening velocity: $\Delta \text{MAR}_i = |\text{MAR}_{i+1} - \text{MAR}_i|$.
  3. Computes RMS acoustic energy envelope in corresponding 200ms audio windows.
  4. Calculates Pearson correlation coefficient $r$.
- **Designation**: Explicitly tagged as `"Synchronization evidence: supporting signal"` (supporting evidence, not primary detector).

---

## 6. Model Provenance Registry Summary

| Model Component | Framework | Primary Input | Parameters | Execution Device |
|:---|:---|:---|:---|:---|
| ViT Deepfake Detector | PyTorch / Transformers | 224x224 RGB Image | 86.4M | CPU / CUDA auto |
| Wav2Vec 2.0 Audio | PyTorch / Transformers | 16 kHz Mono Waveform | 95.0M | CPU / CUDA auto |
| MTCNN Face Cascade | PyTorch / facenet-pytorch | Arbitrary RGB Image | 3.8M | CPU / CUDA auto |
| Temporal Aggregator | PyTorch / NumPy | Sequence of Probabilities | Algorithmic | CPU |
| Sync Analyzer | NumPy / SciPy | Landmarks + Audio Envelope | Algorithmic | CPU |
