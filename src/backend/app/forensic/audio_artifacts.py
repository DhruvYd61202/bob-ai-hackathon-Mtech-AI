from pathlib import Path
from typing import Dict, Any, Union
import numpy as np
import librosa

def analyze_audio_forensics(
    audio_input: Union[str, Path, np.ndarray],
    sr: int = 16000
) -> Dict[str, Any]:
    """
    Computes acoustic features and heuristics as secondary supporting evidence.
    """
    if isinstance(audio_input, (str, Path)):
        p = Path(audio_input)
        if not p.exists():
            raise FileNotFoundError(f"Audio file not found: {p}")
        y, sample_rate = librosa.load(str(p), sr=sr, mono=True)
    elif isinstance(audio_input, np.ndarray):
        y = audio_input
        sample_rate = sr
    else:
        raise ValueError(f"Unsupported audio input type: {type(audio_input)}")

    if len(y) == 0:
        return {
            "duration_sec": 0.0,
            "silence_ratio": 1.0,
            "spectral_centroid_mean": 0.0,
            "spectral_rolloff_mean": 0.0,
            "zero_crossing_rate_mean": 0.0,
            "supporting_forensic_score": 0.0,
            "summary": "Audio track is empty."
        }

    duration = float(len(y) / float(sample_rate))

    # Spectral centroid (brightness)
    cent = librosa.feature.spectral_centroid(y=y, sr=sample_rate)
    cent_mean = float(np.mean(cent))
    cent_std = float(np.std(cent))

    # Spectral rolloff (high-frequency cutoff)
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sample_rate, roll_percent=0.85)
    rolloff_mean = float(np.mean(rolloff))

    # Zero crossing rate (noisiness / unvoiced speech)
    zcr = librosa.feature.zero_crossing_rate(y=y)
    zcr_mean = float(np.mean(zcr))

    # Silence ratio via RMS energy
    rms = librosa.feature.rms(y=y)[0]
    silence_threshold = np.max(rms) * 0.05 if len(rms) > 0 else 1e-4
    silence_frames = np.sum(rms < silence_threshold)
    silence_ratio = float(silence_frames / max(1, len(rms)))

    # Unnatural spectral rigidity heuristic: synthetic TTS often has unusually flat centroid variance
    rigidity_flag = cent_std < 200.0 and duration > 2.0
    abnormal_silence = silence_ratio > 0.60 or (silence_ratio < 0.02 and duration > 3.0)

    acoustic_anomaly = 0.0
    if rigidity_flag:
        acoustic_anomaly += 0.35
    if abnormal_silence:
        acoustic_anomaly += 0.25
    if cent_mean > 3500.0:
        acoustic_anomaly += 0.20

    acoustic_anomaly = float(np.clip(acoustic_anomaly, 0.0, 1.0))

    return {
        "duration_sec": round(duration, 2),
        "silence_ratio": round(silence_ratio, 4),
        "spectral_centroid_mean": round(cent_mean, 2),
        "spectral_centroid_std": round(cent_std, 2),
        "spectral_rolloff_mean": round(rolloff_mean, 2),
        "zero_crossing_rate_mean": round(zcr_mean, 4),
        "unnatural_spectral_rigidity": rigidity_flag,
        "supporting_forensic_score": round(acoustic_anomaly, 4),
        "summary": (
            f"Audio duration {duration:.1f}s, silence ratio {silence_ratio:.1%}. "
            f"Mean spectral centroid is {cent_mean:.1f} Hz (rolloff: {rolloff_mean:.1f} Hz). "
            f"{'Unnatural acoustic rigidity detected.' if rigidity_flag else 'Natural acoustic variance observed.'}"
        )
    }