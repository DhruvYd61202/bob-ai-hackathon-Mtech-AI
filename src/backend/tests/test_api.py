import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert "device" in data

@pytest.mark.asyncio
async def test_models_status_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/analysis/models/status")
        assert res.status_code == 200
        data = res.json()
        assert "models" in data
        assert "face_detector" in data["models"]
        assert "visual_detector" in data["models"]
        assert "audio_detector" in data["models"]
        assert "temporal_detector" in data["models"]
        assert "device_info" in data

@pytest.mark.asyncio
async def test_cases_list_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/cases")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)