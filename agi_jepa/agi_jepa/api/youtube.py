"""
YouTube Data API v3 integration for AGI-JEPA.
Mirrors the Algorythm app (aixApp/algorythm) search and trending endpoints.
Uses YOUTUBE_API_KEY env var. Video metadata is converted to observation vectors for the encoder.
"""
from __future__ import annotations

import hashlib
import os
import urllib.error
import urllib.request
from typing import Any, Optional

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
BASE = "https://www.googleapis.com/youtube/v3"


def _get_api_key() -> str:
    key = (os.environ.get("YOUTUBE_API_KEY") or "").strip()
    if not key:
        raise ValueError("YOUTUBE_API_KEY environment variable is not set")
    return key


def _get(url: str) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        import json
        return json.loads(resp.read().decode())


def search(query: str, max_results: int = 20, region_code: Optional[str] = None) -> dict[str, Any]:
    """YouTube search – same pattern as Algorythm YouTubeAPIComponent searchVideos."""
    key = _get_api_key()
    q = urllib.parse.quote(query)
    url = f"{BASE}/search?part=snippet&q={q}&maxResults={min(max_results, 50)}&type=video&order=viewCount&key={key}"
    if region_code:
        url += f"&regionCode={region_code}"
    try:
        data = _get(url)
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        if e.code == 403 and ("quota" in body.lower() or "quotaExceeded" in body):
            raise ValueError("YouTube API quota exceeded") from e
        raise
    items = []
    for it in (data.get("items") or []):
        vid = it.get("id", {}).get("videoId")
        sn = it.get("snippet") or {}
        if vid:
            items.append({
                "id": vid,
                "title": sn.get("title", ""),
                "description": sn.get("description", ""),
                "channelTitle": sn.get("channelTitle", ""),
                "publishedAt": sn.get("publishedAt", ""),
                "thumbnails": sn.get("thumbnails") or {},
            })
    return {"items": items, "nextPageToken": data.get("nextPageToken")}


def trending(region_code: str = "US", max_results: int = 20, video_category_id: str = "24") -> dict[str, Any]:
    """Trending / mostPopular – same pattern as Algorythm fetchTrendingVideos."""
    key = _get_api_key()
    url = f"{BASE}/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode={region_code}&maxResults={min(max_results, 50)}&videoCategoryId={video_category_id}&key={key}"
    try:
        data = _get(url)
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        if e.code == 403 and ("quota" in body.lower() or "quotaExceeded" in body):
            raise ValueError("YouTube API quota exceeded") from e
        raise
    items = []
    for it in (data.get("items") or []):
        vid = it.get("id")
        sn = it.get("snippet") or {}
        if vid:
            items.append({
                "id": vid,
                "title": sn.get("title", ""),
                "description": sn.get("description", ""),
                "channelTitle": sn.get("channelTitle", ""),
                "publishedAt": sn.get("publishedAt", ""),
                "thumbnails": sn.get("thumbnails") or {},
            })
    return {"items": items}


def video_metadata_to_obs_vector(text: str, obs_size: int) -> list[float]:
    """
    Convert video metadata (e.g. title + description) to a deterministic observation vector
    of length obs_size for the JEPA encoder. Same input always yields same vector.
    """
    h = hashlib.sha256(text.encode("utf-8", errors="replace")).digest()
    seed = int.from_bytes(h[:8], "big")
    # Deterministic pseudo-random floats in [-1, 1]
    out = []
    for i in range(obs_size):
        seed = (seed * 1103515245 + 12345) & 0x7FFF_FFFF
        out.append((seed / 0x7FFF_FFFF) * 2.0 - 1.0)
    return out
