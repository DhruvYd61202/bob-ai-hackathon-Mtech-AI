from pathlib import Path
from typing import Dict, Any
from app.models.model_manager import get_model_manager
from app.forensic.metadata import extract_metadata
from app.forensic.audio_artifacts import analyze_audio_forensics
from app.pipeline.fusion import fuse_multimodal_predictions

class AudioPipeline:
    def __init__(self):
        self.model_manager = get_model_manager()

    def process(self, audio_path: Path, case_id: str) -> Dict[str, Any]:
        """Executes full audio deepfake and spoof detection pipeline."""
        metadata = extract_metadata(audio_path, media_type="audio")

        # Supporting acoustic heuristics
        heuristics = analyze_audio_forensics(audio_path)

        # Primary neural audio detector
        audio_detector = self.model_manager.get_audio_detector()
        primary_audio_result = audio_detector.predict(audio_path)

        # Multimodal fusion
        fusion = fuse_multimodal_predictions(
            media_type="audio",
            audio_result=primary_audio_result,
            supporting_forensics=heuristics
        )

        fake_prob = primary_audio_result["fake_probability"]
        if fake_prob >= 0.70:
            narrative = (
                f"{primary_audio_result['model_name']} identified synthetic vocal patterns with "
                f"{fake_prob:.1%} certainty. Acoustic representations exhibit latent distribution anomalies "
                f"characteristic of neural text-to-speech (TTS) or voice cloning models."
            )
        elif fake_prob >= 0.50:
            narrative = (
                f"{primary_audio_result['model_name']} flagged borderline acoustic characteristics "
                f"({fake_prob:.1%} fake probability). Human forensic review of vocal tract resonance recommended."
            )
        else:
            narrative = (
                f"{primary_audio_result['model_name']} observed natural human vocal tract harmonics and "
                f"authentic acoustic breath patterns with {(1.0 - fake_prob):.1%} confidence."
            )

        return {
            "media_type": "audio",
            "file_name": audio_path.name,
            "duration_seconds": primary_audio_result.get("duration_seconds", heuristics.get("duration_sec", 0.0)),
            "primary_audio_ai": primary_audio_result,
            "supporting_forensics": heuristics,
            "fusion": fusion,
            "explanation": {
                "narrative": narrative
            },
            "metadata": metadata
        }