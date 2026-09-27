# Solution Overview

## The Core Mechanism
DeepFake ForensicAI is an integrated investigative platform. When a cyber cell officer uploads suspected media (image, video, or audio), the system runs it through specialized deep learning pipelines:
- **Visual:** A Vision Transformer (ViT-Base-Patch16) extracts patch tokens and produces 12-layer attention rollout maps (Grad-CAM overlays) to highlight manipulated regions (e.g., blending seams).
- **Audio:** A Wav2Vec 2.0 classifier analyzes 16kHz acoustic energy signatures to detect latent text-to-speech (TTS) or vocoder anomalies.
- **Multimodal Fusion:** A mathematical fusion engine weighs primary model inferences (85-90%) alongside supporting signal heuristics (10-15%).

All steps are cryptographically hashed (SHA-256) into a block-linked Chain of Custody ledger. IBM Bob then consumes this verifiable evidence package to automatically draft a court-admissible forensic dossier.

## What Makes It Different from Naive Alternatives
Unlike simple "Deepfake Detector" websites that just return "98% Fake", our solution:
1. **Provides Explainability**: Attention heatmaps show *where* and *why* the model suspects tampering.
2. **Maintains Legal Admissibility**: Cryptographic hashing from ingestion to export ensures evidence integrity under ISO/IEC 27037 / Federal Rule of Evidence standards.
3. **Automates the Paperwork**: The IBM Bob agent maps the technical findings directly to relevant legal statutes (IT Act 2000 / BNS) and outputs an FIR-ready examination brief.

## Key Design Decisions
- **Pre-Trained Specialized Models**: We opted to fuse multiple state-of-the-art specialized models (ViT for visuals, Wav2Vec for audio) rather than a single generalized model, yielding higher robustness against cross-modal deepfakes.
- **Fail-Soft Architecture**: If the IBM Bob service is unreachable, the system gracefully degrades. It still processes the media, displays heatmaps, and calculates confidence scores natively without breaking the workflow.
- **Strict Schema Validation for Bob**: We strictly enforce Pydantic JSON schemas on Bob's output, implementing a targeted 1-time retry if the LLM deviates from the required legal format.

## What the User Experience Looks Like
1. The officer uploads the evidence file to the dashboard.
2. They watch in real-time as the temporal frame scrubber and acoustic analyzers process the media.
3. They review the Grad-CAM heatmaps overlaying the subject's face.
4. They click "Generate Report", prompting IBM Bob to synthesize the data into a structured dossier.
5. The final output is a 19-section PDF report with a verified hash chain, ready for submission to the court.
