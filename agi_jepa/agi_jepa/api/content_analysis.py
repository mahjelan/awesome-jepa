"""
Analyze video content: temporal structure (frame-to-frame prediction, scene change) and
semantic summary (keyframe labels from a pretrained vision model).
Uses: yt-dlp, opencv, torch, torchvision (ResNet18).
"""
from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Any, Optional

# Human-readable labels for common ImageNet indices (subset of 1000)
IMAGENET_LABELS: dict[int, str] = {
    0: "tench", 1: "goldfish", 2: "great white shark", 3: "tiger shark", 4: "hammerhead",
    5: "electric ray", 6: "stingray", 7: "cock", 8: "hen", 9: "ostrich",
    10: "brambling", 11: "goldfinch", 12: "house finch", 13: "junco", 14: "indigo bunting",
    15: "robin", 16: "bulbul", 17: "jay", 18: "magpie", 19: "chickadee", 20: "water ouzel",
    281: "tabby cat", 282: "tiger cat", 283: "Persian cat", 284: "Siamese cat", 285: "Egyptian cat",
    292: "lion", 293: "tiger", 294: "cheetah", 295: "brown bear", 296: "american black bear",
    297: "ice bear", 298: "sloth bear", 299: "mongoose", 300: "meerkat",
    207: "golden retriever", 208: "Labrador retriever", 209: "cocker spaniel", 210: "German shepherd",
    211: "standard poodle", 212: "toy poodle", 213: "miniature poodle",
    400: "accordion", 401: "acoustic guitar", 402: "cello", 403: "drum", 404: "electric guitar",
    405: "grand piano", 406: "laptop", 407: "modem", 408: "monitor", 409: "mouse",
    410: "printer", 411: "stethoscope", 412: "syringe", 413: "teddy bear", 414: "typewriter",
    470: "bookcase", 471: "desk", 472: "filing cabinet", 473: "lamp", 474: "monitor",
    475: "pillow", 476: "pool table", 477: "shelf", 478: "sofa", 479: "table",
    480: "television", 481: "toilet", 482: "wardrobe",
    500: "bicycle", 501: "car", 502: "ambulance", 503: "bus", 504: "cab", 505: "jeep",
    506: "minivan", 507: "pickup", 508: "sports car", 509: "trailer truck",
    723: "projector", 724: "screen", 725: "camera", 726: "microphone", 727: "loudspeaker",
    728: "radio", 729: "television", 730: "video player",
    751: "person", 752: "face", 753: "child", 754: "adult",
    805: "sports", 806: "ball", 807: "racket", 808: "skateboard", 809: "surfboard",
    812: "gym", 813: "stadium", 814: "court", 815: "field",
}
# Fallback: use index if not in dict
def _label(i: int) -> str:
    return IMAGENET_LABELS.get(i, f"class_{i}")


def _download_video_segment(video_id: str, out_dir: Path, max_duration_sec: int) -> Path:
    """Download video to out_dir; return path to video file."""
    try:
        import yt_dlp
    except ImportError as e:
        raise ValueError("Install yt-dlp: pip install yt-dlp") from e
    url = f"https://www.youtube.com/watch?v={video_id}"
    out_dir.mkdir(parents=True, exist_ok=True)
    opts = {
        "outtmpl": str(out_dir / "%(id)s.%(ext)s"),
        "format": "best[height<=360][ext=mp4]/best[height<=360]/best",
        "quiet": True,
        "no_warnings": True,
    }
    if max_duration_sec > 0:
        opts["postprocessor_args"] = {"ffmpeg": ["-t", str(max_duration_sec)]}
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])
    for ext in (".mp4", ".webm", ".mkv"):
        p = out_dir / f"{video_id}{ext}"
        if p.exists():
            return p
    for f in out_dir.iterdir():
        if f.suffix in (".mp4", ".webm", ".mkv"):
            return f
    raise ValueError("Download produced no video file; install ffmpeg")


def _extract_frames(video_path: Path, fps_sample: float = 1.0, max_frames: int = 30):
    """Yield (frame_index, BGR numpy array) at fps_sample fps."""
    import cv2
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise ValueError("Could not open video")
    video_fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    interval = max(1, int(video_fps / fps_sample))
    idx = 0
    count = 0
    while count < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
        if idx % interval == 0:
            yield count, frame
            count += 1
        idx += 1
    cap.release()


def _frame_to_tensor(frame, device="cpu"):
    """BGR OpenCV frame -> (1,3,224,224) normalized for ImageNet."""
    import cv2
    import torch
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (224, 224))
    # ImageNet norm
    mean = torch.tensor([0.485, 0.456, 0.406], device=device).view(1, 3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225], device=device).view(1, 3, 1, 1)
    t = torch.from_numpy(resized).float().to(device).permute(2, 0, 1).unsqueeze(0) / 255.0
    t = (t - mean) / std
    return t


