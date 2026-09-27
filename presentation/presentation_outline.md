# DeepFake ForensicAI — Presentation Outline

## Slide 1: Title
- **DeepFake ForensicAI**
- Multimodal Digital Forensics for Detecting and Explaining Manipulated Media
- Presenter / Forensic Engineering Team

## Slide 2: Problem
- Proliferation of generative AI, deepfakes, face swapping, and voice cloning.
- Severe erosion of trust in digital media, legal evidence, news, and executive communications.

## Slide 3: Motivation
- Need for transparent, explainable digital forensics rather than opaque black-box classifiers.
- Regulatory requirement for chain-of-evidence documentation and courtroom admissibility.

## Slide 4: Existing Challenges
- High false-positive rates from compression artifacts.
- Inability of monolithic models to explain *why* media was flagged.
- Fragility when media lacks faces or audio streams.

## Slide 5: Proposed System
- Multi-channel forensic pipeline covering images, videos, and audio.
- Deterministic heuristic signals paired with structured evidence graphs.
- BOB conversational investigator assistant for transparent briefings.

## Slide 6: Architecture
- FastAPI REST backend + React 18 / TypeScript / Vite frontend.
- CPU-first execution with automatic CUDA acceleration.
- Local filesystem storage (`data/uploads`, `data/cases`, `data/reports`).

## Slide 7: Multimodal Analysis
- Independent inspection across visual, acoustic, temporal, and metadata channels.
- Weighted deterministic fusion layer mapping to standardized verdict thresholds.

## Slide 8: Face Analysis
- MTCNN multi-task cascaded neural face localization.
- Facial focal blur discrepancy against scene backgrounds.
- Anatomical boundary blending detection.

## Slide 9: Audio Analysis
- Librosa & Soundfile feature extraction.
- Spectral rolloff analysis detecting synthetic voice high-band cutoff (< 2400 Hz).
- Mel-Frequency Cepstral Coefficient (MFCC) dynamic variance tracking robotic prosody.

## Slide 10: Temporal Analysis
- Discrete video frame sampling (up to 32 frames).
- Bounding box geometry jitter and inter-frame structural difference metrics.
- Facial flickering detection identifying intermittent face replacement loss.

## Slide 11: Evidence Graph
- NetworkX directed acyclic graph linking Case -> Media -> Frames -> Faces -> Signals -> Evidence -> Verdict.
- Interactive node visualizer in investigator dashboard.

## Slide 12: BOB (Forensic Assistant)
- Behavioral / Observation-based Forensic Briefing.
- Answers investigator queries strictly grounded in recorded evidence.
- Zero fabrication guarantee with frame citations.

## Slide 13: Dashboard & UX
- Forensic dark cybersecurity interface.
- Real-time progress tracker, risk badges, channel scorecards, and timeline.

## Slide 14: Workflow
- Upload media -> Automated pipeline execution -> Dossier inspection -> Investigator Q&A -> PDF report export.

## Slide 15: Results & Performance
- Sub-second image analysis on CPU.
- Comprehensive 17-section PDF report generation in milliseconds.
- 100% test pass rate across 19 unit & integration tests.

## Slide 16: Limitations
- Heuristic signals provide investigative indicators, not mathematical certainty.
- High-loss video compression can mask subtle artifacts.

## Slide 17: Future Work
- Integration of custom fine-tuned MesoNet and EfficientNet-B4 weights into `ModelInferenceEngine`.
- Cryptographic C2PA media provenance verification.

## Slide 18: Conclusion
- DeepFake ForensicAI bridges the gap between AI detection and forensic accountability.
- Production-ready, explainable, and fully functional on Windows CPU.
