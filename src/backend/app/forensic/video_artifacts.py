from pathlib import Path
from typing import List, Dict, Any, Tuple
import cv2
import numpy as np
from PIL import Image

def get_video_metadata(video_path: Path) -> Dict[str, Any]:
    """Retrieves container and stream properties from video file."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return {
            "is_valid": False,
            "error": "Failed to open video file"
        }

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = float(cap.get(cv2.CAP_PROP_FPS)) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_sec = total_frames / fps if fps > 0 else 0.0

    fourcc_int = int(cap.get(cv2.CAP_PROP_FOURCC))
    fourcc = "".join([chr((fourcc_int >> 8 * i) & 0xFF) for i in range(4)])

    cap.release()

    return {
        "is_valid": True,
        "width": width,
        "height": height,
        "fps": round(fps, 2),
        "total_frames": total_frames,
        "duration_seconds": round(duration_sec, 2),
        "codec": fourcc.strip() or "Unknown"
    }

def extract_sampled_frames(
    video_path: Path,
    max_frames: int = 30,
    sample_fps: float = 1.0
) -> List[Dict[str, Any]]:
    """
    Evenly samples frames across the video timeline for multimodal AI inspection.
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return []

    fps = float(cap.get(cv2.CAP_PROP_FPS)) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if total_frames <= 0:
        cap.release()
        return []

    # Calculate step interval based on sample_fps
    step = max(1, int(round(fps / max(0.1, sample_fps))))

    sampled_indices = list(range(0, total_frames, step))
    if len(sampled_indices) > max_frames:
        # Downsample uniformly to max_frames
        idx_step = len(sampled_indices) / float(max_frames)
        sampled_indices = [sampled_indices[int(i * idx_step)] for i in range(max_frames)]

    frames_data: List[Dict[str, Any]] = []
    current_frame_idx = 0
    target_set = set(sampled_indices)

    while cap.isOpened():
        ret, frame_bgr = cap.read()
        if not ret:
            break

        if current_frame_idx in target_set:
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(frame_rgb)
            ts = current_frame_idx / fps

            frames_data.append({
                "frame_index": current_frame_idx,
                "timestamp_sec": round(ts, 2),
                "image": pil_img,
                "width": frame_rgb.shape[1],
                "height": frame_rgb.shape[0]
            })

            if len(frames_data) >= max_frames:
                break

        current_frame_idx += 1

    cap.release()
    return frames_data

def compute_video_artifact_metrics(frames: List[Image.Image]) -> Dict[str, Any]:
    """Computes inter-frame difference and temporal visual jitter."""
    if len(frames) < 2:
        return {
            "mean_interframe_diff": 0.0,
            "jitter_score": 0.0,
            "artifact_severity": "low"
        }

    diffs = []
    for i in range(len(frames) - 1):
        a = np.array(frames[i].convert("L"), dtype=np.float32)
        b = np.array(frames[i + 1].convert("L"), dtype=np.float32)
        # Ensure identical dimensions
        if a.shape != b.shape:
            b = cv2.resize(b, (a.shape[1], a.shape[0]))
        diff = np.mean(np.abs(a - b))
        diffs.append(diff)

    mean_diff = float(np.mean(diffs))
    diff_std = float(np.std(diffs))
    jitter = float(np.clip(diff_std / (mean_diff + 1e-5), 0.0, 1.0))

    return {
        "mean_interframe_diff": round(mean_diff, 2),
        "interframe_std": round(diff_std, 2),
        "jitter_score": round(jitter, 4),
        "artifact_severity": "high" if jitter > 0.6 else "normal"
    }