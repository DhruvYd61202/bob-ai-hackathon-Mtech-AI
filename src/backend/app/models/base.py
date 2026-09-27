from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import numpy as np
from PIL import Image
import torch

class BaseDetector(ABC):
    def __init__(self, model_name: str, model_id: str, device: Optional[torch.device] = None):
        self.model_name = model_name
        self.model_id = model_id
        self.device = device or torch.device("cpu")
        self.is_loaded = False
        self.load_error: Optional[str] = None

    @abstractmethod
    def load(self) -> None:
        """Loads the pre-trained weights and pipeline into memory/device."""
        pass

    def get_status(self) -> Dict[str, Any]:
        return {
            "name": self.model_name,
            "model_id": self.model_id,
            "loaded": self.is_loaded,
            "device": str(self.device),
            "error": self.load_error
        }

class BaseVisualDetector(BaseDetector):
    @abstractmethod
    def predict(
        self,
        image: Union[Image.Image, np.ndarray],
        return_attention: bool = False
    ) -> Dict[str, Any]:
        """
        Runs visual deepfake classification.
        Returns:
            real_probability: float [0, 1]
            fake_probability: float [0, 1]
            confidence: float [0, 1]
            predicted_label: 'REAL' or 'FAKE'
            attention_map: Optional[np.ndarray] (2D heatmap normalized [0, 1])
        """
        pass

class BaseAudioDetector(BaseDetector):
    @abstractmethod
    def predict(
        self,
        audio_input: Union[str, Path, np.ndarray],
        sample_rate: int = 16000
    ) -> Dict[str, Any]:
        """
        Runs audio deepfake/spoof classification.
        Returns:
            real_probability: float [0, 1]
            fake_probability: float [0, 1]
            confidence: float [0, 1]
            predicted_label: 'REAL' or 'FAKE'
        """
        pass

class BaseTemporalDetector(BaseDetector):
    @abstractmethod
    def predict(
        self,
        frame_predictions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Aggregates frame predictions across a video timeline.
        Returns:
            temporal_risk_score: float [0, 1]
            variance: float
            flicker_score: float
            peak_anomaly_frame: int
            confidence: float
        """
        pass