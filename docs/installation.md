# Installation Guide (Windows 10/11)

## Prerequisites
- Windows 10/11
- Python 3.12 (64-bit)
- Node.js 20+ & npm

## 1. Virtual Environment Setup
```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip setuptools wheel
python -m pip install -r backend/requirements.txt
```

Verify dependency tree:
```powershell
python -m pip check
```

## 2. Frontend Setup
```powershell
cd frontend
npm install
npm run build
```
