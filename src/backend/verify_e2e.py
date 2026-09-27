import io
import asyncio
from pathlib import Path
from PIL import Image
import numpy as np
import soundfile as sf
from httpx import AsyncClient, ASGITransport
from app.main import app

async def run_end_to_end_verification():
    print("=" * 65)
    print("DEEPFAKE FORENSICAI + IBM BOB LOAD-BEARING E2E VERIFICATION")
    print("=" * 65)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Check Health & Device
        print("\n[Step 1] Checking /health...")
        h_res = await client.get("/health")
        assert h_res.status_code == 200
        print("  -> Health OK:", h_res.json())

        # 2. Check Models Status
        print("\n[Step 2] Checking /api/analysis/models/status...")
        m_res = await client.get("/api/analysis/models/status")
        assert m_res.status_code == 200
        m_data = m_res.json()
        print(f"  -> Target Compute Device: {m_data['device_info']['resolved_target']}")
        for k, v in m_data["models"].items():
            print(f"  -> Model '{k}': {v['name']} (ID: {v['model_id']}, Loaded: {v['loaded']})")
        assert "face_detector" in m_data["models"]
        assert "visual_detector" in m_data["models"]
        assert "audio_detector" in m_data["models"]
        assert "temporal_detector" in m_data["models"]

        # 3. Check IBM Bob Status Endpoint
        print("\n[Step 3] Checking IBM Bob reporting service status /api/bob/status...")
        bob_stat_res = await client.get("/api/bob/status")
        assert bob_stat_res.status_code == 200
        bob_stat = bob_stat_res.json()
        print("  -> Service:", bob_stat.get("service"))
        print("  -> Configured:", bob_stat.get("configured"))
        print("  -> Status Message:", bob_stat.get("status_message"))
        print("  -> Model ID:", bob_stat.get("model"))

        # 4. Ingest Image & Analyze
        print("\n[Step 4] Ingesting and analyzing test image...")
        buf = io.BytesIO()
        img = Image.new("RGB", (300, 300), color=(180, 140, 110))
        img.save(buf, format="JPEG")
        image_bytes = buf.getvalue()

        up_res = await client.post(
            "/api/analysis/upload",
            files={"file": ("suspect_portrait.jpg", image_bytes, "image/jpeg")}
        )
        assert up_res.status_code == 200
        case_id = up_res.json()["case_id"]
        print(f"  -> Case created: {case_id}")

        ana_res = await client.post(f"/api/analysis/analyze/{case_id}")
        assert ana_res.status_code == 200
        ana_data = ana_res.json()
        print(f"  -> Analysis completed!")
        print(f"  -> Verdict: {ana_data['prediction']['label']} ({ana_data['prediction']['confidence']:.1%})")
        print(f"  -> Risk Level: {ana_data['prediction']['risk_level']}")
        print(f"  -> Bob Status: {ana_data.get('bob_status')}")
        print(f"  -> Bob Message: {ana_data.get('bob_message')}")
        print(f"  -> Evidence Count: {len(ana_data.get('evidence', []))}")

        # 5. Check Chain of Custody Audit Ledger
        print("\n[Step 5] Checking Chain of Custody /api/analysis/{case_id}/custody...")
        custody_res = await client.get(f"/api/analysis/{case_id}/custody")
        assert custody_res.status_code == 200
        custody = custody_res.json()["chain_of_custody"]
        assert custody["integrity_verified"] is True
        print(f"  -> Custody Ledger Verified: {custody['integrity_verified']}")
        print(f"  -> Total Custody Events: {custody['total_events']}")
        print(f"  -> Media SHA-256: {custody['media_sha256'][:32]}...")
        for evt in custody.get("events", [])[:4]:
            print(f"     * [{evt['event_id']}] {evt['event_type']} by {evt['actor_or_component']}: {evt['description'][:50]}...")

        # 6. Check PDF Report Generation & Retrieval (Includes Sections 18 & 19)
        print("\n[Step 6] Downloading PDF report /api/analysis/{case_id}/download-report...")
        pdf_res = await client.get(f"/api/analysis/{case_id}/download-report")
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert len(pdf_res.content) > 1000
        print(f"  -> PDF Report verified! Size: {len(pdf_res.content):,} bytes")

        # 7. Ask BOB Interactive Query
        print("\n[Step 7] Querying BOB Assistant /api/bob/chat/{case_id}...")
        bob_res = await client.post(
            f"/api/bob/chat/{case_id}",
            json={"message": "What AI models evaluated this file and why was it scored this way?"}
        )
        assert bob_res.status_code == 200
        b_data = bob_res.json()
        print("  -> BOB Response:")
        print("  " + b_data["answer"][:160].replace("\n", " ") + "...")

        # 8. Audio Test Ingest & Analyze
        print("\n[Step 8] Ingesting and analyzing test audio...")
        audio_buf = io.BytesIO()
        sr = 16000
        t = np.linspace(0, 1.0, sr, endpoint=False)
        tone = (0.5 * np.sin(2 * np.pi * 300 * t)).astype(np.float32)
        sf.write(audio_buf, tone, sr, format="WAV")
        audio_bytes = audio_buf.getvalue()

        up_aud = await client.post(
            "/api/analysis/upload",
            files={"file": ("suspect_voice.wav", audio_bytes, "audio/wav")}
        )
        aud_case_id = up_aud.json()["case_id"]
        ana_aud = await client.post(f"/api/analysis/analyze/{aud_case_id}")
        assert ana_aud.status_code == 200
        aud_data = ana_aud.json()
        print(f"  -> Audio Verdict: {aud_data['prediction']['label']} ({aud_data['prediction']['confidence']:.1%})")
        print(f"  -> Audio Model: {aud_data.get('audio', {}).get('model_name')}")

    print("\n" + "=" * 65)
    print("ALL LIVE END-TO-END VERIFICATIONS COMPLETED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    asyncio.run(run_end_to_end_verification())