# DeepFake ForensicAI — Demonstration & Evaluation Workflow

This guide outlines step-by-step procedures for evaluating the multimodal deep learning digital forensics platform, verifying IBM Bob integration, inspecting attention heatmaps, and checking chain-of-custody ledgers.

---

## 1. Automated Zero-Click Verification

To immediately verify that all models, APIs, and reporting mechanisms function correctly:

```powershell
# In project root with active venv:
.\.venv\Scripts\python.exe backend/verify_e2e.py
```
This automated script tests:
1. Health & Compute Device resolution (`cpu` or `cuda`).
2. Model status reporting for MTCNN, ViT, Wav2Vec2, and Temporal Aggregator.
3. IBM Bob reporting status via `/api/bob/status`.
4. Image analysis and self-attention rollout heatmap generation.
5. Audio waveform analysis and voice-clone synthesis detection.
6. Chain of Custody SHA-256 block ledger verification.
7. ReportLab PDF generation with Sections 18 and 19.

---

## 2. Interactive Browser Demonstration

### Step 1: Start Backend
```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend
```
- API Docs: `http://127.0.0.1:8000/docs`

### Step 2: Start Frontend
```powershell
cd frontend
$env:PATH = "C:\Users\Harshil Vashita\AppData\Roaming\fnm\node-versions\v20.20.2\installation;" + $env:PATH
npm run dev
```
- Web Application: `http://localhost:5173`

### Step 3: Test Image Ingestion & ViT Attention Maps
1. Navigate to **Upload** (`/upload`) and drag-and-drop a portrait photo.
2. Click **Execute Forensic AI Analysis**.
3. Inspect:
   - MTCNN face detection bounding box and 20% boundary margin.
   - ViT self-attention rollout overlay highlighting synthesized facial zones.
   - Structured forensic evidence list with severity filters.
   - Interactive Directed Acyclic Evidence Graph.

### Step 4: Test Video Ingestion & Audio-Visual Sync
1. Ingest a video file (MP4/WebM).
2. Scrub through the interactive timeline to inspect frame-by-frame ViT scores.
3. Review **Audio-Visual Synchronization Analysis** (Mouth aspect ratio velocity vs. speech acoustic energy envelope correlation, labeled as **Supporting Signal**).
4. Inspect the **Cryptographic Chain of Custody Ledger** with unbroken SHA-256 block signatures.

### Step 5: Test IBM Bob Integration
1. Review the **IBM Bob Load-Bearing Reporting Agent** section on the case page.
2. Note the status display (`UNAVAILABLE` with guidance to configure `backend/app/bob/config.py`).
3. Add a valid API key to `backend/app/bob/config.py` and click **Request IBM Bob Synthesis** to generate a courtroom-ready executive briefing.
4. Download the official 19-section PDF forensic examination dossier.
