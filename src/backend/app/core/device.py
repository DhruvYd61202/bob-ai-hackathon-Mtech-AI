import torch
from typing import Dict, Any
from app.core.config import settings

def get_device() -> torch.device:
    """Returns the optimal PyTorch torch.device based on availability and configuration."""
    target = settings.compute_device
    if target == "cuda" and torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")

def get_device_info() -> Dict[str, Any]:
    """Returns detailed hardware and acceleration capability metrics."""
    cuda_available = torch.cuda.is_available()
    device = get_device()
    info: Dict[str, Any] = {
        "device_type": str(device),
        "cuda_available": cuda_available,
        "configured_target": settings.DEVICE,
        "resolved_target": str(device),
    }
    if cuda_available and device.type == "cuda":
        info["gpu_name"] = torch.cuda.get_device_name(0)
        info["gpu_count"] = torch.cuda.device_count()
        info["vram_allocated_mb"] = round(torch.cuda.memory_allocated(0) / (1024 * 1024), 2)
        info["vram_reserved_mb"] = round(torch.cuda.memory_reserved(0) / (1024 * 1024), 2)
    else:
        info["gpu_name"] = None
        info["gpu_count"] = 0
        info["vram_allocated_mb"] = 0.0
        info["vram_reserved_mb"] = 0.0
    return info