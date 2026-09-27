import io
import pytest
from httpx import AsyncClient, ASGITransport
from PIL import Image
from app.main import app

def create_test_image_bytes():
    buf = io.BytesIO()
    img = Image.new("RGB", (64, 64), color=(128, 64, 200))
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()

@pytest.mark.asyncio
async def test_valid_image_upload():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        image_bytes = create_test_image_bytes()
        files = {"file": ("test_image.png", image_bytes, "image/png")}
        response = await client.post("/api/analysis/upload", files=files)
        assert response.status_code == 200
        data = response.json()
        assert "case_id" in data
        assert data["filename"] == "test_image.png"
        assert data["media_type"] == "image"
        assert data["status"] == "uploaded"

@pytest.mark.asyncio
async def test_invalid_extension_upload():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        files = {"file": ("bad_script.sh", b"#!/bin/bash\necho 1", "text/plain")}
        response = await client.post("/api/analysis/upload", files=files)
        assert response.status_code == 415
