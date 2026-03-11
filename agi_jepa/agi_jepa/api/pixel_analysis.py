"""
Pixel-level analysis of YouTube video thumbnails (public frame images).
Fetches a representative frame, computes brightness, contrast, edge density, and dominant colors.
"""
from __future__ import annotations

import io
import urllib.request
from typing import Any

THUMB_BASE = "https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
THUMB_SD = "https://img.youtube.com/vi/{video_id}/sddefault.jpg"


def _fetch_image(video_id: str) -> bytes:
    """Fetch thumbnail image bytes; try hqdefault then sddefault."""
    for url in [THUMB_BASE.format(video_id=video_id), THUMB_SD.format(video_id=video_id)]:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "AGI-JEPA/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    return resp.read()
        except Exception:
            continue
    raise ValueError(f"Could not fetch thumbnail for video {video_id}")


def analyze_pixels(video_id: str) -> dict[str, Any]:
    """
    Analyze pixels of the video's thumbnail (representative frame).
    Returns brightness, contrast, edge_density, dominant_colors, frame_size.
    Requires Pillow and numpy.
    """
    try:
        from PIL import Image
        import numpy as np
    except ImportError as e:
        raise ValueError("Install Pillow and numpy for pixel analysis: pip install Pillow numpy") from e

    raw = _fetch_image(video_id)
    img = Image.open(io.BytesIO(raw))
    img = img.convert("RGB")
    w, h = img.size
    arr = np.array(img)

    # Grayscale for brightness/contrast/edges
    gray = np.dot(arr[..., :3], [0.299, 0.587, 0.114])

    brightness = float(np.mean(gray) / 255.0)
    contrast = float(np.std(gray) / 255.0) if gray.size else 0.0

    # Edge density: mean absolute gradient (numpy only)
    g = gray.astype(np.float64)
    dy = np.abs(np.diff(g, axis=0))
    dx = np.abs(np.diff(g, axis=1))
    edge_strength = (np.mean(dy) + np.mean(dx)) / (2.0 * 255.0)
    edge_density = float(np.clip(edge_strength, 0, 1))

    # Dominant colors: sample patches (no sklearn)
    dominant_colors = []
    for i in range(3):
        y = min((i * h // 3) % max(1, h - 30), h - 30)
        x = min((i * w // 3) % max(1, w - 30), w - 30)
        patch = arr[y : y + 30, x : x + 30].reshape(-1, 3)
        dominant_colors.append(np.mean(patch, axis=0).astype(int).tolist())

    return {
        "video_id": video_id,
        "thumbnail_url": THUMB_BASE.format(video_id=video_id),
        "frame_size": [w, h],
        "brightness": round(brightness, 4),
        "contrast": round(contrast, 4),
        "edge_density": round(edge_density, 4),
        "dominant_colors": dominant_colors,
        "insight_summary": _summarize(brightness, contrast, edge_density),
    }


def _summarize(brightness: float, contrast: float, edge_density: float) -> str:
    parts = []
    if brightness < 0.35:
        parts.append("dark frame")
    elif brightness > 0.75:
        parts.append("bright frame")
    else:
        parts.append("medium brightness")
    if contrast > 0.25:
        parts.append("high contrast")
    elif contrast < 0.1:
        parts.append("flat/low contrast")
    if edge_density > 0.15:
        parts.append("visually busy")
    elif edge_density < 0.05:
        parts.append("smooth/simple")
    return "; ".join(parts)
