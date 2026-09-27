import io
from typing import Dict, Any, Union
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
import cv2

def compute_ela(image: Image.Image, quality: int = 90) -> Dict[str, Any]:
    """
    Performs Error Level Analysis (ELA) to detect differential JPEG compression.
    """
    img_rgb = image.convert("RGB")
    buf = io.BytesIO()
    img_rgb.save(buf, "JPEG", quality=quality)
    buf.seek(0)
    recompressed = Image.open(buf)

    diff = ImageChops.difference(img_rgb, recompressed)
    diff_arr = np.array(diff, dtype=np.float32)

    mean_diff = float(np.mean(diff_arr))
    max_diff = float(np.max(diff_arr))
    diff_std = float(np.std(diff_arr))

    # Normalized ELA irregularity metric [0, 1]
    ela_anomaly_score = float(np.clip((diff_std / (mean_diff + 1e-5)) * 0.15, 0.0, 1.0))

    return {
        "mean_error": round(mean_diff, 2),
        "max_error": round(max_diff, 2),
        "error_std": round(diff_std, 2),
        "ela_anomaly_score": round(ela_anomaly_score, 4),
        "compression_uniformity": "irregular" if diff_std > 12.0 else "uniform"
    }

def compute_fft(image: Image.Image) -> Dict[str, Any]:
    """
    Computes 2D Fast Fourier Transform frequency spectrum to detect generative periodic grid artifacts.
    """
    img_gray = np.array(image.convert("L"), dtype=np.float32)
    h, w = img_gray.shape

    f = np.fft.fft2(img_gray)
    fshift = np.fft.fftshift(f)
    magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-5)

    # Analyze high-frequency energy ratio
    cy, cx = h // 2, w // 2
    r = min(h, w) // 4

    y, x = np.ogrid[:h, :w]
    mask = (x - cx)**2 + (y - cy)**2 <= r**2

    low_freq_energy = np.mean(magnitude_spectrum[mask])
    high_freq_energy = np.mean(magnitude_spectrum[~mask])

    ratio = float(high_freq_energy / (low_freq_energy + 1e-5))
    fft_anomaly_score = float(np.clip((ratio - 0.40) * 1.5, 0.0, 1.0))

    return {
        "high_freq_energy": round(float(high_freq_energy), 2),
        "low_freq_energy": round(float(low_freq_energy), 2),
        "energy_ratio": round(ratio, 4),
        "fft_anomaly_score": round(fft_anomaly_score, 4),
        "spectral_pattern": "anomalous_high_frequencies" if ratio > 0.70 else "normal_attenuation"
    }

def analyze_image_forensics(image: Image.Image) -> Dict[str, Any]:
    """
    Aggregates image forensic heuristics as secondary supporting evidence.
    """
    ela_res = compute_ela(image)
    fft_res = compute_fft(image)

    # Heuristic support score
    heuristic_score = (0.50 * ela_res["ela_anomaly_score"]) + (0.50 * fft_res["fft_anomaly_score"])
    heuristic_score = float(np.clip(heuristic_score, 0.0, 1.0))

    return {
        "ela": ela_res,
        "fft": fft_res,
        "supporting_forensic_score": round(heuristic_score, 4),
        "summary": (
            f"Error Level Analysis exhibits {ela_res['compression_uniformity']} compression "
            f"(std: {ela_res['error_std']}). Spectral FFT demonstrates {fft_res['spectral_pattern']} "
            f"(energy ratio: {fft_res['energy_ratio']})."
        )
    }