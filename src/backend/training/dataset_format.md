# Digital Forensics Dataset Ingestion Formats

Guidelines for formatting media when training or benchmarking deepfake detection models in **DeepFake ForensicAI**.

---

## 1. Visual Deepfake Dataset (Image/Face Crops)

Visual models require pre-cropped, aligned facial images formatted in standard PyTorch ImageFolder convention:

```
dataset_root/
├── train/
│   ├── Real/
│   │   ├── genuine_0001.jpg
│   │   └── genuine_0002.jpg
│   └── Fake/
│       ├── deepfake_0001.jpg
│       └── deepfake_0002.jpg
└── val/
    ├── Real/
    └── Fake/
```

- **Resolution:** Minimum $224 \times 224$ pixels.
- **Margin:** 20% bounding box expansion to include hairline and jaw boundaries.
- **Normalization:** ImageNet mean `[0.485, 0.456, 0.406]` and std `[0.229, 0.224, 0.225]`.

---

## 2. Audio Spoof Dataset (Speech Audio)

Audio models expect uncompressed or lossless audio waveforms normalized to 16,000 Hz mono:

```
audio_dataset/
├── protocol.txt          # Mapping: audio_id label (bonafide / spoof)
└── flac/
    ├── bonafide_001.flac
    └── spoof_001.flac
```

- **Format:** 16-bit PCM WAV or FLAC.
- **Channels:** Single-channel mono.
- **Sample Rate:** 16,000 Hz.