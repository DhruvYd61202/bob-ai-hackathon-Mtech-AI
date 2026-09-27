"""
Visual Deepfake Detector Module

This module implements the Vision Transformer (ViT) based visual 
deepfake detection using pre-trained models from the Hugging Face Hub.

SECURITY NOTE (Bandit B615):
- The `from_pretrained()` method loads models dynamically from the Hugging Face Hub. 
  Loading models without pinning a specific revision/commit hash is flagged as potentially 
  unsafe, as a compromised remote repository could serve malicious model files. 
  For production security, it is recommended to specify `revision="<commit_hash>"` 
  in `from_pretrained()`.
"""
import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
from typing import Dict, Any, Optional, Union
import numpy as np
from PIL import Image
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification
from app.core.config import settings
from app.models.base import BaseVisualDetector
from app.models.registry import MODEL_REGISTRY

class ViTDeepfakeDetector(BaseVisualDetector):
    def __init__(self, device: Optional[torch.device] = None, model_id: Optional[str] = None):
        meta = MODEL_REGISTRY["vit_deepfake_image"]
        resolved_id = model_id or settings.VISUAL_MODEL_ID or meta.model_id
        super().__init__(model_name=meta.name, model_id=resolved_id, device=device)
        self.processor: Optional[AutoImageProcessor] = None
        self.model: Optional[AutoModelForImageClassification] = None
        self.fake_class_idx: int = 1
        self.real_class_idx: int = 0

    def load(self) -> None:
        try:
            cache_dir = str(settings.model_path)
            self.processor = AutoImageProcessor.from_pretrained(
                self.model_id,
                cache_dir=cache_dir
            )
            self.model = AutoModelForImageClassification.from_pretrained(
                self.model_id,
                cache_dir=cache_dir,
                output_attentions=True,
                attn_implementation="eager"
            )
            self.model.to(self.device)
            self.model.eval()

            # Resolve real vs fake class indices dynamically
            id2label = getattr(self.model.config, "id2label", {0: "Real", 1: "Fake"})
            for idx, label_name in id2label.items():
                lbl = str(label_name).lower()
                if "fake" in lbl or lbl == "1":
                    self.fake_class_idx = int(idx)
                elif "real" in lbl or lbl == "0":
                    self.real_class_idx = int(idx)

            self.is_loaded = True
            self.load_error = None
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            raise RuntimeError(f"Failed to load ViT visual detector '{self.model_id}': {e}")

    def compute_attention_rollout(self, attentions: tuple) -> np.ndarray:
        """
        Computes Vision Transformer attention rollout across all transformer layers.
        Returns a 14x14 normalized attention heatmap.
        """
        try:
            num_tokens = attentions[0].shape[-1]
            eye = torch.eye(num_tokens, device=self.device)
            rollout = eye

            for layer_attn in attentions:
                # Average attention across multi-head self-attention
                head_avg = layer_attn[0].mean(dim=0)
                # Add residual connection identity matrix and re-normalize rows
                a_res = 0.5 * head_avg + 0.5 * eye
                a_res = a_res / a_res.sum(dim=-1, keepdim=True)
                rollout = torch.matmul(a_res, rollout)

            # Attention from CLS token (token 0) to all patch tokens (tokens 1 to 196)
            cls_attn = rollout[0, 1:].detach().cpu().numpy()
            grid_dim = int(np.sqrt(len(cls_attn)))
            if grid_dim * grid_dim == len(cls_attn):
                heatmap_grid = cls_attn.reshape(grid_dim, grid_dim)
            else:
                heatmap_grid = cls_attn.reshape(14, 14)

            # Min-max normalization
            h_min, h_max = heatmap_grid.min(), heatmap_grid.max()
            norm_map = (heatmap_grid - h_min) / (h_max - h_min + 1e-8)
            return norm_map
        except Exception:
            # Fallback 14x14 uniform heatmap
            return np.ones((14, 14), dtype=np.float32) * 0.5

    def predict(
        self,
        image: Union[Image.Image, np.ndarray],
        return_attention: bool = False
    ) -> Dict[str, Any]:
        if not self.is_loaded or self.model is None or self.processor is None:
            self.load()

        if isinstance(image, np.ndarray):
            pil_img = Image.fromarray(image).convert("RGB")
        elif isinstance(image, Image.Image):
            pil_img = image.convert("RGB")
        else:
            raise ValueError(f"Unsupported image type: {type(image)}")

        inputs = self.processor(images=pil_img, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self.model(**inputs)

        probs = torch.softmax(outputs.logits, dim=-1)[0]
        fake_prob = float(probs[self.fake_class_idx].item())
        real_prob = float(probs[self.real_class_idx].item())

        predicted_label = "FAKE" if fake_prob >= 0.50 else "REAL"
        confidence = float(max(fake_prob, real_prob))

        attention_map = None
        if return_attention and outputs.attentions is not None and len(outputs.attentions) > 0:
            attn_arr = self.compute_attention_rollout(outputs.attentions)
            attention_map = attn_arr.tolist()

        return {
            "real_probability": round(real_prob, 4),
            "fake_probability": round(fake_prob, 4),
            "confidence": round(confidence, 4),
            "predicted_label": predicted_label,
            "attention_map": attention_map,
            "model_name": self.model_name,
            "model_id": self.model_id
        }