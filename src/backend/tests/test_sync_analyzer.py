import numpy as np
from app.pipeline.sync_analyzer import AudioVisualSyncAnalyzer

def test_sync_analyzer_no_audio():
    analyzer = AudioVisualSyncAnalyzer()
    res = analyzer.analyze_sync(frame_landmarks=[], audio_waveform=None)
    assert res["available"] is False
    assert res["status"] == "no_audio"
    assert res["is_supporting_signal"] is True
    assert "supporting signal" in res["evidence_label"].lower()

def test_sync_analyzer_insufficient_faces():
    analyzer = AudioVisualSyncAnalyzer()
    waveform = np.sin(np.linspace(0, 100, 16000))
    res = analyzer.analyze_sync(frame_landmarks=[], audio_waveform=waveform)
    assert res["available"] is False
    assert res["status"] == "insufficient_faces"
    assert res["is_supporting_signal"] is True

def test_sync_analyzer_with_landmarks_and_audio():
    analyzer = AudioVisualSyncAnalyzer()
    # Create 5 synthetic frames with landmarks
    frames = []
    for i in range(10):
        # Vary mouth width/height
        m_aperture = 20.0 + 10.0 * np.sin(i * 0.5)
        landmarks = {
            "left_eye": [40, 40],
            "right_eye": [60, 40],
            "nose": [50, 50],
            "mouth_left": [40, 50 + m_aperture],
            "mouth_right": [60, 50 + m_aperture]
        }
        frames.append({
            "frame_index": i,
            "timestamp_sec": float(i) * 0.2,
            "landmarks": landmarks
        })

    # Create 2.0s audio waveform at 16kHz
    t = np.linspace(0, 2.0, 32000)
    waveform = (np.sin(2 * np.pi * 440 * t) * (np.sin(t * 3) ** 2)).astype(np.float32)

    res = analyzer.analyze_sync(frame_landmarks=frames, audio_waveform=waveform, sample_rate=16000)
    assert res["available"] is True
    assert res["status"] == "evaluated"
    assert res["is_supporting_signal"] is True
    assert 0.0 <= res["sync_score"] <= 1.0
    assert 0.0 <= res["desync_risk"] <= 1.0
    assert "correlation" in res
    assert "details" in res