def analyze_content(
    video_id: str,
    max_duration_sec: int = 45,
    fps_sample: float = 1.0,
    max_frames: int = 30,
    device: str = "cpu",
) -> dict[str, Any]:
    """
    Download video, extract frames, run vision model for temporal and semantic analysis.
    Returns:
      - temporal: frame_errors (list of frame-to-frame change norms), mean_error, high_error_indices (likely cuts).
      - semantic: keyframe_labels (list of {frame_idx, top_classes}), aggregated_top_classes.
    """
    import torch
    tmp = Path(tempfile.mkdtemp(prefix="jepa_content_"))
    try:
        video_path = _download_video_segment(video_id, tmp, max_duration_sec)
        dev = torch.device(device)
        from torchvision.models import resnet18, ResNet18_Weights
        _model = resnet18(weights=ResNet18_Weights.IMAGENET1K_V1).to(dev).eval()
        def _feat(x):
            x = _model.conv1(x)
            x = _model.bn1(x)
            x = _model.relu(x)
            x = _model.maxpool(x)
            x = _model.layer1(x)
            x = _model.layer2(x)
            x = _model.layer3(x)
            x = _model.layer4(x)
            x = _model.avgpool(x)
            return x.flatten(1)
        def _logits(x):
            return _model.fc(_feat(x))

        frames_list = list(_extract_frames(video_path, fps_sample=fps_sample, max_frames=max_frames))
        if len(frames_list) < 2:
            return {
                "video_id": video_id,
                "temporal": {"frame_errors": [], "mean_error": 0.0, "high_error_frame_indices": [], "summary": "Too few frames."},
                "semantic": {"keyframe_labels": [], "aggregated_top": [], "summary": "Too few frames."},
            }

        # Extract features (512-d) per frame
        features = []
        keyframe_logits = []
        keyframe_indices = [0, len(frames_list) // 2, len(frames_list) - 1] if len(frames_list) >= 3 else [0]
        for i, (idx, frame) in enumerate(frames_list):
            t = _frame_to_tensor(frame, device=dev)
            with torch.no_grad():
                feat = _feat(t)
                features.append(feat.cpu())
                if i in keyframe_indices:
                    logits = _logits(t)
                    keyframe_logits.append((i, logits.cpu()))

        # Temporal: frame-to-frame difference (prediction error with identity predictor)
        feats = torch.cat(features, dim=0)
        diff = feats[1:] - feats[:-1]
        frame_errors = diff.norm(dim=1).tolist()
        mean_error = sum(frame_errors) / len(frame_errors) if frame_errors else 0.0
        threshold = mean_error + 1.5 * (sum((e - mean_error) ** 2 for e in frame_errors) / len(frame_errors)) ** 0.5 if len(frame_errors) > 1 else mean_error
        high_error_indices = [i + 1 for i, e in enumerate(frame_errors) if e >= threshold]

        # Semantic: top-5 classes per keyframe
        keyframe_labels = []
        all_top = []
        for idx, logits in keyframe_logits:
            probs = torch.softmax(logits[0], dim=0)
            top5 = torch.topk(probs, 5)
            classes = [{"class_id": int(top5.indices[i].item()), "label": _label(int(top5.indices[i].item())), "prob": round(float(top5.values[i].item()), 3)} for i in range(5)]
            keyframe_labels.append({"frame_index": idx, "top_classes": classes})
            all_top.extend([int(top5.indices[i].item()) for i in range(5)])
        from collections import Counter
        agg = Counter(all_top)
        aggregated_top = [{"class_id": cid, "label": _label(cid), "count": cnt} for cid, cnt in agg.most_common(10)]

        temporal_summary = f"Mean frame-to-frame change: {mean_error:.2f}. {len(high_error_indices)} likely scene/cut(s) at frame indices: {high_error_indices[:10]}{'…' if len(high_error_indices) > 10 else ''}."
        semantic_summary = "Keyframe labels: " + "; ".join(_label(c["class_id"]) for c in (keyframe_labels[0]["top_classes"][:3] if keyframe_labels else [])) + ". Aggregated: " + ", ".join(a["label"] for a in aggregated_top[:5])

        return {
            "video_id": video_id,
            "num_frames": len(frames_list),
            "temporal": {
                "frame_errors": [round(e, 4) for e in frame_errors],
                "mean_error": round(mean_error, 4),
                "high_error_frame_indices": high_error_indices,
                "summary": temporal_summary,
            },
            "semantic": {
                "keyframe_labels": keyframe_labels,
                "aggregated_top": aggregated_top,
                "summary": semantic_summary,
            },
        }
    finally:
        import shutil
        shutil.rmtree(tmp, ignore_errors=True)
