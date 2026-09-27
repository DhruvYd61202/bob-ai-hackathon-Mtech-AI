from pathlib import Path
from typing import Dict, Any, List, Optional
import librosa
from PIL import Image
from app.core.config import settings
from app.core.storage import get_case_frames_dir, get_case_explanations_dir
from app.models.model_manager import get_model_manager
from app.forensic.metadata import extract_metadata
from app.forensic.video_artifacts import get_video_metadata, extract_sampled_frames, compute_video_artifact_metrics
from app.forensic.audio_artifacts import analyze_audio_forensics
from app.explainability.gradcam import generate_attention_overlay, save_explanation_image, overlay_face_on_full_frame
from app.explainability.explanation import rank_top_suspicious_frames
from app.pipeline.fusion import fuse_multimodal_predictions
from app.pipeline.sync_analyzer import sync_analyzer

class VideoPipeline:
    def __init__(self):
        self.model_manager = get_model_manager()

    def process(self, video_path: Path, case_id: str) -> Dict[str, Any]:
        """Executes full video deepfake analysis across sampled frames, temporal sequence, and audio."""
        container_meta = get_video_metadata(video_path)
        file_meta = extract_metadata(video_path, media_type="video")

        # 1. Sample Frames
        sample_fps = float(settings.FRAME_SAMPLE_RATE)
        max_frames = int(settings.MAX_VIDEO_FRAMES)
        sampled = extract_sampled_frames(video_path, max_frames=max_frames, sample_fps=sample_fps)

        if not sampled:
            raise ValueError(f"Could not extract any playable frames from video: {video_path.name}")

        frames_dir = get_case_frames_dir(case_id)
        explanations_dir = get_case_explanations_dir(case_id)

        face_detector = self.model_manager.get_face_detector()
        visual_detector = self.model_manager.get_visual_detector()

        frame_results: List[Dict[str, Any]] = []
        pil_frame_list: List[Image.Image] = []

        # 2. Frame-by-Frame AI Analysis
        for item in sampled:
            idx = item["frame_index"]
            ts = item["timestamp_sec"]
            img: Image.Image = item["image"]
            pil_frame_list.append(img)

            # Save base frame
            frame_filename = f"frame_{idx:04d}.jpg"
            frame_path = frames_dir / frame_filename
            img.save(str(frame_path), "JPEG", quality=85)
            frame_url = f"/frames/{case_id}/{frame_filename}"

            # Detect faces in frame
            faces = face_detector.detect_faces(img)
            expl_url = None

            if faces:
                best_face = None
                best_fake_prob = -1.0
                best_pred = None
                best_attn = None

                for f in faces:
                    pred = visual_detector.predict(f["crop"], return_attention=True)
                    if pred["fake_probability"] > best_fake_prob:
                        best_fake_prob = pred["fake_probability"]
                        best_face = f
                        best_pred = pred
                        best_attn = pred.get("attention_map")

                frame_fake_prob = best_pred["fake_probability"]
                frame_real_prob = best_pred["real_probability"]
                frame_conf = best_pred["confidence"]
                frame_label = best_pred["predicted_label"]

                if best_attn is not None and best_face is not None:
                    face_overlay, _ = generate_attention_overlay(best_face["crop"], best_attn)
                    full_overlay = overlay_face_on_full_frame(img, best_face["padded_box"], face_overlay)
                    expl_filename = f"frame_{idx:04d}_gradcam.jpg"
                    save_path = explanations_dir / expl_filename
                    save_explanation_image(full_overlay, save_path)
                    expl_url = f"/explanations/{case_id}/{expl_filename}"
            else:
                pred = visual_detector.predict(img, return_attention=True)
                frame_fake_prob = pred["fake_probability"]
                frame_real_prob = pred["real_probability"]
                frame_conf = pred["confidence"]
                frame_label = pred["predicted_label"]
                attn_map = pred.get("attention_map")

                if attn_map is not None:
                    overlay, _ = generate_attention_overlay(img, attn_map)
                    expl_filename = f"frame_{idx:04d}_gradcam.jpg"
                    save_path = explanations_dir / expl_filename
                    save_explanation_image(overlay, save_path)
                    expl_url = f"/explanations/{case_id}/{expl_filename}"

            frame_results.append({
                "frame_index": idx,
                "timestamp_sec": ts,
                "fake_probability": round(frame_fake_prob, 4),
                "real_probability": round(frame_real_prob, 4),
                "confidence": round(frame_conf, 4),
                "predicted_label": frame_label,
                "faces_detected": len(faces),
                "landmarks": best_face.get("landmarks") if best_face else None,
                "frame_url": frame_url,
                "explanation_image_url": expl_url
            })

        # 3. Video Artifact Heuristics
        video_heuristics = compute_video_artifact_metrics(pil_frame_list)

        # 4. Temporal Sequence Modeling
        temporal_detector = self.model_manager.get_temporal_detector()
        temporal_pred = temporal_detector.predict(frame_results)

        # 5. Audio Track Extraction, Spoof Detection & Audio-Visual Sync
        audio_pred: Optional[Dict[str, Any]] = None
        audio_heuristics: Optional[Dict[str, Any]] = None
        audio_waveform: Optional[Any] = None
        try:
            y, sr = librosa.load(str(video_path), sr=16000, mono=True)
            if len(y) > 8000:  # At least 0.5s of audio
                audio_waveform = y
                audio_detector = self.model_manager.get_audio_detector()
                audio_pred = audio_detector.predict(y, sample_rate=16000)
                audio_heuristics = analyze_audio_forensics(y, sr=16000)
        except Exception:
            audio_pred = None
            audio_heuristics = None
            audio_waveform = None

        # Execute Audio-Visual Synchronization Analysis (Supporting Signal)
        sync_result = sync_analyzer.analyze_sync(
            frame_landmarks=[
                {"frame_index": f["frame_index"], "timestamp_sec": f["timestamp_sec"], "landmarks": f.get("landmarks")}
                for f in frame_results
            ],
            audio_waveform=audio_waveform,
            sample_rate=16000
        )

        # 6. Rank Top Suspicious Frames
        top_suspicious = rank_top_suspicious_frames(frame_results, top_k=3)

        # 7. Multimodal Fusion
        combined_heuristics = {
            "video_heuristics": video_heuristics,
            "audio_heuristics": audio_heuristics,
            "supporting_forensic_score": video_heuristics.get("jitter_score", 0.0)
        }
        if audio_heuristics:
            combined_heuristics["supporting_forensic_score"] = round(
                0.5 * video_heuristics.get("jitter_score", 0.0) +
                0.5 * audio_heuristics.get("supporting_forensic_score", 0.0),
                4
            )

        fusion = fuse_multimodal_predictions(
            media_type="video",
            visual_result=None,
            audio_result=audio_pred,
            temporal_result=temporal_pred,
            supporting_forensics=combined_heuristics
        )

        # 8. Summary Narrative
        narrative = (
            f"Temporal aggregation across {len(frame_results)} video frames identified a temporal "
            f"risk score of {temporal_pred['temporal_risk_score']:.1%} (variance: {temporal_pred['variance']:.3f}, "
            f"jitter: {temporal_pred['inter_frame_jitter']:.3f}). "
        )
        if audio_pred:
            narrative += (
                f"Audio track was verified by {audio_pred['model_name']} with "
                f"{audio_pred['fake_probability']:.1%} synthetic likelihood. "
            )
        if top_suspicious:
            peak = top_suspicious[0]
            narrative += f"Peak manipulation observed at frame #{peak['frame_index']} ({peak['timestamp_sec']}s)."

        return {
            "media_type": "video",
            "file_name": video_path.name,
            "video_metadata": container_meta,
            "frames_analyzed": len(frame_results),
            "frames": frame_results,
            "top_suspicious_frames": top_suspicious,
            "temporal_analysis": temporal_pred,
            "audio_analysis": audio_pred,
            "sync_analysis": sync_result,
            "supporting_forensics": combined_heuristics,
            "fusion": fusion,
            "explanation": {
                "narrative": narrative,
                "top_suspicious_frames": top_suspicious
            },
            "metadata": file_meta
        }