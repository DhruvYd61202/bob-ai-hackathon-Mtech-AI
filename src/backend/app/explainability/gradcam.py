from pathlib import Path
from typing import Dict, Any, Optional, Union, Tuple
import cv2
import numpy as np
from PIL import Image

def generate_attention_overlay(
    image: Union[Image.Image, np.ndarray],
    attention_map: np.ndarray,
    alpha: float = 0.40,
    colormap: int = cv2.COLORMAP_JET
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Renders an attention heatmap overlay on an image.
    Returns:
        overlay_rgb: RGB uint8 numpy array with heatmap blended
        heatmap_colored_rgb: RGB uint8 colormapped heatmap
    """
    if isinstance(image, Image.Image):
        img_rgb = np.array(image.convert("RGB"))
    else:
        img_rgb = image.copy()
        if img_rgb.ndim == 2:
            img_rgb = cv2.cvtColor(img_rgb, cv2.COLOR_GRAY2RGB)

    h, w = img_rgb.shape[:2]

    # Normalize attention map to [0, 1]
    attn = np.array(attention_map, dtype=np.float32)
    a_min, a_max = attn.min(), attn.max()
    if a_max > a_min:
        attn = (attn - a_min) / (a_max - a_min)
    else:
        attn = np.zeros_like(attn)

    # Resize to image dimensions with bicubic interpolation
    resized_attn = cv2.resize(attn, (w, h), interpolation=cv2.INTER_CUBIC)
    resized_attn = np.clip(resized_attn, 0.0, 1.0)

    # Convert to 8-bit for colormap application
    attn_uint8 = (resized_attn * 255.0).astype(np.uint8)
    heatmap_colored_bgr = cv2.applyColorMap(attn_uint8, colormap)
    heatmap_colored_rgb = cv2.cvtColor(heatmap_colored_bgr, cv2.COLOR_BGR2RGB)

    # Alpha blend with original
    overlay_rgb = cv2.addWeighted(img_rgb, 1.0 - alpha, heatmap_colored_rgb, alpha, 0)
    return overlay_rgb, heatmap_colored_rgb

def save_explanation_image(
    overlay_rgb: np.ndarray,
    output_path: Path
) -> str:
    """Saves RGB overlay image to filesystem and returns string path."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    pil_img = Image.fromarray(overlay_rgb)
    pil_img.save(str(output_path), "JPEG", quality=90)
    return str(output_path)

def overlay_face_on_full_frame(
    full_frame: Union[Image.Image, np.ndarray],
    face_box: list,
    face_overlay_rgb: np.ndarray
) -> np.ndarray:
    """Overlays the face explanation directly onto the full-resolution frame."""
    if isinstance(full_frame, Image.Image):
        frame_rgb = np.array(full_frame.convert("RGB"))
    else:
        frame_rgb = full_frame.copy()

    x1, y1, x2, y2 = face_box
    fh, fw = frame_rgb.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(fw, x2), min(fh, y2)

    box_w = x2 - x1
    box_h = y2 - y1
    if box_w > 0 and box_h > 0:
        resized_overlay = cv2.resize(face_overlay_rgb, (box_w, box_h), interpolation=cv2.INTER_LINEAR)
        frame_rgb[y1:y2, x1:x2] = resized_overlay
        # Draw bounding border
        cv2.rectangle(frame_rgb, (x1, y1), (x2, y2), (255, 60, 60), 2)

    return frame_rgb