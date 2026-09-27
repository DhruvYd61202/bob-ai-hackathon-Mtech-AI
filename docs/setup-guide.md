# Setup Guide

## Prerequisites
- **Python**: Version 3.10, 3.11, or 3.12 (64-bit).
- **Node.js**: Version 18 or 20 LTS.
- **Git**: For cloning repositories.
- **OS**: Windows 10/11, Ubuntu 22.04+, or macOS.
- **IBM Account**: Access to IBM Bob API.

## Environment Variables
Create a `.env` file in the `src/backend` directory (copied from `src/backend/.env.example`):
```env
APP_NAME=DeepFake ForensicAI
APP_VERSION=1.0.0
HOST=127.0.0.1
PORT=8000
FRONTEND_URL=http://localhost:5173
MAX_UPLOAD_SIZE_MB=500
UPLOAD_DIR=data/uploads
CASE_DIR=data/cases
REPORT_DIR=data/reports
MODEL_DIR=data/models
DEVICE=auto
OPENAI_API_KEY=
```

Additionally, configure IBM Bob inside `src/backend/app/bob/config.py`:
```python
IBM_BOB_API_KEY = "PASTE_YOUR_IBM_BOB_API_KEY_HERE"
```

## Install Commands

### Backend
```powershell
cd src/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend
```powershell
cd src/frontend
npm install
npm run build
```

## Run Commands

### Start Backend Server
```powershell
cd src/backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Start Frontend Server
```powershell
cd src/frontend
npm run dev
```

## How to Verify It's Working
1. Navigate to `http://localhost:5173` in your browser.
2. The UI should load successfully.
3. Upload a sample image or video.
4. The backend (terminal) should show processing logs.
5. You can also run the automated tests:
```powershell
cd src/backend
.\.venv\Scripts\python.exe -m pytest tests -v
```

## Troubleshooting

| Error | Cause | Solution |
| --- | --- | --- |
| `ModuleNotFoundError: No module named 'fastapi'` | Virtual environment not activated. | Run `.\.venv\Scripts\Activate.ps1` before starting the server. |
| `IBM Bob reporting service unavailable` | Missing API key. | Add your `IBM_BOB_API_KEY` to `src/backend/app/bob/config.py`. |
| `npm ERR! code ENOENT` | Running npm in wrong directory. | Ensure you are inside `src/frontend` before running `npm install`. |
| `CUDA out of memory` | GPU VRAM exhausted. | Set `DEVICE=cpu` in `.env` to fallback to CPU execution. |
