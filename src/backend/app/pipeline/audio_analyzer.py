from pathlib import Path
from typing import Any, Dict, Tuple
import librosa
import numpy as np
import soundfile as sf
from app.evidence.builder import EvidenceBuilder

class AudioAnalyzer:
    def compute_audio_metrics(
        self,
        y: np.ndarray,
        sr: int,
        builder: EvidenceBuilder
    ) -> Tuple[Dict[str, Any], float]:
        findings: Dict[str, Any] = {}
        audio_risk = 0.15

        if len(y) == 0:
            findings["status"] = "empty_audio"
            return findings, 0.0

        duration = float(librosa.get_duration(y=y, sr=sr))
        findings["duration"] = round(duration, 2)
        findings["sample_rate"] = sr

        # 1. RMS Energy & Silence Ratio
        rms = librosa.feature.rms(y=y)[0]
        rms_mean = float(np.mean(rms))
        rms_std = float(np.std(rms))
        findings["rms_energy_mean"] = round(rms_mean, 4)
        findings["rms_energy_std"] = round(rms_std, 4)

        silence_threshold = 0.05 * (np.max(rms) if len(rms) > 0 else 1.0)
        silent_frames = np.sum(rms < silence_threshold)
        silence_ratio = float(silent_frames) / max(1, len(rms))
        findings["silence_ratio"] = round(silence_ratio, 3)

        if silence_ratio > 0.60:
            builder.add_audio_evidence(
                title="Elevated Audio Discontinuity / High Silence Ratio",
                description=f"Audio signal contains {silence_ratio:.1%} silence or suppressed background noise, common in spliced speech or synthesized voice fragments.",
                severity="medium",
                confidence=0.73,
                technical_details={"silence_ratio": silence_ratio}
            )
            audio_risk += 0.20

        # 2. Zero-Crossing Rate
        zcr = librosa.feature.zero_crossing_rate(y=y)[0]
        zcr_mean = float(np.mean(zcr))
        findings["zero_crossing_rate_mean"] = round(zcr_mean, 4)

        # 3. Spectral Features (Centroid, Bandwidth, Rolloff)
        spec_cent = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spec_roll = librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85)[0]

        cent_mean = float(np.mean(spec_cent))
        roll_mean = float(np.mean(spec_roll))
        findings["spectral_centroid_mean"] = round(cent_mean, 1)
        findings["spectral_rolloff_mean"] = round(roll_mean, 1)

        if sr >= 16000 and roll_mean < 2400.0:
            builder.add_audio_evidence(
                title="Acoustic Spectral High-Band Cutoff",
                description=f"Spectral rolloff frequency is restricted ({roll_mean:.0f} Hz), which can occur in vocoder-generated synthetic speech (TTS) or heavy downsampling.",
                severity="medium",
                confidence=0.74,
                technical_details={"rolloff_mean": roll_mean, "sample_rate": sr}
            )
            audio_risk += 0.25

        # 4. MFCC Features (Mel-Frequency Cepstral Coefficients)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_means = [round(float(m), 2) for m in np.mean(mfcc, axis=1)]
        mfcc_stds = [round(float(s), 2) for s in np.std(mfcc, axis=1)]
        findings["mfcc_means"] = mfcc_means
        findings["mfcc_stds"] = mfcc_stds

        if len(mfcc_stds) > 2 and np.mean(mfcc_stds[1:]) < 6.0:
            builder.add_audio_evidence(
                title="Monotonic Cepstral Variance (Robotic Cadence)",
                description="Low MFCC standard deviation across speech frames indicates robotic prosody or automated voice synthesis.",
                severity="high",
                confidence=0.80,
                technical_details={"avg_mfcc_std": round(float(np.mean(mfcc_stds[1:])), 2)}
            )
            audio_risk += 0.30

        return findings, min(max(audio_risk, 0.0), 1.0)
