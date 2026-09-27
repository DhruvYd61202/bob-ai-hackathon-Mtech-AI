import hashlib
from pathlib import Path
from typing import Dict, Any, Optional
from PIL import Image
from PIL.ExifTags import TAGS

KNOWN_EDITING_SIGNATURES = [
    "photoshop", "gimp", "lightroom", "deepfacelab", "faceapp",
    "faceswap", "stable diffusion", "midjourney", "canva", "premiere",
    "after effects", "capcut", "inshot", "ffmpeg"
]

def calculate_hashes(file_path: Path) -> Dict[str, str]:
    """Computes SHA-256 and MD5 cryptographic hashes for chain of custody."""
    sha256 = hashlib.sha256()
    md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            sha256.update(chunk)
            md5.update(chunk)
    return {
        "sha256": sha256.hexdigest(),
        "md5": md5.hexdigest()
    }

def extract_metadata(file_path: Path, media_type: str) -> Dict[str, Any]:
    """
    Extracts container metadata, EXIF tags, camera information, and software signatures.
    """
    hashes = calculate_hashes(file_path)
    file_stat = file_path.stat()
    file_size_bytes = file_stat.st_size

    result: Dict[str, Any] = {
        "file_name": file_path.name,
        "file_size_bytes": file_size_bytes,
        "file_size_mb": round(file_size_bytes / (1024 * 1024), 2),
        "media_type": media_type,
        "sha256": hashes["sha256"],
        "md5": hashes["md5"],
        "exif_present": False,
        "software_signature": None,
        "editing_software_detected": False,
        "camera_make": None,
        "camera_model": None,
        "creation_date": None,
        "tags": {}
    }

    if media_type == "image":
        try:
            with Image.open(file_path) as img:
                info = img._getexif()
                if info:
                    result["exif_present"] = True
                    for tag_id, value in info.items():
                        tag_name = TAGS.get(tag_id, str(tag_id))
                        # Filter long binary bytes
                        if isinstance(value, bytes) and len(value) > 64:
                            continue
                        str_val = str(value).strip()
                        result["tags"][tag_name] = str_val

                        # Check camera & software
                        if tag_name == "Make":
                            result["camera_make"] = str_val
                        elif tag_name == "Model":
                            result["camera_model"] = str_val
                        elif tag_name == "Software":
                            result["software_signature"] = str_val
                        elif tag_name == "DateTime" or tag_name == "DateTimeOriginal":
                            result["creation_date"] = str_val

            # Scan for known software signatures
            full_meta_str = " ".join([str(v) for v in result["tags"].values()]).lower()
            if result["software_signature"]:
                full_meta_str += " " + result["software_signature"].lower()

            for sig in KNOWN_EDITING_SIGNATURES:
                if sig in full_meta_str:
                    result["editing_software_detected"] = True
                    if not result["software_signature"]:
                        result["software_signature"] = sig.title()
                    break

        except Exception:
            pass

    return result