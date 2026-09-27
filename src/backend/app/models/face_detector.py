from typing import List, Dict, Any, Optional, Union
import numpy as np
from PIL import Image
import torch
from facenet_pytorch import MTCNN
from app.models.base import BaseDetector
from app.models.registry import MODEL_REGISTRY

class FaceDetector(BaseDetector):
    def __init__(self, device: Optional[torch.device] = None):
        meta = MODEL_REGISTRY["facenet_mtcnn"]
        super().__init__(model_name=meta.name, model_id=meta.model_id, device=device)
        self.mtcnn: Optional[MTCNN] = None

    def load(self) -> None:
        try:
            self.mtcnn = MTCNN(
                keep_all=True,
                select_largest=False,
                post_process=False,
                device=self.device
            )
            self.is_loaded = True
            self.load_error = None
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            raise RuntimeError(f"Failed to load MTCNN face detector: {e}")

    def detect_faces(
        self,
        image: Union[Image.Image, np.ndarray],
        min_confidence: float = 0.80,
        margin_ratio: float = 0.20
    ) -> List[Dict[str, Any]]:
        """
        Detects faces in an image, extracts aligned/padded face crops, and returns metadata.
        """
        if not self.is_loaded or self.mtcnn is None:
            self.load()

        if isinstance(image, np.ndarray):
            pil_img = Image.fromarray(image).convert("RGB")
        elif isinstance(image, Image.Image):
            pil_img = image.convert("RGB")
        else:
            raise ValueError(f"Unsupported image type: {type(image)}")

        w, h = pil_img.size
        try:
            boxes, probs, landmarks = self.mtcnn.detect(pil_img, landmarks=True)
        except Exception as e:
            # Handle potential internal dimension exceptions on tiny or abnormal images
            boxes, probs, landmarks = None, None, None

        if boxes is None or len(boxes) == 0:
            return []

        results: List[Dict[str, Any]] = []
        for idx, (box, prob) in enumerate(zip(boxes, probs)):
            if prob is None or prob < min_confidence:
                continue

            x1, y1, x2, y2 = box
            box_w = x2 - x1
            box_h = y2 - y1

            # Expand by margin to capture boundary artifacts (ears, neck, hair)
            mx = box_w * margin_ratio
            my = box_h * margin_ratio

            pad_x1 = max(0, int(round(x1 - mx)))
            pad_y1 = max(0, int(round(y1 - my)))
            pad_x2 = min(w, int(round(x2 + mx)))
            pad_y2 = min(h, int(round(y2 + my)))

            crop_w = pad_x2 - pad_x1
            crop_h = pad_y2 - pad_y1
            if crop_w <= 10 or crop_h <= 10:
                continue

            face_crop = pil_img.crop((pad_x1, pad_y1, pad_x2, pad_y2))
            lm = landmarks[idx].tolist() if (landmarks is not None and idx < len(landmarks)) else None

            results.append({
                "face_index": idx,
                "confidence": float(prob),
                "box": [int(round(x1)), int(round(y1)), int(round(x2)), int(round(y2))],
                "padded_box": [pad_x1, pad_y1, pad_x2, pad_y2],
                "crop": face_crop,
                "landmarks": lm,
                "width": crop_w,
                "height": crop_h
            })

        return results