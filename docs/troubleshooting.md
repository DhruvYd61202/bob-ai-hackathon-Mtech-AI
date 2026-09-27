# Troubleshooting & FAQ

### 1. PyTorch CPU vs CUDA
- DeepFake ForensicAI automatically configures `DEVICE = "cuda" if torch.cuda.is_available() else "cpu"`.
- CPU mode is guaranteed to function without GPU hardware.

### 2. Audio Decoding on Windows
- If a video file does not contain an audio stream or ffmpeg is not in PATH, the pipeline logs an informational limitation and proceeds with visual analysis without crashing.

### 3. Missing EXIF on Social Media Images
- Most social networks strip EXIF metadata. The pipeline flags missing EXIF as an informational/low-severity indicator and relies on pixel-level ELA and frequency spectrum analysis.
