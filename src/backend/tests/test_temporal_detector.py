import pytest
from app.models.temporal_detector import TemporalAggregationDetector

def test_temporal_detector_consistent_sequence():
    detector = TemporalAggregationDetector()
    frame_preds = [
        {"frame_index": i, "fake_probability": 0.15, "confidence": 0.85}
        for i in range(10)
    ]
    res = detector.predict(frame_preds)
    assert res["predicted_label"] == "REAL"
    assert res["temporal_risk_score"] < 0.35
    assert res["variance"] < 0.01

def test_temporal_detector_anomalous_spike():
    detector = TemporalAggregationDetector()
    frame_preds = [
        {"frame_index": i, "fake_probability": 0.10, "confidence": 0.90}
        for i in range(10)
    ]
    # Inject heavy deepfake anomaly spike at frame 5
    frame_preds[5] = {"frame_index": 5, "fake_probability": 0.95, "confidence": 0.95}

    res = detector.predict(frame_preds)
    assert res["peak_frame_index"] == 5
    assert res["peak_fake_probability"] >= 0.90
    assert 5 in res["suspicious_frame_indices"]