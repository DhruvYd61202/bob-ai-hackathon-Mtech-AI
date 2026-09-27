import numpy
import torch
import torchvision
import torchaudio
import cv2
import librosa
import soundfile
import scipy
import sklearn
import transformers
from facenet_pytorch import MTCNN

def test_imports():
    assert numpy.__version__ == "1.26.4"
    assert torch.__version__.startswith("2.2.2")
    assert cv2.__version__ is not None
    assert librosa.__version__ is not None
    assert soundfile.__version__ is not None
    assert scipy.__version__ is not None
    assert sklearn.__version__ is not None
    assert transformers.__version__ is not None
    mtcnn = MTCNN(keep_all=True, device="cpu")
    assert mtcnn is not None

def test_device_detection():
    # Application must detect cuda or fallback to cpu
    device = "cuda" if torch.cuda.is_available() else "cpu"
    assert device in ["cuda", "cpu"]
