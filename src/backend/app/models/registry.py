from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class ModelMetadata(BaseModel):
    model_id: str
    name: str
    role: str
    architecture: str
    framework: str
    source: str
    license: str
    version: str
    input_shape: str
    classes: Dict[str, str]
    description: str
    paper_citation: Optional[str] = None

MODEL_REGISTRY: Dict[str, ModelMetadata] = {
    "facenet_mtcnn": ModelMetadata(
        model_id="facenet-pytorch/mtcnn",
        name="MTCNN Face Detection & Alignment",
        role="face_detector",
        architecture="Multi-task Cascaded Convolutional Networks (P-Net, R-Net, O-Net)",
        framework="PyTorch (facenet-pytorch)",
        source="https://github.com/timesler/facenet-pytorch",
        license="MIT",
        version="2.6.0",
        input_shape="RGB Image (Variable)",
        classes={"0": "Non-Face", "1": "Face"},
        description="Cascade network detecting facial bounding boxes and landmarks for crop alignment.",
        paper_citation="Zhang et al., Joint Face Detection and Alignment using Multi-task Cascaded Convolutional Networks, IEEE SPL 2016"
    ),
    "vit_deepfake_image": ModelMetadata(
        model_id="dima806/deepfake_vs_real_image_detection",
        name="Vision Transformer Deepfake Classifier",
        role="visual_detector",
        architecture="google/vit-base-patch16-224 fine-tuned on deepfake datasets",
        framework="PyTorch / Hugging Face Transformers",
        source="https://huggingface.co/dima806/deepfake_vs_real_image_detection",
        license="Apache 2.0",
        version="1.0.0",
        input_shape="3x224x224 RGB Normalized",
        classes={"0": "Real", "1": "Fake"},
        description="Pretrained Vision Transformer classifying genuine vs deepfake face crops with self-attention maps.",
        paper_citation="Dosovitskiy et al., An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale, ICLR 2021"
    ),
    "wav2vec2_deepfake_audio": ModelMetadata(
        model_id="MelodyMachine/Deepfake-audio-detection",
        name="Wav2Vec2 Audio Deepfake & Spoof Detector",
        role="audio_detector",
        architecture="facebook/wav2vec2-base fine-tuned on synthetic speech datasets",
        framework="PyTorch / Hugging Face Transformers",
        source="https://huggingface.co/MelodyMachine/Deepfake-audio-detection",
        license="Apache 2.0",
        version="1.0.0",
        input_shape="1D Audio Waveform (16,000 Hz mono)",
        classes={"0": "Fake", "1": "Real"},
        description="Wav2Vec 2.0 neural acoustic model detecting synthesized, cloned, or spliced audio speech.",
        paper_citation="Baevski et al., wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations, NeurIPS 2020"
    ),
    "temporal_aggregation_engine": ModelMetadata(
        model_id="forensic_ai/temporal_aggregator_v1",
        name="Multi-Frame Temporal Anomaly & Aggregation Engine",
        role="temporal_detector",
        architecture="Statistical Multi-Frame Sequence Modeling & Peak Anomaly",
        framework="PyTorch / NumPy",
        source="DeepFake ForensicAI In-House Engine",
        license="MIT",
        version="1.0.0",
        input_shape="Sequence of Frame Predictions [T, 2]",
        classes={"0": "Consistent", "1": "Temporal Anomaly"},
        description="Evaluates inter-frame prediction variance, flickering, spike anomalies, and temporal continuity across video frames.",
        paper_citation="Agarwal et al., Protecting World Leaders Against Deep Fakes, CVPRW 2019"
    )
}

def get_model_metadata(model_key: str) -> Optional[ModelMetadata]:
    return MODEL_REGISTRY.get(model_key)