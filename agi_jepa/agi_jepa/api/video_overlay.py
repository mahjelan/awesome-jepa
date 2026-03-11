"""
Download a YouTube video (short segment) and burn in JEPA + pixel analysis overlay.
Requires: yt-dlp, opencv-python, numpy. Optional: ffmpeg (to limit download duration).
"""
from __future__ import annotations

import tempfile
import shutil
from pathlib import Path
from typing import Any, Optional

# Default: process first 30 seconds only
DEFAULT_MAX_DURATION_SEC = 30


def _download_video(video_id: str, out_dir: Path, max_duration_sec: int) -> None:
    try:
        import yt_dlp
    except ImportError as e:
        raise ValueError("Install yt-dlp for video download: pip install yt-dlp") from e

    url = f"https://www.youtube.com/watch?v={video_id}"
    out_dir.mkdir(parents=True, exist_ok=True)
    opts = {
        "outtmpl": str(out_dir / "%(id)s.%(ext)s"),
        "format": "best[height<=480][ext=mp4]/best[height<=480]/best[ext=mp4]/best",
        "quiet": True,
        "no_warnings": True,
    }
    if max_duration_sec > 0:
        opts["postprocessor_args"] = {"ffmpeg": ["-t", str(max_duration_sec)]}
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])
    except Exception as e:
        raise ValueError(f"yt-dlp download failed: {e}") from e
    # Ensure we have a file (yt-dlp may use different extension)
    if not (out_dir / f"{video_id}.mp4").exists():
        found = list(out_dir.glob("*.mp4")) + list(out_dir.glob("*.webm")) + list(out_dir.glob("*.mkv"))
        if not found:
            raise ValueError("Download produced no video file; install ffmpeg for format conversion")


def _draw_overlay(
    frame,
    summary: str,
    latent_norm: float,
    pred_norm: Optional[float],
    latent_preview: list[float],
    pred_preview: Optional[list[float]],
    pixel_summary: str,
    brightness: float,
    contrast: float,
    edge_density: float,
    dominant_colors: list[list[int]],
) -> None:
    import cv2
    import numpy as np

    h, w = frame.shape[:2]
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.5
    thickness = 1
    line_h = 20
    y0 = h - 220
    if y0 < 10:
        y0 = 10

    # Semi-transparent panel
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, y0), (w, h), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)

    # Text (BGR)
    white = (255, 255, 255)
    blue = (255, 180, 80)
    orange = (80, 180, 255)
    y = y0 + line_h
    cv2.putText(frame, "JEPA analysis overlay", (10, y), font, 0.6, (255, 200, 100), thickness + 1)
    y += line_h
    summary_short = (summary[:70] + "...") if len(summary) > 70 else summary
    cv2.putText(frame, summary_short, (10, y), font, font_scale, white, thickness)
    y += line_h
    cv2.putText(frame, f"||z||= {latent_norm:.3f}", (10, y), font, font_scale, blue, thickness)
    if pred_norm is not None:
        cv2.putText(frame, f"  ||z_pred||= {pred_norm:.3f}", (180, y), font, font_scale, orange, thickness)
    y += line_h
    cv2.putText(frame, "Pixel: " + pixel_summary, (10, y), font, font_scale * 0.9, (200, 200, 200), thickness)
    y += line_h
    cv2.putText(frame, f"B:{brightness:.2f} C:{contrast:.2f} E:{edge_density:.2f}", (10, y), font, font_scale * 0.9, white, thickness)
    y += line_h + 4
    # Latent bars (first 8)
    z = latent_preview[:8]
    z_pred = (pred_preview or [])[:8]
    max_z = max((abs(x) for x in z), default=1e-6)
    max_p = max((abs(x) for x in z_pred), default=max_z) if z_pred else max_z
    bar_w = max(2, (w - 30) // 16)
    for i, v in enumerate(z):
        x1 = 10 + i * (bar_w + 2)
        bh = int(30 * min(1.0, abs(v) / max_z))
        color = (255, 180, 80) if v >= 0 else (200, 200, 255)
        cv2.rectangle(frame, (x1, y + 30 - bh), (x1 + bar_w, y + 30), color, -1)
    if z_pred:
        y += 38
        for i, v in enumerate(z_pred):
            x1 = 10 + i * (bar_w + 2)
            bh = int(30 * min(1.0, abs(v) / max_p))
            color = (80, 180, 255) if v >= 0 else (255, 220, 180)
            cv2.rectangle(frame, (x1, y + 30 - bh), (x1 + bar_w, y + 30), color, -1)
        y += 38
    # Dominant colors
    for i, rgb in enumerate(dominant_colors[:3]):
        bx = 10 + i * 28
        bgr = (int(rgb[2]), int(rgb[1]), int(rgb[0]))
        cv2.rectangle(frame, (bx, y), (bx + 24, y + 18), bgr, -1)
        cv2.rectangle(frame, (bx, y), (bx + 24, y + 18), white, 1)


def render_video_with_overlay(
    video_id: str,
    jepa_summary: str,
    latent_norm: float,
    predicted_next_norm: Optional[float],
    latent_preview: list[float],
    predicted_next_preview: Optional[list[float]],
    pixel_insight_summary: str,
    brightness: float,
    contrast: float,
    edge_density: float,
    dominant_colors: list[list[int]],
    max_duration_sec: int = DEFAULT_MAX_DURATION_SEC,
    out_path: Optional[Path] = None,
) -> Path:
    """
    Download the video (first max_duration_sec), draw overlay on each frame, write to out_path.
    Returns path to the output MP4 file.
    """
    try:
        import cv2
    except ImportError as e:
        raise ValueError("Install opencv-python for video overlay: pip install opencv-python") from e

    tmp_dir = Path(tempfile.mkdtemp(prefix="jepa_overlay_"))
    try:
        _download_video(video_id, tmp_dir, max_duration_sec)
        input_file = tmp_dir / f"{video_id}.mp4"
        if not input_file.exists():
            for p in tmp_dir.iterdir():
                if p.is_file() and p.suffix in (".mp4", ".webm", ".mkv"):
                    input_file = p
                    break
            else:
                raise ValueError("Download produced no readable file")

        cap = cv2.VideoCapture(str(input_file))
        if not cap.isOpened():
            raise ValueError("Could not open downloaded video")
        fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        out_file = out_path or (tmp_dir / "output_with_overlay.mp4")
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(str(out_file), fourcc, fps, (width, height))
        if not writer.isOpened():
            cap.release()
            raise ValueError("Could not create output video")

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            _draw_overlay(
                frame,
                jepa_summary,
                latent_norm,
                predicted_next_norm,
                latent_preview or [],
                predicted_next_preview,
                pixel_insight_summary,
                brightness,
                contrast,
                edge_density,
                dominant_colors or [],
            )
            writer.write(frame)
        cap.release()
        writer.release()

        if out_path is None:
            # Move to a persistent temp path so we can return it and serve it
            final = Path(tempfile.gettempdir()) / f"jepa_overlay_{video_id}.mp4"
            shutil.move(str(out_file), str(final))
            return final
        return out_path
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
