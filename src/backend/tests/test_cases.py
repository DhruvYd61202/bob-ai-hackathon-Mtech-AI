import io
import pytest
from httpx import AsyncClient, ASGITransport
from PIL import Image
from app.main import app

def create_test_image_bytes():
    buf = io.BytesIO()
    img = Image.new("RGB", (64, 64), color=(200, 100, 50))
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()

@pytest.mark.asyncio
async def test_case_lifecycle():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Upload
        files = {"file": ("lifecycle_test.png", create_test_image_bytes(), "image/png")}
        up_res = await client.post("/api/analysis/upload", files=files)
        assert up_res.status_code == 200
        case_id = up_res.json()["case_id"]

        # 2. List cases
        list_res = await client.get("/api/cases")
        assert list_res.status_code == 200
        cases = list_res.json()
        assert any(c["case_id"] == case_id for c in cases)

        # 3. Get single case
        get_res = await client.get(f"/api/cases/{case_id}")
        assert get_res.status_code == 200
        assert get_res.json()["case_id"] == case_id

        # 4. Analyze case
        ana_res = await client.post(f"/api/analysis/analyze/{case_id}")
        assert ana_res.status_code == 200
        assert ana_res.json()["case_id"] == case_id

        # 5. Get report
        rep_res = await client.get(f"/api/analysis/{case_id}/report")
        assert rep_res.status_code == 200

        # 6. Get PDF report
        pdf_res = await client.get(f"/api/analysis/{case_id}/report/pdf")
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"

        # 7. Delete case
        del_res = await client.delete(f"/api/cases/{case_id}")
        assert del_res.status_code == 200

        # 8. Verify 404 after deletion
        get_after = await client.get(f"/api/cases/{case_id}")
        assert get_after.status_code == 404
