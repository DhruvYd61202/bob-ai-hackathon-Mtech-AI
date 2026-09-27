from pathlib import Path
from typing import Dict, Any, List
from PIL import Image
from app.core.config import settings
from app.core.storage import get_case_explanations_dir
from app.models.model_manager import get_model_manager
from app.forensic.metadata import extract_metadata
from app.forensic.image_artifacts import analyze_image_forensics
from app.explainability.gradcam import generate_attention_overlay, save_explanation_image, overlay_face_on_full_frame
from app.explainability.explanation import generate_visual_explanation_summary
from app.pipeline.fusion import fuse_multimodal_predictions

class ImagePipeline:
    def __init__(self):
        self.model_manager = get_model_manager()

    def process(self, image_path: Path, case_id: str) -> Dict[str, Any]:
        """Executes full image forensic analysis with face detection, ViT inference, and explainability."""
        metadata = extract_metadata(image_path, media_type="image")
        pil_img = Image.open(image_path).convert("RGB")
        w, h = pil_img.size

        # Secondary supporting heuristics
        heuristics = analyze_image_forensics(pil_img)

        # 1. Face Detection & Alignment
        face_detector = self.model_manager.get_face_detector()
        faces = face_detector.detect_faces(pil_img)

        # 2. Visual Deepfake Inference
        visual_detector = self.model_manager.get_visual_detector()
        explanations_dir = get_case_explanations_dir(case_id)

        face_results: List[Dict[str, Any]] = []
        explanation_urls: List[str] = []

        if faces:
            # Face-centric analysis
            for f in faces:
                crop = f["crop"]
                pred = visual_detector.predict(crop, return_attention=True)
                attn_map = pred.get("attention_map")

                expl_rel_url = None
                if attn_map is not None:
                    face_overlay, heatmap_only = generate_attention_overlay(crop, attn_map)
                    full_overlay = overlay_face_on_full_frame(pil_img, f["padded_box"], face_overlay)

                    filename = f"expl_face_{f['face_index']}.jpg"
                    save_path = explanations_dir / filename
                    save_explanation_image(full_overlay, save_path)
                    expl_rel_url = f"/explanations/{case_id}/{filename}"
                    explanation_urls.append(expl_rel_url)

                face_results.append({
                    "face_index": f["face_index"],
                    "box": f["box"],
                    "confidence": f["confidence"],
                    "fake_probability": pred["fake_probability"],
                    "real_probability": pred["real_probability"],
                    "predicted_label": pred["predicted_label"],
                    "explanation_url": expl_rel_url,
                    "model_name": pred["model_name"],
                    "model_id": pred["model_id"]
                })

            # Identify dominant face (highest fake probability or highest face detector confidence)
            dominant_face = max(face_results, key=lambda x: x["fake_probability"])
            primary_visual_result = {
                "fake_probability": dominant_face["fake_probability"],
                "real_probability": dominant_face["real_probability"],
                "confidence": dominant_face["confidence"],
                "predicted_label": dominant_face["predicted_label"],
                "model_name": dominant_face["model_name"],
                "model_id": dominant_face["model_id"]
            }
            primary_expl_url = dominant_face.get("explanation_url")
        else:
            # No face detected: run whole-image ViT evaluation
            pred = visual_detector.predict(pil_img, return_attention=True)
            attn_map = pred.get("attention_map")
            primary_expl_url = None

            if attn_map is not None:
                overlay, _ = generate_attention_overlay(pil_img, attn_map)
                filename = "expl_full_image.jpg"
                save_path = explanations_dir / filename
                save_explanation_image(overlay, save_path)
                primary_expl_url = f"/explanations/{case_id}/{filename}"
                explanation_urls.append(primary_expl_url)

            primary_visual_result = pred

        # 3. Multimodal Probabilistic Fusion
        fusion = fuse_multimodal_predictions(
            media_type="image",
            visual_result=primary_visual_result,
            supporting_forensics=heuristics
        )

        # 4. Generate Narrative Summary
        narrative = generate_visual_explanation_summary(
            fake_probability=primary_visual_result["fake_probability"],
            model_name=primary_visual_result["model_name"],
            has_faces=len(faces) > 0,
            attention_peak_area="facial boundary and periorbital regions" if len(faces) > 0 else "scene background"
        )

        return {
            "media_type": "image",
            "file_name": image_path.name,
            "dimensions": {"width": w, "height": h},
            "faces_detected": len(faces),
            "faces": face_results,
            "primary_visual_ai": primary_visual_result,
            "supporting_forensics": heuristics,
            "fusion": fusion,
            "explanation": {
                "primary_explanation_url": primary_expl_url,
                "all_explanations": explanation_urls,
                "narrative": narrative
            },
            "metadata": metadata
        }