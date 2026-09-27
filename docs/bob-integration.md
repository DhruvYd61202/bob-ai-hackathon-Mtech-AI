# IBM Bob Load-Bearing Forensic Reporting Agent — Integration Guide

DeepFake ForensicAI integrates **IBM Bob** as a load-bearing reporting agent designed to synthesize structured, courtroom-ready forensic reports from genuine deep learning model outputs.

---

## 1. Architectural Philosophy: Load-Bearing & Grounded

- **Not a Static Mock**: IBM Bob is actively invoked during forensic analysis. It receives the verified findings and generates a structured analysis dossier.
- **Evidence-Grounded**: Bob is constrained by strict prompts and the structured evidence package. It does not fabricate findings or guess unmeasured values.
- **Centralized Credential File**: All IBM Bob configuration parameters are housed in:
  `backend/app/bob/config.py`
  No keys are scattered across `.env` or other files.
- **Transparent Fallback**: When `IBM_BOB_API_KEY` is not configured or the endpoint is unreachable, the system transparently reports:
  `"IBM Bob reporting service unavailable."`
  All pre-trained AI vision and audio models execute normally, and their primary evidence is displayed without pretending Bob generated the report.

---

## 2. Configuration (`backend/app/bob/config.py`)

```python
# backend/app/bob/config.py

# Paste your IBM Bob API key here
IBM_BOB_API_KEY = "PASTE_YOUR_IBM_BOB_API_KEY_HERE"

# IBM Bob Service Endpoint
IBM_BOB_ENDPOINT = "https://api.bob.ibm.com/v1"

# Default IBM Bob Forensic Model
IBM_BOB_MODEL = "ibm-bob-forensic-v1"

# Request timeout in seconds
IBM_BOB_TIMEOUT_SECONDS = 30
```

---

## 3. Evidence Package & Output Schemas

### Input: `BobEvidencePackage`
Sent to IBM Bob containing the verified forensic findings:
```python
class BobEvidencePackage(BaseModel):
    case_id: str
    media_name: str
    media_type: str
    file_sha256: str
    file_size_bytes: int
    verdict: str
    confidence: float
    risk_level: str
    scores: Dict[str, float]
    ai_models_used: List[Dict[str, str]]
    face_analysis: Optional[Dict[str, Any]]
    visual_analysis: Optional[Dict[str, Any]]
    audio_analysis: Optional[Dict[str, Any]]
    temporal_analysis: Optional[Dict[str, Any]]
    sync_analysis: Optional[Dict[str, Any]]
    metadata_analysis: Optional[Dict[str, Any]]
    top_evidence_items: List[Dict[str, Any]]
    limitations: List[str]
    timestamp: str
```

### Output: `BobReportOutput`
Strictly parsed and validated against this Pydantic schema:
```python
class BobReportOutput(BaseModel):
    case_summary: str
    overall_forensic_assessment: str
    verdict_statement: str
    visual_forensic_analysis: str
    audio_forensic_analysis: str
    temporal_forensic_analysis: str
    synchronization_analysis: str
    metadata_forensic_analysis: str
    conflicting_evidence_analysis: str
    limitations_and_caveats: List[str]
    forensic_recommendations: List[str]
    confidence_assessment: str
    chain_of_custody_notes: str
    generated_at: str
    model_id: str
```

---

## 4. Validation & Corrective Retry Mechanism

If IBM Bob returns a response that deviates from the schema:
1. `ReportValidator.parse_and_validate` detects the missing or invalid fields.
2. A targeted `correction_prompt` is constructed specifying the exact validation errors.
3. The service executes an automatic **1-time corrective retry** with temperature adjusted to $0.05$ and `response_format={"type": "json_object"}`.
4. If the retry succeeds, the validated report is stored and embedded into the PDF/JSON dossier.
5. If communication fails or times out, the service logs a sanitized diagnostic message (never exposing credentials) and gracefully records `"IBM Bob reporting service unavailable."`.

---

## 5. API Endpoints

- `GET /api/bob/status`: Checks if IBM Bob is configured and verifies endpoint reachability.
- `POST /api/bob/generate-report/{case_id}`: Triggers on-demand Bob report generation for a case.
- `POST /api/bob/chat/{case_id}`: Interactive Q&A grounded strictly in case findings.
- `GET /api/bob/summary/{case_id}`: Returns investigator executive summary.
