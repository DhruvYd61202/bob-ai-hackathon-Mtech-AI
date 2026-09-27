import pytest
from PIL import Image
import numpy as np
from app.models.visual_detector import ViTDeepfakeDetector

def test_visual_detector_prediction():
    detector = ViTDeepfakeDetector()
    img = Image.new("RGB", (224, 224), color=(140, 120, 100))
    res = detector.predict(img, return_attention=True)

    assert "real_probability" in res
    assert "fake_probability" in res
    assert "predicted_label" in res
    assert res["predicted_label"] in ("REAL", "FAKE")
    assert 0.0 <= res["real_probability"] <= 1.0
    assert 0.0 <= res["fake_probability"] <= 1.0
    assert abs(res["real_probability"] + res["fake_probability"] - 1.0) < 0.01

    attn = res.get("attention_map")
    assert attn is not None
    assert isinstance(attn, (list, np.ndarray))
    assert len(attn) == 14
    assert len(attn[0]) == 14