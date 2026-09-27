# Evidence Model & Schema

Every observation in DeepFake ForensicAI is modeled as a strongly-typed evidence item:

```json
{
  "id": "EV-VIS-001",
  "category": "visual",
  "title": "Compression Inconsistency (ELA)",
  "description": "Error Level Analysis detected elevated compression residual variance.",
  "severity": "medium",
  "confidence": 0.76,
  "source": "VisualAnalyzer",
  "frame_number": null,
  "technical_details": { "ela_mean": 48.2 }
}
```

## Categories
- `metadata`: Camera EXIF, software signatures, codec data
- `visual`: ELA, Laplacian noise residual, FFT frequency spectrum
- `face`: MTCNN bounding box localization, focal blur disparity
- `audio`: Spectral rolloff, silence ratios, MFCC variance
- `temporal`: Frame jitter, facial flicker, inter-frame transitions
- `model`: Heuristic or deep learning engine diagnostic output
- `system`: System-level events and operational notices

## Evidence Graph Structure
NetworkX constructs a directed acyclic graph:
- `Case` -> `Media` -> `Frames` -> `Faces` -> `Signals` -> `Evidence` -> `Conclusion`
