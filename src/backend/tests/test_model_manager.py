import pytest
from app.models.model_manager import get_model_manager

def test_model_manager_singleton():
    m1 = get_model_manager()
    m2 = get_model_manager()
    assert m1 is m2

def test_model_manager_status():
    manager = get_model_manager()
    status = manager.get_model_status()
    assert "device_info" in status
    assert "models" in status
    assert "face_detector" in status["models"]
    assert "visual_detector" in status["models"]
    assert "audio_detector" in status["models"]
    assert "temporal_detector" in status["models"]