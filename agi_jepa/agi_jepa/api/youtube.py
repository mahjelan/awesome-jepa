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


def _handle_http_error(e: urllib.error.HTTPError) -> None:
    """Turn 403/400 from YouTube API into a clear ValueError for the user."""
    import json
    body = ""
    if e.fp:
        try:
            body = e.fp.read().decode()
        except Exception:
            pass
    msg = body
    try:
        data = json.loads(body) if body else {}
        err = data.get("error", {})
        msg = err.get("message", msg)
        reasons = [x.get("reason", "") for x in err.get("errors", [])]
        if "accessNotConfigured" in reasons or "accessNotConfigured" in msg.lower():
            raise ValueError(
                "YouTube Data API v3 is not enabled. Go to Google Cloud Console → APIs & Services → Library → search 'YouTube Data API v3' → Enable."
            ) from e
        if "quotaExceeded" in reasons or "quota" in msg.lower():
            raise ValueError("YouTube API quota exceeded. Try again tomorrow or use a different project.") from e
        if "keyInvalid" in reasons or "invalid" in msg.lower() and "key" in msg.lower():
            raise ValueError("Invalid YouTube API key. Check Credentials in Google Cloud Console.") from e
        if "forbidden" in msg.lower() or e.code == 403:
            hint = "Enable YouTube Data API v3 and ensure the API key has no restrictions that block server use."
            raise ValueError(f"YouTube API 403 Forbidden: {msg}. {hint}") from e
    except ValueError:
        raise
    raise ValueError(f"YouTube API error: {e.code} {e.reason}. {msg}") from e


def _get(url: str) -> dict[str, Any]:
    import json
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        if e.code in (400, 403):
            _handle_http_error(e)
        raise ValueError(f"YouTube API HTTP {e.code}: {e.reason}") from e


def search(query: str, max_results: int = 20, region_code: Optional[str] = None) -> dict[str, Any]:
    """YouTube search – same pattern as Algorythm YouTubeAPIComponent searchVideos."""
    key = _get_api_key()
    q = urllib.parse.quote(query)
    url = f"{BASE}/search?part=snippet&q={q}&maxResults={min(max_results, 50)}&type=video&order=viewCount&key={key}"
    if region_code:
        url += f"&regionCode={region_code}"
    data = _get(url)
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
    data = _get(url)
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
