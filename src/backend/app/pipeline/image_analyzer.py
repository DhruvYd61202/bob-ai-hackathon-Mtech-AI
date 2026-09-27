import io
from pathlib import Path
from typing import Any, Dict, Tuple
import cv2
import imagehash
import numpy as np
from PIL import Image, ImageChops, ImageEnhance, ExifTags
from app.evidence.builder import EvidenceBuilder
from app.evidence.graph import EvidenceGraphBuilder

class ImageAnalyzer:
    def __init__(self, mtcnn):
        self.mtcnn = mtcnn

    def extract_metadata(self, pil_img: Image.Image, file_path: Path) -> Dict[str, Any]:
        info: Dict[str, Any] = {
            "has_exif": False,
            "camera_make": None,
            "camera_model": None,
            "software_signature": None,
            "datetime_original": None,
            "raw_tags_count": 0,
            "perceptual_hash": None
        }
        try:
            exif_raw = pil_img.getexif()
            if exif_raw:
                info["raw_tags_count"] = len(exif_raw)
                for tag_id, value in exif_raw.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    if tag_name == "Make":
                        info["camera_make"] = str(value).strip()
                    elif tag_name == "Model":
                        info["camera_model"] = str(value).strip()
                    elif tag_name == "Software":
                        info["software_signature"] = str(value).strip()
                    elif tag_name in ("DateTimeOriginal", "DateTime"):
                        info["datetime_original"] = str(value).strip()
                if info["camera_make"] or info["camera_model"] or info["raw_tags_count"] > 3:
                    info["has_exif"] = True
        except Exception:
            pass

        try:
            info["perceptual_hash"] = str(imagehash.phash(pil_img))
        except Exception:
            pass
        return info

    def analyze_visual_artifacts(
        self,
        cv_img: np.ndarray,
        pil_img: Image.Image,
        builder: EvidenceBuilder
    ) -> Tuple[Dict[str, Any], float]:
        findings: Dict[str, Any] = {}
        risk_accum = 0.15

        # Error Level Analysis (ELA)
        try:
            buf = io.BytesIO()
            pil_img.save(buf, format="JPEG", quality=90)
            buf.seek(0)
            resaved = Image.open(buf)
            ela_im = ImageChops.difference(pil_img, resaved)
            extrema = ela_im.getextrema()
            max_diff = max([ex[1] for ex in extrema]) if extrema else 1
            scale = 255.0 / max(1, max_diff)
            ela_im = ImageEnhance.Brightness(ela_im).enhance(scale)
            ela_np = np.array(ela_im)
            ela_diff_mean = float(np.mean(ela_np))
            findings["ela_mean_intensity"] = round(ela_diff_mean, 2)
            
            if ela_diff_mean > 45.0:
                builder.add_visual_evidence(
                    title="Compression Inconsistency (ELA)",
                    description=f"Error Level Analysis detected elevated compression residual variance ({ela_diff_mean:.1f}). This indicates multi-generation compression or localized digital alteration.",
                    severity="medium",
                    confidence=0.76,
                    technical_details={"ela_mean": ela_diff_mean}
                )
                risk_accum += 0.25
        except Exception as e:
            findings["ela_error"] = str(e)

        # Laplacian Noise Residual
        try:
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            findings["laplacian_variance"] = round(lap_var, 2)

            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            noise_residual = cv2.absdiff(gray, blurred)
            noise_std = float(np.std(noise_residual))
            findings["noise_residual_std"] = round(noise_std, 2)

            if noise_std < 1.2:
                builder.add_visual_evidence(
                    title="Abnormally Low Sensor Noise Residual",
                    description=f"Residual noise standard deviation is unusually low ({noise_std:.2f}), a common characteristic of synthetically generated or heavily denoised neural images.",
                    severity="medium",
                    confidence=0.72,
                    technical_details={"noise_std": noise_std}
                )
                risk_accum += 0.20
            elif noise_std > 18.0:
                builder.add_visual_evidence(
                    title="Elevated High-Frequency Noise Artifacts",
                    description=f"High noise residual variance ({noise_std:.2f}) suggests adversarial perturbation, heavy digital grain insertion, or sharpening filters.",
                    severity="low",
                    confidence=0.68,
                    technical_details={"noise_std": noise_std}
                )
                risk_accum += 0.15
        except Exception as e:
            findings["noise_error"] = str(e)

        # 2D Fast Fourier Transform (FFT)
        try:
            dft = np.fft.fft2(gray)
            dft_shift = np.fft.fftshift(dft)
            magnitude_spectrum = 20 * np.log(np.abs(dft_shift) + 1e-9)
            h, w = gray.shape
            crow, ccol = h // 2, w // 2
            radius = min(h, w) // 6
            mask = np.zeros((h, w), np.uint8)
            cv2.circle(mask, (ccol, crow), radius, 1, -1)
            low_freq_energy = float(np.sum(magnitude_spectrum[mask == 1]))
            high_freq_energy = float(np.sum(magnitude_spectrum[mask == 0]))
            ratio = (high_freq_energy / (low_freq_energy + 1e-9))
            findings["high_freq_fft_ratio"] = round(ratio, 4)

            if ratio < 0.25:
                builder.add_visual_evidence(
                    title="Frequency Domain High-Band Attenuation",
                    description="2D Fast Fourier Transform shows truncated high-frequency spectral components, common in upscaled neural generator outputs.",
                    severity="low",
                    confidence=0.65,
                    technical_details={"fft_ratio": ratio}
                )
                risk_accum += 0.15
        except Exception as e:
            findings["fft_error"] = str(e)

        return findings, min(max(risk_accum, 0.0), 1.0)

    def analyze_faces(
        self,
        pil_img: Image.Image,
        cv_img: np.ndarray,
        builder: EvidenceBuilder,
        graph_builder: EvidenceGraphBuilder
    ) -> Tuple[Dict[str, Any], float]:
        findings: Dict[str, Any] = {"face_count": 0, "detected_faces": []}
        face_risk = 0.15
        try:
            boxes, probs = self.mtcnn.detect(pil_img)
            if boxes is not None and len(boxes) > 0:
                findings["face_count"] = len(boxes)
                for idx, (box, prob) in enumerate(zip(boxes, probs)):
                    if prob is None or prob < 0.65:
                        continue
                    b_clean = [round(float(coord), 1) for coord in box]
                    confidence = round(float(prob), 3)

                    x1, y1, x2, y2 = [int(max(0, c)) for c in box]
                    h_img, w_img = cv_img.shape[:2]
                    x2, y2 = min(w_img, x2), min(h_img, y2)

                    face_info: Dict[str, Any] = {
                        "index": idx,
                        "bbox": b_clean,
                        "confidence": confidence
                    }

                    if (x2 - x1) > 20 and (y2 - y1) > 20:
                        face_crop = cv_img[y1:y2, x1:x2]
                        face_gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
                        face_blur = float(cv2.Laplacian(face_gray, cv2.CV_64F).var())
                        face_info["sharpness_laplacian"] = round(face_blur, 2)

                        full_gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
                        bg_blur = float(cv2.Laplacian(full_gray, cv2.CV_64F).var())
                        if bg_blur > 100.0 and face_blur < 40.0:
                            builder.add_face_evidence(
                                title="Facial Focal Blur Mismatch",
                                description=f"Face region sharpness ({face_blur:.1f}) is substantially lower than surrounding background ({bg_blur:.1f}), characteristic of deepfake face swapping or boundary blending.",
                                severity="high",
                                confidence=0.82,
                                location={"bbox": b_clean},
                                technical_details={"face_blur": face_blur, "bg_blur": bg_blur}
                            )
                            face_risk += 0.35

                    findings["detected_faces"].append(face_info)
                    graph_builder.add_face_node(None, idx, b_clean, confidence)

                if findings["face_count"] > 1:
                    builder.add_face_evidence(
                        title="Multiple Facial Subjects Detected",
                        description=f"{findings['face_count']} facial regions localized across media frame.",
                        severity="info",
                        confidence=0.85,
                        technical_details={"count": findings["face_count"]}
                    )
            else:
                builder.add_face_evidence(
                    title="No Human Faces Localized",
                    description="MTCNN face localization model found no facial landmarks exceeding detection threshold.",
                    severity="info",
                    confidence=0.90
                )
        except Exception as e:
            findings["error"] = str(e)

        return findings, min(max(face_risk, 0.0), 1.0)
