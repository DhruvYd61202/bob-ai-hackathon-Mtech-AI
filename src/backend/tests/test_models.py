import pytest
from app.models.registry import MODEL_REGISTRY, get_model_metadata

def test_registry_contains_required_models():
    assert "facenet_mtcnn" in MODEL_REGISTRY
    assert "vit_deepfake_image" in MODEL_REGISTRY
    assert "wav2vec2_deepfake_audio" in MODEL_REGISTRY
    assert "temporal_aggregation_engine" in MODEL_REGISTRY

def test_vit_model_metadata():
    meta = get_model_metadata("vit_deepfake_image")
    assert meta is not None
    assert meta.model_id == "dima806/deepfake_vs_real_image_detection"
    assert "Vision Transformer" in meta.name
    assert meta.role == "visual_detector"
    assert "0" in meta.classes and "1" in meta.classes

def test_audio_model_metadata():
    meta = get_model_metadata("wav2vec2_deepfake_audio")
    assert meta is not None
    assert meta.model_id == "MelodyMachine/Deepfake-audio-detection"
    assert meta.role == "audio_detector"