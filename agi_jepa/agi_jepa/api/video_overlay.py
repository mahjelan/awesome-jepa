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


def _apply_pixel_modifications(
    frame,
    brightness: float = 1.0,
    contrast: float = 1.0,
    saturation: float = 1.0,
    tint_r: int = 0,
    tint_g: int = 0,
    tint_b: int = 0,
) -> None:
    """
    Apply palette modifications in-place to a BGR frame.
    brightness/contrast/saturation: 1.0 = no change; typical range 0.5–1.5.
    tint_*: additive offset -30..30 (BGR order for OpenCV: tint_b, tint_g, tint_r).
    """
    import cv2
    import numpy as np

    if brightness != 1.0 or contrast != 1.0:
        alpha = float(contrast)
        beta = (float(brightness) - 1.0) * 128.0
        frame[:] = cv2.convertScaleAbs(frame, alpha=alpha, beta=beta)

    if saturation != 1.0:
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV).astype(np.float64)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * saturation, 0, 255)
        frame[:] = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    if tint_b != 0 or tint_g != 0 or tint_r != 0:
        frame[:] = np.clip(
            frame.astype(np.int32) + np.array([tint_b, tint_g, tint_r], dtype=np.int32),
            0,
            255,
        ).astype(np.uint8)


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
    frame_index: Optional[int] = None,
    total_frames_estimate: Optional[int] = None,
    temporal_frame_errors: Optional[list[float]] = None,
    temporal_high_error_indices: Optional[list[int]] = None,
    semantic_keyframe_labels: Optional[list[dict]] = None,
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

    # Cohesive: temporal timeline at top + semantic corner + cut badge
    if temporal_frame_errors and frame_index is not None and total_frames_estimate and total_frames_estimate > 0:
        n = len(temporal_frame_errors)
        analysis_idx = min((frame_index * n) // total_frames_estimate, n - 1) if n else 0
        # Thin timeline strip at top (32px)
        strip_h = 32
        overlay_top = frame.copy()
        cv2.rectangle(overlay_top, (0, 0), (w, strip_h), (20, 20, 28), -1)
        cv2.addWeighted(overlay_top, 0.7, frame, 0.3, 0, frame)
        max_e = max(temporal_frame_errors) if temporal_frame_errors else 1.0
        n_bars = min(40, n)
        bar_w = max(2, (w - 20) // n_bars)
        for i in range(n_bars):
            idx = (i * n) // n_bars
            if idx < len(temporal_frame_errors):
                e = temporal_frame_errors[idx]
                bh = int((strip_h - 8) * min(1.0, e / max_e)) if max_e > 0 else 0
                x1 = 10 + i * bar_w
                is_cut = (temporal_high_error_indices or []) and (idx + 1) in temporal_high_error_indices
                color = (80, 120, 255) if is_cut else (80, 80, 120)
                cv2.rectangle(frame, (x1, strip_h - 4 - bh), (x1 + bar_w - 1, strip_h - 4), color, -1)
        bar_idx = (analysis_idx * n_bars) // n if n else 0
        cur_x = 10 + bar_idx * bar_w
        cv2.rectangle(frame, (cur_x, 0), (min(cur_x + 3, w - 10), strip_h), (255, 200, 100), -1)
        cv2.putText(frame, "Temporal", (10, 14), font, 0.35, (180, 180, 200), 1)
        # Cut badge
        if (temporal_high_error_indices or []) and (analysis_idx + 1) in temporal_high_error_indices:
            cv2.rectangle(frame, (w - 70, 4), (w - 6, strip_h - 4), (40, 60, 255), -1)
            cv2.putText(frame, "CUT", (w - 62, 18), font, 0.45, (255, 255, 255), 1)
        # Semantic from nearest keyframe (top-right below strip)
        if semantic_keyframe_labels:
            def _dist(kf):
                kf_idx = kf.get("frame_index", 0)
                return abs(kf_idx - analysis_idx)
            nearest = min(semantic_keyframe_labels, key=_dist)
            top = nearest.get("top_classes") or []
            labels = [c.get("label", "") for c in top[:3] if c.get("label")]
            if labels:
                text = " | ".join(labels[:3])
                cv2.rectangle(frame, (w - 220, strip_h + 2), (w - 6, strip_h + 28), (30, 30, 40), -1)
                cv2.putText(frame, text[:35], (w - 212, strip_h + 20), font, 0.4, (200, 220, 255), 1)

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


def _wrap_text(text: str, max_chars_per_line: int = 55) -> list[str]:
    """Split text into lines that fit on screen."""
    words = text.replace("\n", " ").split()
    lines: list[str] = []
    current: list[str] = []
    for w in words:
        trial = " ".join(current) + (" " if current else "") + w
        if len(trial) <= max_chars_per_line:
            current.append(w)
        else:
            if current:
                lines.append(" ".join(current))
            current = [w] if len(w) <= max_chars_per_line else [w[:max_chars_per_line]]
    if current:
        lines.append(" ".join(current))
    return lines


def _draw_descriptor_title_card(
    frame,
    descriptor_text: str,
    width: int,
    height: int,
) -> None:
    """Draw descriptor text on a full-frame title card (e.g. for recreation)."""
    import cv2
    frame[:] = (32, 32, 40)
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.45
    thickness = 1
    line_height = 22
    margin = 24
    lines = _wrap_text(descriptor_text, max_chars_per_line=55)
    y = margin + line_height
    for line in lines[: min(20, len(lines))]:
        cv2.putText(frame, line[:70], (margin, y), font, font_scale, (220, 220, 220), thickness)
        y += line_height
    cv2.putText(
        frame,
        "JEPA video descriptor — use this text/data to recreate or search",
        (margin, height - margin),
        font,
        0.4,
        (150, 150, 180),
        thickness,
    )


def _draw_end_card(
    frame,
    width: int,
    height: int,
    semantic_aggregated_top: Optional[list[dict]] = None,
    num_cuts: int = 0,
) -> None:
    """Draw a short 'cohesive analysis complete' end card with semantic summary."""
    import cv2
    frame[:] = (28, 28, 38)
    font = cv2.FONT_HERSHEY_SIMPLEX
    margin = 32
    y = height // 2 - 50
    cv2.putText(frame, "AGI-JEPA Cohesive Analysis Complete", (margin, y), font, 0.8, (255, 220, 180), 2)
    y += 44
    cv2.putText(frame, "Temporal + Semantic + JEPA + Pixel", (margin, y), font, 0.5, (200, 200, 220), 1)
    y += 32
    if num_cuts > 0:
        cv2.putText(frame, f"Scene changes detected: {num_cuts}", (margin, y), font, 0.5, (180, 200, 255), 1)
        y += 28
    if semantic_aggregated_top:
        top_labels = [x.get("label", "") for x in semantic_aggregated_top[:8] if x.get("label")]
        if top_labels:
            cv2.putText(frame, "Top content: " + ", ".join(top_labels[:6]), (margin, y), font, 0.45, (220, 220, 255), 1)
    cv2.putText(frame, "Use descriptor text for recreation or search", (margin, height - margin), font, 0.4, (140, 140, 170), 1)


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
    descriptor_text: Optional[str] = None,
    descriptor_title_card_sec: float = 4.0,
    mod_brightness: float = 1.0,
    mod_contrast: float = 1.0,
    mod_saturation: float = 1.0,
    mod_tint_r: int = 0,
    mod_tint_g: int = 0,
    mod_tint_b: int = 0,
    temporal_frame_errors: Optional[list[float]] = None,
    temporal_high_error_indices: Optional[list[int]] = None,
    semantic_keyframe_labels: Optional[list[dict]] = None,
    semantic_aggregated_top: Optional[list[dict]] = None,
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

        total_frames_estimate = int(fps * max_duration_sec)
        if descriptor_text and descriptor_title_card_sec > 0:
            import numpy as np
            n_card_frames = int(fps * descriptor_title_card_sec)
            for _ in range(n_card_frames):
                frame = np.zeros((height, width, 3), dtype=np.uint8)
                _draw_descriptor_title_card(frame, descriptor_text, width, height)
                writer.write(frame)

        frame_index = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            _apply_pixel_modifications(
                frame,
                brightness=mod_brightness,
                contrast=mod_contrast,
                saturation=mod_saturation,
                tint_r=mod_tint_r,
                tint_g=mod_tint_g,
                tint_b=mod_tint_b,
            )
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
                frame_index=frame_index,
                total_frames_estimate=total_frames_estimate,
                temporal_frame_errors=temporal_frame_errors,
                temporal_high_error_indices=temporal_high_error_indices,
                semantic_keyframe_labels=semantic_keyframe_labels,
            )
            writer.write(frame)
            frame_index += 1
        # Optional end card when we have temporal/semantic data
        has_content = (temporal_frame_errors and len(temporal_frame_errors) > 0) or (
            semantic_aggregated_top and len(semantic_aggregated_top) > 0
        )
        if has_content:
            import numpy as np
            n_end_frames = int(fps * 3)
            num_cuts = len(temporal_high_error_indices) if temporal_high_error_indices else 0
            for _ in range(n_end_frames):
                end_frame = np.zeros((height, width, 3), dtype=np.uint8)
                _draw_end_card(end_frame, width, height, semantic_aggregated_top, num_cuts)
                writer.write(end_frame)
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
