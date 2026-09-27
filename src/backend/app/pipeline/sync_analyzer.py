import logging
from typing import Any, Dict, List, Optional
import numpy as np

logger = logging.getLogger(__name__)

class AudioVisualSyncAnalyzer:
    """
    Evaluates temporal synchronization between visual mouth movement dynamics
    and speech acoustic energy.
    Explicitly categorized and reported as a SUPPORTING forensic signal.
    """

    def analyze_sync(
        self,
        frame_landmarks: List[Dict[str, Any]],
        audio_waveform: Optional[np.ndarray],
        sample_rate: int = 16000
    ) -> Dict[str, Any]:
        """
        Calculates correlation between facial mouth landmark velocities and speech energy envelopes.
        
        Args:
            frame_landmarks: List of dicts per sampled frame with:
                - 'frame_index': int
                - 'timestamp_sec': float
                - 'landmarks': 5-point dict or list (left_eye, right_eye, nose, mouth_left, mouth_right)
            audio_waveform: 1D numpy array of 16kHz audio samples
            sample_rate: Audio sampling frequency (default 16000)
            
        Returns:
            Dict containing sync score, desync risk, correlation metric, and supporting signal designation.
        """
        if audio_waveform is None or len(audio_waveform) == 0:
            return {
                "available": False,
                "status": "no_audio",
                "sync_score": 1.0,
                "desync_risk": 0.0,
                "correlation": 0.0,
                "is_supporting_signal": True,
                "evidence_label": "Synchronization evidence: supporting signal",
                "finding_summary": "Video contains no extracted audio track; synchronization analysis skipped."
            }

        valid_frames = [f for f in frame_landmarks if f.get("landmarks") is not None]
        if len(valid_frames) < 3:
            return {
                "available": False,
                "status": "insufficient_faces",
                "sync_score": 1.0,
                "desync_risk": 0.0,
                "correlation": 0.0,
                "is_supporting_signal": True,
                "evidence_label": "Synchronization evidence: supporting signal",
                "finding_summary": "Fewer than 3 facial landmark detections available for temporal correlation."
            }

        # 1. Compute mouth aperture metric per frame
        # MTCNN provides: left_eye, right_eye, nose, mouth_left, mouth_right
        apertures = []
        timestamps = []
        for f in valid_frames:
            lm = f["landmarks"]
            # Can be dict with keys or list
            try:
                if isinstance(lm, dict):
                    ml = np.array(lm.get("mouth_left", [0, 0]))
                    mr = np.array(lm.get("mouth_right", [0, 0]))
                    nose = np.array(lm.get("nose", [0, 0]))
                elif isinstance(lm, (list, tuple)) and len(lm) >= 5:
                    nose = np.array(lm[2])
                    ml = np.array(lm[3])
                    mr = np.array(lm[4])
                else:
                    continue

                mouth_center = (ml + mr) / 2.0
                mouth_width = np.linalg.norm(mr - ml)
                nose_to_mouth = np.linalg.norm(mouth_center - nose)

                # Normalized mouth aspect ratio proxy
                mar = float(nose_to_mouth / max(mouth_width, 1e-4))
                apertures.append(mar)
                timestamps.append(float(f.get("timestamp_sec", 0.0)))
            except Exception as e:
                logger.debug(f"Landmark parsing error: {e}")
                continue

        if len(apertures) < 3:
            return {
                "available": False,
                "status": "insufficient_landmarks",
                "sync_score": 1.0,
                "desync_risk": 0.0,
                "correlation": 0.0,
                "is_supporting_signal": True,
                "evidence_label": "Synchronization evidence: supporting signal",
                "finding_summary": "Insufficient facial landmark geometry for synchronization evaluation."
            }

        # Compute mouth velocity (diff)
        mouth_velocities = np.abs(np.diff(apertures))
        # Midpoint timestamps for velocity
        vel_timestamps = [(timestamps[i] + timestamps[i+1]) / 2.0 for i in range(len(apertures) - 1)]

        # 2. Extract speech energy envelope corresponding to each frame window
        window_sec = 0.2  # 200ms window
        audio_energies = []
        total_audio_sec = len(audio_waveform) / sample_rate

        for t in vel_timestamps:
            start_sample = max(0, int((t - window_sec / 2) * sample_rate))
            end_sample = min(len(audio_waveform), int((t + window_sec / 2) * sample_rate))
            if end_sample > start_sample:
                segment = audio_waveform[start_sample:end_sample]
                rms = float(np.sqrt(np.mean(segment ** 2)))
            else:
                rms = 0.0
            audio_energies.append(rms)

        audio_energies = np.array(audio_energies)

        # 3. Compute Pearson correlation
        if np.std(mouth_velocities) > 1e-6 and np.std(audio_energies) > 1e-6:
            r_matrix = np.corrcoef(mouth_velocities, audio_energies)
            correlation = float(r_matrix[0, 1])
            if np.isnan(correlation):
                correlation = 0.0
        else:
            correlation = 0.0

        # Sync score mapping:
        # Natural speech typically exhibits positive correlation between mouth opening velocity and speech energy
        # (r in range 0.2 to 0.8). Desynchronization or lip-sync dubbing often shows near-zero or negative correlation.
        # Normalize into [0, 1] where 1.0 = well-synchronized, lower = desynchronization anomaly.
        sync_score = float(np.clip((correlation + 0.3) / 1.1, 0.05, 0.99))
        desync_risk = float(round(1.0 - sync_score, 4))

        is_anomalous = desync_risk > 0.65
        summary = (
            f"Audio-visual sync correlation r={correlation:.3f}. "
            f"{'High audio-visual desynchronization detected; potential synthetic dubbing/lip-sync artifact.' if is_anomalous else 'Facial articulation aligns within expected acoustic timing tolerances.'}"
        )

        return {
            "available": True,
            "status": "evaluated",
            "sync_score": round(sync_score, 4),
            "desync_risk": desync_risk,
            "correlation": round(correlation, 4),
            "sampled_windows": len(vel_timestamps),
            "is_supporting_signal": True,
            "evidence_label": "Synchronization evidence: supporting signal",
            "is_anomalous": is_anomalous,
            "finding_summary": summary,
            "details": {
                "correlation_coefficient": round(correlation, 4),
                "total_frames_evaluated": len(apertures),
                "aperture_variance": float(round(np.var(apertures), 6)),
                "audio_energy_variance": float(round(np.var(audio_energies), 6))
            }
        }

sync_analyzer = AudioVisualSyncAnalyzer()
