from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
import torch

class Settings(BaseSettings):
    APP_NAME: str = "DeepFake ForensicAI"
    APP_VERSION: str = "1.0.0"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"
    MAX_UPLOAD_SIZE_MB: int = 500
    UPLOAD_DIR: str = "data/uploads"
    CASE_DIR: str = "data/cases"
    REPORT_DIR: str = "data/reports"
    MODEL_DIR: str = "data/models"
    DEVICE: str = "auto"
    VISUAL_MODEL_ID: str = "dima806/deepfake_vs_real_image_detection"
    AUDIO_MODEL_ID: str = "MelodyMachine/Deepfake-audio-detection"
    EXPLANATION_DIR: str = "data/explanations"
    FRAME_SAMPLE_RATE: int = 1  # 1 frame per second for video analysis
    MAX_VIDEO_FRAMES: int = 30  # Max frames sampled per video
    OPENAI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def project_root(self) -> Path:
        # backend/app/core/config.py -> backend/app/core -> backend/app -> backend -> ForensicAI
        return Path(__file__).resolve().parent.parent.parent.parent

    @property
    def upload_path(self) -> Path:
        path = self.project_root / self.UPLOAD_DIR
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def case_path(self) -> Path:
        path = self.project_root / self.CASE_DIR
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def report_path(self) -> Path:
        path = self.project_root / self.REPORT_DIR
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def model_path(self) -> Path:
        path = self.project_root / self.MODEL_DIR
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def explanation_path(self) -> Path:
        path = self.project_root / self.EXPLANATION_DIR
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def compute_device(self) -> str:
        if self.DEVICE == "auto":
            return "cuda" if torch.cuda.is_available() else "cpu"
        if self.DEVICE == "cuda" and not torch.cuda.is_available():
            return "cpu"
        return self.DEVICE

settings = Settings()
