import pytest
import numpy as np
from app.models.audio_detector import Wav2Vec2AudioDetector

def test_audio_detector_prediction():
    detector = Wav2Vec2AudioDetector()
    # 1 second synthetic 440Hz sine wave
    sr = 16000
    t = np.linspace(0, 1.0, sr, endpoint=False)
    audio = (0.5 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)

    res = detector.predict(audio, sample_rate=sr)
    assert "real_probability" in res
    assert "fake_probability" in res
    assert "predicted_label" in res
    assert res["predicted_label"] in ("REAL", "FAKE")
    assert 0.0 <= res["real_probability"] <= 1.0
    assert 0.0 <= res["fake_probability"] <= 1.0
    assert abs(res["real_probability"] + res["fake_probability"] - 1.0) < 0.01