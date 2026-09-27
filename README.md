# DeepFake ForensicAI

## Team
- **Team Name**: MTech AI
- **Track**: Cyber Forensics
- **Lead**: Dhruv Yadav
- **Members**: Harshil Vashita, Rishabh Narayan

## Problem Statement
Deepfake videos are increasingly being used in crimes such as sextortion and fraud. Cyber cells lack a structured analysis framework, legal packaging tools, and the capability to efficiently detect synthetic media manipulation. 

## Solution
A Bob-powered cyber cell investigation assistant that guides an officer through a structured deepfake analysis checklist. It detects visual and audio anomalies using pre-trained Vision Transformers and Wav2Vec 2.0, generates an evidence summary, maps cases to IT Act 2000 / BNS sections, and produces an internal investigation brief.

## Key Features
- **Visual Deepfake Detection**: Vision Transformer with Grad-CAM overlays for explainability.
- **Audio Deepfake Detection**: Voice-Clone detection using Wav2Vec 2.0.
- **Cryptographic Chain of Custody**: Immutable audit ledger recording hashes at every step.
- **IBM Bob Integration**: Load-bearing digital forensic specialist responsible for synthesizing courtroom-ready examination dossiers.

## Tech Stack
- **Backend**: Python, FastAPI, PyTorch, Librosa, NetworkX, ReportLab
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **IBM Technologies**: IBM Bob Load-Bearing Reporting Agent

## How to Run
Please see `docs/setup-guide.md` for complete running instructions.

## Demo
- **Demo Video**: [Link to Video](demo/demo-video-link.txt)
- **Live Demo**: [Live URL](demo/live-demo-url.txt)
- **Screenshots**: See `demo/screenshots/`

## Known Limitations
- The system may struggle with extremely low-resolution or heavily compressed videos where artifacts are obliterated.
- Deepfake detection is inherently probabilistic. Results are meant to augment, not replace, human forensic experts.

## What We're Most Proud Of
We're incredibly proud of our Cryptographic Chain of Custody Audit Ledger that ensures legal admissibility standards, and our deep integration with IBM Bob to generate comprehensive, structured forensic reports automatically.
