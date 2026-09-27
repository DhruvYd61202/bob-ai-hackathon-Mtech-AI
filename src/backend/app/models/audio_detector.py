"""
Audio Deepfake Detector Module

This module implements the Wav2Vec 2.0 based acoustic classifier 
for detecting synthetic text-to-speech (TTS) and voice clones.

SECURITY NOTE (Bandit B615):
- The `from_pretrained()` method loads models dynamically from the Hugging Face Hub. 
  Loading models without pinning a specific revision/commit hash is flagged as potentially 
  unsafe, as a compromised remote repository could serve malicious model files. 
  For production security, it is recommended to specify `revision="<commit_hash>"` 
  in `from_pretrained()`.
"""
import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
from pathlib import Path
from typing import Dict, Any, Optional, Union
import numpy as np
import torch
import librosa
from transformers import AutoFeatureExtractor, AutoModelForAudioClassification
from app.core.config import settings
from app.models.base import BaseAudioDetector
from app.models.registry import MODEL_REGISTRY

class Wav2Vec2AudioDetector(BaseAudioDetector):
    def __init__(self, device: Optional[torch.device] = None, model_id: Optional[str] = None):
        meta = MODEL_REGISTRY["wav2vec2_deepfake_audio"]
        resolved_id = model_id or settings.AUDIO_MODEL_ID or meta.model_id
        super().__init__(model_name=meta.name, model_id=resolved_id, device=device)
        self.feature_extractor: Optional[AutoFeatureExtractor] = None
        self.model: Optional[AutoModelForAudioClassification] = None
        self.fake_class_idx: int = 0
        self.real_class_idx: int = 1

    def load(self) -> None:
        try:
            cache_dir = str(settings.model_path)
            self.feature_extractor = AutoFeatureExtractor.from_pretrained(
                self.model_id,
                cache_dir=cache_dir
            )
            self.model = AutoModelForAudioClassification.from_pretrained(
                self.model_id,
                cache_dir=cache_dir
            )
            self.model.to(self.device)
            self.model.eval()

            # Dynamically resolve label indices
            id2label = getattr(self.model.config, "id2label", {0: "fake", 1: "real"})
            for idx, label_name in id2label.items():
                lbl = str(label_name).lower()
                if "fake" in lbl or lbl == "0":
                    self.fake_class_idx = int(idx)
                elif "real" in lbl or lbl == "1":
                    self.real_class_idx = int(idx)

            self.is_loaded = True
            self.load_error = None
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            raise RuntimeError(f"Failed to load Wav2Vec2 audio detector '{self.model_id}': {e}")

    def load_audio(
        self,
        audio_input: Union[str, Path, np.ndarray],
        target_sr: int = 16000
    ) -> np.ndarray:
        """Loads and converts input into 16kHz mono float32 numpy array."""
        if isinstance(audio_input, (str, Path)):
            p = Path(audio_input)
            if not p.exists():
                raise FileNotFoundError(f"Audio file not found: {p}")
            y, sr = librosa.load(str(p), sr=target_sr, mono=True)
            return y.astype(np.float32)
        elif isinstance(audio_input, np.ndarray):
            y = audio_input.astype(np.float32)
            if y.ndim > 1:
                y = np.mean(y, axis=0)
            return y
        else:
            raise ValueError(f"Unsupported audio input type: {type(audio_input)}")

    def predict(
        self,
        audio_input: Union[str, Path, np.ndarray],
        sample_rate: int = 16000
    ) -> Dict[str, Any]:
        if not self.is_loaded or self.model is None or self.feature_extractor is None:
            self.load()

        audio = self.load_audio(audio_input, target_sr=sample_rate)
        duration_sec = len(audio) / float(sample_rate)

        # Ensure minimal length of at least 0.5 seconds
        min_samples = int(0.5 * sample_rate)
        if len(audio) < min_samples:
            audio = np.pad(audio, (0, min_samples - len(audio)), mode="constant")

        # For long audio (>20 seconds), chunk into 10-second segments and aggregate
        chunk_samples = 10 * sample_rate
        if len(audio) > chunk_samples:
            num_chunks = min(5, int(np.ceil(len(audio) / chunk_samples)))
            chunk_probs = []
            for i in range(num_chunks):
                start = i * chunk_samples
                end = min(len(audio), start + chunk_samples)
                segment = audio[start:end]
                if len(segment) < min_samples:
                    segment = np.pad(segment, (0, min_samples - len(segment)), mode="constant")

                inputs = self.feature_extractor(segment, sampling_rate=sample_rate, return_tensors="pt")
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                with torch.no_grad():
                    outputs = self.model(**inputs)
                p = torch.softmax(outputs.logits, dim=-1)[0]
                chunk_probs.append(p.cpu().numpy())

            avg_p = np.mean(chunk_probs, axis=0)
            fake_prob = float(avg_p[self.fake_class_idx])
            real_prob = float(avg_p[self.real_class_idx])
        else:
            inputs = self.feature_extractor(audio, sampling_rate=sample_rate, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            with torch.no_grad():
                outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)[0]
            fake_prob = float(probs[self.fake_class_idx].item())
            real_prob = float(probs[self.real_class_idx].item())

        predicted_label = "FAKE" if fake_prob >= 0.50 else "REAL"
        confidence = float(max(fake_prob, real_prob))

        return {
            "real_probability": round(real_prob, 4),
            "fake_probability": round(fake_prob, 4),
            "confidence": round(confidence, 4),
            "predicted_label": predicted_label,
            "duration_seconds": round(duration_sec, 2),
            "model_name": self.model_name,
            "model_id": self.model_id
        }