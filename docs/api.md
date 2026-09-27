# REST API Reference — DeepFake ForensicAI

The backend is built with FastAPI. Interactive OpenAPI docs are available at `http://127.0.0.1:8000/docs`.

---

## 1. System & Health

### `GET /health`
Returns system status, active compute device, and version.
```json
{
  "status": "ok",
  "service": "DeepFake ForensicAI",
  "version": "1.0.0",
  "device": "cpu"
}
```

### `GET /api/analysis/models/status`
Returns loaded status, compute device allocation, architecture, and parameter counts for all neural models.

---

## 2. Ingestion & Analysis

### `POST /api/analysis/upload`
Uploads a media file (Image, Video, or Audio) for case creation.
- **Request**: Multipart Form Data (`file: UploadFile`)
- **Response**:
```json
{
  "case_id": "c1f2b3a4-...",
  "filename": "suspect_file.mp4",
  "media_type": "video",
  "file_size": 1048576,
  "status": "uploaded"
}
```

### `POST /api/analysis/analyze/{case_id}`
Executes multimodal deep learning forensic analysis on the uploaded media.
- **Response**: Full `ForensicResult` object including prediction, scores, models provenance, explanations, top suspicious frames, and evidence DAG.

### `GET /api/analysis/{case_id}`
Retrieves the complete case record, status, and analysis result.

### `GET /api/analysis/{case_id}/status`
Returns current processing status, risk level, confidence, and IBM Bob availability.

### `GET /api/analysis/{case_id}/custody`
Returns the complete cryptographic Chain of Custody ledger with verified status and block events.

### `GET /api/analysis/{case_id}/evidence`
Returns the compiled structured forensic evidence items.

### `GET /api/analysis/{case_id}/frames`
Returns all sampled frames, their prediction probabilities, timestamps, and attention overlay URLs.

### `GET /api/analysis/{case_id}/explanations`
Returns top suspicious frames and narrative explainability findings.

---

## 3. Forensic Reports & PDF Export

### `GET /api/analysis/{case_id}/report`
Returns the standalone JSON forensic examination report.

### `GET /api/analysis/{case_id}/download-report`
Downloads the official 19-section ReportLab PDF examination dossier with embedded attention heatmaps, Section 18 (IBM Bob Summary), and Section 19 (Chain of Custody Ledger).

### `POST /api/analysis/{case_id}/generate-report`
Forces regeneration of the PDF and JSON reports.

---

## 4. IBM Bob Assistant & Synthesis

### `GET /api/bob/status`
Checks configuration and endpoint reachability for IBM Bob.
```json
{
  "configured": false,
  "reachable": false,
  "service": "IBM Bob",
  "status_message": "IBM Bob reporting service unavailable (API key not configured in backend/app/bob/config.py).",
  "model": "ibm-bob-forensic-v1",
  "endpoint": "https://api.bob.ibm.com/v1"
}
```

### `POST /api/bob/generate-report/{case_id}`
Requests IBM Bob to generate an evidence-grounded forensic examination dossier for a case.

### `POST /api/bob/chat/{case_id}`
Interactive Q&A with the forensic assistant, strictly grounded in the case findings.
- **Body**: `{"message": "What models evaluated this file?"}`
- **Response**:
```json
{
  "case_id": "...",
  "query": "...",
  "answer": "...",
  "source": "IBM Bob Forensic Agent",
  "citations": ["EV-001", "EV-002"]
}
```

### `GET /api/bob/summary/{case_id}`
Generates a structured investigator executive summary.

---

## 5. Case Management

- `GET /api/cases`: Lists all cases with risk badges, file sizes, and status.
- `GET /api/cases/{case_id}`: Retrieves a single case.
- `DELETE /api/cases/{case_id}`: Deletes a case and associated artifacts.
