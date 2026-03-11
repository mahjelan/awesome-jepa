"""
Build a video descriptor from JEPA + pixel analysis for text/structured export.
The descriptor can be used to describe the video and to condition recreation
(e.g. text-to-video, retrieval, or semantic search).
"""
from __future__ import annotations

from typing import Any


def build_descriptor(
    video_id: str,
    title: str = "",
    channel: str = "",
    jepa_summary: str = "",
    latent_norm: float = 0.0,
    latent_dim: int = 0,
    predicted_next_norm: float | None = None,
    latent_preview: list[float] | None = None,
    predicted_next_preview: list[float] | None = None,
    pixel_summary: str = "",
    brightness: float = 0.5,
    contrast: float = 0.2,
    edge_density: float = 0.1,
    dominant_colors: list[list[int]] | None = None,
    frame_size: list[int] | None = None,
) -> tuple[str, dict[str, Any]]:
    """
    Build (descriptor_text, descriptor_json).
    - descriptor_text: human-readable prose suitable for prompts or captions to recreate the video.
    - descriptor_json: full structured data for programmatic use (latent fingerprint, colors, etc.).
    """
    latent_preview = latent_preview or []
    predicted_next_preview = predicted_next_preview or []
    dominant_colors = dominant_colors or []

    # Prose description for recreation / prompts
    parts = []
    if title:
        parts.append(f"Title: {title}.")
    if channel:
        parts.append(f"Channel: {channel}.")
    if jepa_summary:
        parts.append(jepa_summary)
    parts.append(
        f"JEPA latent norm ‖z‖={latent_norm:.3f}, "
        f"latent dimension {latent_dim}; "
        f"first 8 latent dimensions: [{', '.join(f'{x:.3f}' for x in latent_preview[:8])}]."
    )
    if predicted_next_norm is not None:
        parts.append(
            f"Predicted next latent norm ‖ẑ‖={predicted_next_norm:.3f}; "
            f"predicted next 8 dims: [{', '.join(f'{x:.3f}' for x in (predicted_next_preview or [])[:8])}]."
        )
    if pixel_summary:
        parts.append(f"Visual: {pixel_summary}.")
    parts.append(
        f"Brightness={brightness:.3f}, contrast={contrast:.3f}, edge_density={edge_density:.3f}."
    )
    if dominant_colors:
        rgb_str = ", ".join(f"RGB({c[0]},{c[1]},{c[2]})" for c in dominant_colors[:5])
        parts.append(f"Dominant colors: {rgb_str}.")
    if frame_size and len(frame_size) >= 2:
        parts.append(f"Reference frame size: {frame_size[0]}x{frame_size[1]}.")

    descriptor_text = " ".join(parts)

    # Structured JSON for programmatic recreation
    descriptor_json = {
        "video_id": video_id,
        "title": title,
        "channel": channel,
        "jepa": {
            "summary": jepa_summary,
            "latent_norm": round(latent_norm, 6),
            "latent_dim": latent_dim,
            "latent_preview": [round(x, 6) for x in latent_preview[:32]],
            "predicted_next_norm": round(predicted_next_norm, 6) if predicted_next_norm is not None else None,
            "predicted_next_preview": [round(x, 6) for x in (predicted_next_preview or [])[:32]],
        },
        "pixel": {
            "insight_summary": pixel_summary,
            "brightness": round(brightness, 6),
            "contrast": round(contrast, 6),
            "edge_density": round(edge_density, 6),
            "dominant_colors_rgb": dominant_colors,
            "frame_size": frame_size,
        },
        "descriptor_text": descriptor_text,
    }

    return descriptor_text, descriptor_json
