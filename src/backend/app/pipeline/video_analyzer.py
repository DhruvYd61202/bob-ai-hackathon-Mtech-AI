import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import cv2
import librosa
import numpy as np
from PIL import Image
from app.core.config import settings
from app.evidence.builder import EvidenceBuilder
from app.evidence.graph import EvidenceGraphBuilder
from app.pipeline.audio_analyzer import AudioAnalyzer

class VideoAnalyzer:
    def __init__(self, mtcnn, audio_analyzer: AudioAnalyzer):
        self.mtcnn = mtcnn
        self.audio_analyzer = audio_analyzer

    def sample_and_analyze_frames(
        self,
        file_path: Path,
        graph_builder: EvidenceGraphBuilder,
        max_samples: int = 32
    ) -> Tuple[Dict[str, Any], List[Dict[str, Any]], List[float], List[float], List[float]]:
        cap = cv2.VideoCapture(str(file_path))
        if not cap.isOpened():
            raise RuntimeError(f"Could not open video file: {file_path.name}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 25.0)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = round(total_frames / fps, 2) if (total_frames > 0 and fps > 0) else 0.0
        fourcc = int(cap.get(cv2.CAP_PROP_FOURCC))
        codec = "".join([chr((fourcc >> 8 * i) & 0xFF) for i in range(4)])

        media_info = {
            "filename": file_path.name,
            "media_type": "video",
            "total_frames": total_frames,
            "fps": round(fps, 2),
            "duration": duration,
            "width": width,
            "height": height,
            "resolution": f"{width}x{height}",
            "codec": codec,
            "file_size": file_path.stat().st_size
        }

        if total_frames <= 0:
            sample_indices = [0]
        elif total_frames <= max_samples:
            sample_indices = list(range(total_frames))
        else:
            step = max(1, total_frames // max_samples)
            sample_indices = [i * step for i in range(min(max_samples, total_frames // step))]

        face_detections_per_frame: List[Dict[str, Any]] = []
        blur_scores: List[float] = []
        luminance_scores: List[float] = []
        frame_diffs: List[float] = []

        prev_gray: Optional[np.ndarray] = None

        for f_idx in sample_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, f_idx)
            ret, frame = cap.read()
            if not ret or frame is None:
                continue

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            blur_scores.append(lap_var)
            lum = float(np.mean(gray))
            luminance_scores.append(lum)

            if prev_gray is not None and prev_gray.shape == gray.shape:
                diff = float(np.mean(cv2.absdiff(prev_gray, gray)))
                frame_diffs.append(diff)
            prev_gray = gray

            pil_frame = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            frame_faces = []
            try:
                boxes, probs = self.mtcnn.detect(pil_frame)
                if boxes is not None and len(boxes) > 0:
                    for b_idx, (box, prob) in enumerate(zip(boxes, probs)):
                        if prob is not None and prob >= 0.70:
                            b_clean = [round(float(coord), 1) for coord in box]
                            frame_faces.append({
                                "bbox": b_clean,
                                "confidence": round(float(prob), 3)
                            })
                            graph_builder.add_face_node(f_idx, b_idx, b_clean, float(prob))
            except Exception:
                pass

            face_detections_per_frame.append({
                "frame_number": f_idx,
                "timestamp": round(f_idx / fps, 2) if fps > 0 else 0.0,
                "face_count": len(frame_faces),
                "faces": frame_faces,
                "laplacian_var": round(lap_var, 2),
                "mean_luminance": round(lum, 2)
            })
            graph_builder.add_frame_node(f_idx, round(f_idx / fps, 2) if fps > 0 else 0.0)

        cap.release()
        return media_info, face_detections_per_frame, blur_scores, luminance_scores, frame_diffs

    def analyze_temporal_consistency(
        self,
        face_detections_per_frame: List[Dict[str, Any]],
        frame_diffs: List[float],
        builder: EvidenceBuilder
    ) -> Tuple[Dict[str, Any], float]:
        findings: Dict[str, Any] = {}
        temporal_risk = 0.15

        face_counts = [f["face_count"] for f in face_detections_per_frame]
        faces_present = [f for f in face_detections_per_frame if f["face_count"] > 0]
        findings["face_presence_ratio"] = round(len(faces_present) / max(1, len(face_detections_per_frame)), 2)

        if len(faces_present) >= 3:
            areas = []
            for f in faces_present:
                box = f["faces"][0]["bbox"]
                w = box[2] - box[0]
                h = box[3] - box[1]
                areas.append(w * h)

            area_std = float(np.std(areas)) / (float(np.mean(areas)) + 1e-5)
            findings["face_area_variation_coefficient"] = round(area_std, 3)

            if area_std > 0.45:
                builder.add_temporal_evidence(
                    title="Erratic Facial Scale & Geometry Fluctuation",
                    description=f"Detected high bounding box geometry instability across sampled frames (variation coefficient: {area_std:.2f}). Deepfake generators often exhibit boundary jitter.",
                    severity="medium",
                    confidence=0.75,
                    technical_details={"variation_coefficient": area_std}
                )
                temporal_risk += 0.25

        flicker_count = 0
        for i in range(1, len(face_counts)):
            if (face_counts[i] == 0 and face_counts[i - 1] > 0) or (face_counts[i] > 0 and face_counts[i - 1] == 0):
                flicker_count += 1

        findings["face_detection_flicker_count"] = flicker_count
        if flicker_count >= 3 and len(face_counts) > 6:
            builder.add_temporal_evidence(
                title="Facial Intermittent Discontinuity / Flickering",
                description=f"Facial region alternately dropped and reappeared {flicker_count} times across sampled frames, indicating possible face-replacement alignment loss.",
                severity="high",
                confidence=0.79,
                technical_details={"flicker_events": flicker_count}
            )
            temporal_risk += 0.30

        if len(frame_diffs) > 0:
            diff_mean = float(np.mean(frame_diffs))
            diff_std = float(np.std(frame_diffs))
            findings["frame_diff_mean"] = round(diff_mean, 2)
            findings["frame_diff_std"] = round(diff_std, 2)

            spikes = [d for d in frame_diffs if d > (diff_mean + 2.5 * diff_std) and d > 30.0]
            if len(spikes) > 0:
                builder.add_temporal_evidence(
                    title="Sudden Inter-Frame Structural Discontinuities",
                    description=f"Localized {len(spikes)} sharp inter-frame transition anomalies. May represent splice cuts or synthesized frame splicing.",
                    severity="medium",
                    confidence=0.71,
                    technical_details={"anomaly_count": len(spikes)}
                )
                temporal_risk += 0.20

        findings["temporal_risk_score"] = round(temporal_risk, 3)
        findings["face_score"] = round(min(1.0, temporal_risk + 0.05), 3)
        return findings, min(max(temporal_risk, 0.0), 1.0)

    def extract_and_analyze_audio(
        self,
        file_path: Path,
        case_id: str,
        builder: EvidenceBuilder,
        limitations: List[str]
    ) -> Tuple[Dict[str, Any], float]:
        audio_temp_path = settings.upload_path / f"tmp_audio_{case_id}.wav"
        audio_findings: Dict[str, Any] = {"audio_present": False}
        audio_score = 0.0

        try:
            cmd = [
                "ffmpeg", "-y", "-i", str(file_path),
                "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
                str(audio_temp_path)
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=15)
            if res.returncode == 0 and audio_temp_path.exists() and audio_temp_path.stat().st_size > 1000:
                y, sr = librosa.load(str(audio_temp_path), sr=None, mono=True)
                audio_findings, audio_score = self.audio_analyzer.compute_audio_metrics(y, sr, builder)
                audio_findings["audio_present"] = True
                builder.add_audio_evidence(
                    title="Audio Track Extracted from Video",
                    description=f"Audio track decoded successfully ({sr}Hz, {audio_findings.get('duration', 0)}s). Acoustic analysis performed.",
                    severity="info",
                    confidence=0.85
                )
            else:
                limitations.append("Video did not contain an extractable audio track or audio codec was unreadable.")
        except Exception as e:
            limitations.append(f"Audio extraction from video failed ({str(e)}). Proceeding with visual-only analysis.")
        finally:
            if audio_temp_path.exists():
                try:
                    audio_temp_path.unlink()
                except Exception:
                    pass

        return audio_findings, audio_score
