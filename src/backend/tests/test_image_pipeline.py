import pytest
from pathlib import Path
from PIL import Image
from app.pipeline.image_pipeline import ImagePipeline

def test_image_pipeline_execution(tmp_path):
    # Create test image
    test_img_path = tmp_path / "test_face.jpg"
    img = Image.new("RGB", (250, 250), color=(150, 120, 100))
    img.save(test_img_path)

    pipeline = ImagePipeline()
    case_id = "test_case_image_001"
    res = pipeline.process(test_img_path, case_id)

    assert res["media_type"] == "image"
    assert "primary_visual_ai" in res
    assert "fusion" in res
    assert "explanation" in res
    assert 0.0 <= res["fusion"]["fake_probability"] <= 1.0