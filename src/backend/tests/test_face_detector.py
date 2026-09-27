import pytest
from PIL import Image
import numpy as np
from app.models.face_detector import FaceDetector

def test_face_detector_no_faces():
    detector = FaceDetector()
    # Blank gray image without human faces
    blank = Image.new("RGB", (200, 200), color=(128, 128, 128))
    faces = detector.detect_faces(blank)
    assert isinstance(faces, list)
    assert len(faces) == 0

def test_face_detector_status():
    detector = FaceDetector()
    st = detector.get_status()
    assert "MTCNN" in st["name"]
    assert st["model_id"] == "facenet-pytorch/mtcnn"