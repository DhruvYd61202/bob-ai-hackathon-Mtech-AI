import logging
from typing import Dict, Any, Optional
from app.core.device import get_device, get_device_info
from app.models.registry import MODEL_REGISTRY
from app.models.face_detector import FaceDetector
from app.models.visual_detector import ViTDeepfakeDetector
from app.models.audio_detector import Wav2Vec2AudioDetector
from app.models.temporal_detector import TemporalAggregationDetector

logger = logging.getLogger(__name__)

class ModelManager:
    _instance: Optional["ModelManager"] = None

    def __init__(self):
        self.device = get_device()
        self.face_detector: Optional[FaceDetector] = None
        self.visual_detector: Optional[ViTDeepfakeDetector] = None
        self.audio_detector: Optional[Wav2Vec2AudioDetector] = None
        self.temporal_detector: Optional[TemporalAggregationDetector] = None

    @classmethod
    def get_instance(cls) -> "ModelManager":
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def get_face_detector(self) -> FaceDetector:
        if self.face_detector is None:
            self.face_detector = FaceDetector(device=self.device)
            try:
                self.face_detector.load()
            except Exception as e:
                logger.error(f"Error loading face detector: {e}")
        return self.face_detector

    def get_visual_detector(self) -> ViTDeepfakeDetector:
        if self.visual_detector is None:
            self.visual_detector = ViTDeepfakeDetector(device=self.device)
            try:
                self.visual_detector.load()
            except Exception as e:
                logger.error(f"Error loading visual detector: {e}")
        return self.visual_detector

    def get_audio_detector(self) -> Wav2Vec2AudioDetector:
        if self.audio_detector is None:
            self.audio_detector = Wav2Vec2AudioDetector(device=self.device)
            try:
                self.audio_detector.load()
            except Exception as e:
                logger.error(f"Error loading audio detector: {e}")
        return self.audio_detector

    def get_temporal_detector(self) -> TemporalAggregationDetector:
        if self.temporal_detector is None:
            self.temporal_detector = TemporalAggregationDetector(device=self.device)
            self.temporal_detector.load()
        return self.temporal_detector

    def load_all(self) -> None:
        """Pre-loads all deep learning models into device memory."""
        logger.info("Initializing and preloading deep learning models...")
        self.get_face_detector()
        self.get_visual_detector()
        self.get_audio_detector()
        self.get_temporal_detector()
        logger.info("Model preloading complete.")

    def get_model_status(self) -> Dict[str, Any]:
        """Returns the real-time operational status of all forensic models."""
        device_info = get_device_info()

        def status_for(detector, registry_key: str):
            meta = MODEL_REGISTRY.get(registry_key)
            if detector is None:
                return {
                    "name": meta.name if meta else registry_key,
                    "model_id": meta.model_id if meta else "unknown",
                    "loaded": False,
                    "device": str(self.device),
                    "error": None,
                    "metadata": meta.model_dump() if meta else {}
                }
            st = detector.get_status()
            st["metadata"] = meta.model_dump() if meta else {}
            return st

        return {
            "device_info": device_info,
            "models": {
                "face_detector": status_for(self.face_detector, "facenet_mtcnn"),
                "visual_detector": status_for(self.visual_detector, "vit_deepfake_image"),
                "audio_detector": status_for(self.audio_detector, "wav2vec2_deepfake_audio"),
                "temporal_detector": status_for(self.temporal_detector, "temporal_aggregation_engine")
            }
        }

def get_model_manager() -> ModelManager:
    return ModelManager.get_instance()