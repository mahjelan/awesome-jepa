"""
FastAPI backend for AGI-JEPA: config, train, encode, predict, plan.
Run from outer agi_jepa folder: python -m uvicorn agi_jepa.api.main:app --reload --port 8000
Or from repo root: python agi_jepa/run_api.py
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Lazy import agi_jepa so server starts even if torch fails
_models: dict[str, Any] = {}


def _get_models():
    """Lazy-load models once."""
    if _models:
        return _models
    try:
        import torch
        from agi_jepa import Encoder, Predictor, WorldModel, Planner
        from agi_jepa.config import AGIJEPAConfig
        config = AGIJEPAConfig(device="cpu")
        _models["config"] = config
        _models["encoder"] = Encoder(config)
        _models["predictor"] = Predictor(config)
        _models["world_model"] = WorldModel(config)
        _models["planner"] = Planner(config)
        _models["device"] = torch.device("cpu")
        return _models
    except Exception as e:
        raise RuntimeError(f"Failed to load agi_jepa: {e}") from e


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        _get_models()
    except Exception:
        pass
    yield
    _models.clear()


app = FastAPI(title="AGI-JEPA API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schemas ---

class ConfigResponse(BaseModel):
    latent_dim: int
    hidden_dim: int
    learning_rate: float
    batch_size: int
    plan_horizon: int
    obs_dim: int
    action_dim: int


class TrainRequest(BaseModel):
    steps: int = Field(100, ge=1, le=10000)
    batch_size: int = Field(32, ge=1, le=256)
    lr: float = Field(1e-4, gt=0, le=1.0)


class TrainYoutubeRequest(BaseModel):
    """Train JEPA on consecutive YouTube video pairs (context = video i, target = video i+1)."""
    query: Optional[str] = None  # search query; if None and not use_trending, defaults to "trending"
    use_trending: bool = Field(False, description="Use trending API instead of search")
    steps: int = Field(50, ge=1, le=500)
    batch_size: int = Field(8, ge=1, le=32)
    lr: float = Field(1e-4, gt=0, le=1.0)
    region_code: str = "US"
    max_videos: int = Field(50, ge=5, le=50, description="Max videos to fetch for training pairs")


class TrainResponse(BaseModel):
    steps: int
    final_loss: float
    loss_history: list[float]


class EncodeRequest(BaseModel):
    obs: list[list[float]]  # (batch, obs_dim * obs_channels * seq_len)


class EncodeResponse(BaseModel):
    latents: list[list[float]]  # (batch, latent_dim)


class PlanRequest(BaseModel):
    latent: Optional[list[float]] = None  # single latent; if None, use random
    horizon: int = Field(5, ge=1, le=20)
    num_candidates: int = Field(32, ge=1, le=256)


class PlanResponse(BaseModel):
    actions: list[list[list[float]]]  # (1, horizon, action_dim)


# --- YouTube (Algorythm-style) ---

class YoutubeVideoItem(BaseModel):
    id: str
    title: str
    description: str = ""
    channelTitle: str = ""
    publishedAt: str = ""
    thumbnails: dict = {}


class YoutubeEncodeRequest(BaseModel):
    videos: list[YoutubeVideoItem]


# --- Endpoints ---

@app.get("/")
def root():
    return {
        "message": "AGI-JEPA API. Use the React UI at http://localhost:5173",
        "docs": "http://localhost:8000/docs",
        "health": "http://localhost:8000/api/health",
    }


@app.get("/api")
def api_root():
    return {
        "message": "AGI-JEPA API",
        "endpoints": ["/api/health", "/api/config", "/api/train", "/api/train/youtube", "/api/plan", "/api/youtube/search", "/api/youtube/trending", "/api/youtube/encode"],
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "backend": "agi_jepa"}


@app.get("/api/config", response_model=ConfigResponse)
def get_config():
    m = _get_models()
    c = m["config"]
    return ConfigResponse(
        latent_dim=c.latent_dim,
        hidden_dim=c.hidden_dim,
        learning_rate=c.learning_rate,
        batch_size=c.batch_size,
        plan_horizon=c.plan_horizon,
        obs_dim=c.obs_dim,
        action_dim=c.action_dim,
    )


@app.post("/api/train", response_model=TrainResponse)
def train(req: TrainRequest):
    import torch
    from torch.utils.data import TensorDataset, DataLoader
    from agi_jepa import Encoder, Predictor
    from agi_jepa.config import AGIJEPAConfig
    from agi_jepa.train import jepa_loss

    config = AGIJEPAConfig(
        batch_size=req.batch_size,
        learning_rate=req.lr,
        device="cpu",
    )
    device = torch.device("cpu")
    encoder = Encoder(config).to(device)
    predictor = Predictor(config).to(device)
    opt = torch.optim.Adam(
        list(encoder.parameters()) + list(predictor.parameters()),
        lr=config.learning_rate,
    )
    dim = config.obs_dim * config.obs_channels * config.seq_len
    B = req.batch_size
    context_obs = torch.randn(B, dim, device=device)
    target_obs = torch.randn(B, dim, device=device)
    dataset = TensorDataset(
        context_obs.repeat(max(1, (req.steps * B) // B), 1),
        target_obs.repeat(max(1, (req.steps * B) // B), 1),
    )
    loader = DataLoader(dataset, batch_size=B, shuffle=True)
    loss_history: list[float] = []
    final_loss = 0.0
    for step, (ctx, tgt) in enumerate(loader):
        if step >= req.steps:
            break
        ctx, tgt = ctx.to(device), tgt.to(device)
        ctx_latent = encoder(ctx)
        tgt_latent = encoder(tgt).detach()
        pred_latent = predictor(ctx_latent)
        loss = jepa_loss(ctx_latent, tgt_latent, pred_latent)
        opt.zero_grad()
        loss.backward()
        opt.step()
        loss_history.append(float(loss.item()))
        final_loss = float(loss.item())
    return TrainResponse(steps=len(loss_history), final_loss=final_loss, loss_history=loss_history)


@app.post("/api/train/youtube", response_model=TrainResponse)
def train_youtube(req: TrainYoutubeRequest):
    """
    Train JEPA on YouTube videos: fetch search or trending, form consecutive (context, target)
    pairs, and run the same JEPA loss (predict target latent from context latent).
    """
    import torch
    from torch.utils.data import TensorDataset, DataLoader
    from agi_jepa import Encoder, Predictor
    from agi_jepa.config import AGIJEPAConfig
    from agi_jepa.train import jepa_loss
    from .youtube import search, trending, video_metadata_to_obs_vector

    # Fetch videos from YouTube API
    try:
        if req.use_trending:
            data = trending(region_code=req.region_code, max_results=req.max_videos)
        else:
            data = search(
                query=req.query or "trending reels shorts",
                max_results=req.max_videos,
                region_code=req.region_code,
            )
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(502, f"YouTube API error: {e}")

    items = data.get("items") or []
    if len(items) < 2:
        raise HTTPException(400, "Need at least 2 videos to form training pairs; got " + str(len(items)))

    config = AGIJEPAConfig(
        batch_size=req.batch_size,
        learning_rate=req.lr,
        device="cpu",
    )
    obs_size = config.obs_dim * config.obs_channels * config.seq_len

    # Convert each video to observation vector
    obs_list = []
    for it in items:
        text = f"{it.get('title', '')}\n{it.get('description', '')}"
        obs_list.append(video_metadata_to_obs_vector(text, obs_size))

    # Pairs (context, target) = (obs[i], obs[i+1]) for JEPA: predict next video's latent
    context_obs = torch.tensor(obs_list[:-1], dtype=torch.float32)
    target_obs = torch.tensor(obs_list[1:], dtype=torch.float32)
    n_pairs = context_obs.size(0)
    device = torch.device("cpu")

    encoder = Encoder(config).to(device)
    predictor = Predictor(config).to(device)
    opt = torch.optim.Adam(
        list(encoder.parameters()) + list(predictor.parameters()),
        lr=config.learning_rate,
    )

    dataset = TensorDataset(context_obs, target_obs)
    loader = DataLoader(dataset, batch_size=min(req.batch_size, n_pairs), shuffle=True)
    loss_history: list[float] = []
    final_loss = 0.0
    step = 0
    while step < req.steps:
        for ctx, tgt in loader:
            if step >= req.steps:
                break
            ctx, tgt = ctx.to(device), tgt.to(device)
            ctx_latent = encoder(ctx)
            tgt_latent = encoder(tgt).detach()
            pred_latent = predictor(ctx_latent)
            loss = jepa_loss(ctx_latent, tgt_latent, pred_latent)
            opt.zero_grad()
            loss.backward()
            opt.step()
            loss_history.append(float(loss.item()))
            final_loss = float(loss.item())
            step += 1
        if step < req.steps and n_pairs < req.steps:
            # Repeat epoch if we have fewer pairs than steps
            loader = DataLoader(dataset, batch_size=min(req.batch_size, n_pairs), shuffle=True)

    return TrainResponse(
        steps=len(loss_history),
        final_loss=final_loss,
        loss_history=loss_history,
    )


@app.post("/api/encode", response_model=EncodeResponse)
def encode(req: EncodeRequest):
    import torch
    m = _get_models()
    encoder = m["encoder"]
    config = m["config"]
    device = m["device"]
    obs_dim = config.obs_dim * config.obs_channels * config.seq_len
    if not req.obs or not req.obs[0]:
        raise HTTPException(400, "obs must be non-empty")
    if len(req.obs[0]) != obs_dim:
        raise HTTPException(
            400,
            f"Expected obs dimension {obs_dim}, got {len(req.obs[0])}. Adjust obs_dim/obs_channels/seq_len in config.",
        )
    t = torch.tensor(req.obs, dtype=torch.float32, device=device)
    with torch.no_grad():
        z = encoder(t)
    return EncodeResponse(latents=z.cpu().tolist())


@app.post("/api/plan", response_model=PlanResponse)
def plan(req: PlanRequest):
    import torch
    m = _get_models()
    planner = m["planner"]
    config = m["config"]
    device = m["device"]
    if req.latent is not None:
        if len(req.latent) != config.latent_dim:
            raise HTTPException(400, f"latent must have length {config.latent_dim}")
        z = torch.tensor([req.latent], dtype=torch.float32, device=device)
    else:
        z = torch.randn(1, config.latent_dim, device=device)
    with torch.no_grad():
        actions = planner.plan(z, horizon=req.horizon, num_candidates=req.num_candidates)
    return PlanResponse(actions=actions.cpu().tolist())


# --- YouTube (Algorythm integration) ---

@app.get("/api/youtube/search")
def youtube_search(q: str = "", max_results: int = 20, region_code: Optional[str] = None):
    """Search YouTube (same API pattern as aixApp/algorythm). Requires YOUTUBE_API_KEY."""
    try:
        from .youtube import search
        return search(q or "trending reels shorts", max_results=max_results, region_code=region_code)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(502, f"YouTube API error: {e}")


@app.get("/api/youtube/trending")
def youtube_trending(region_code: str = "US", max_results: int = 20):
    """Trending videos (mostPopular, category 24 = Entertainment). Requires YOUTUBE_API_KEY."""
    try:
        from .youtube import trending
        return trending(region_code=region_code, max_results=max_results)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(502, f"YouTube API error: {e}")


@app.post("/api/youtube/encode", response_model=EncodeResponse)
def youtube_encode(req: YoutubeEncodeRequest):
    """
    Convert YouTube video metadata (title, description) to observation vectors and run JEPA encoder.
    Video is represented by a deterministic embedding of its text for use in the AGI stack.
    """
    import torch
    from .youtube import video_metadata_to_obs_vector

    m = _get_models()
    encoder = m["encoder"]
    config = m["config"]
    device = m["device"]
    obs_size = config.obs_dim * config.obs_channels * config.seq_len

    if not req.videos:
        raise HTTPException(400, "videos list is empty")

    obs_list = []
    for v in req.videos:
        text = f"{v.title}\n{v.description}"
        obs_list.append(video_metadata_to_obs_vector(text, obs_size))

    t = torch.tensor(obs_list, dtype=torch.float32, device=device)
    with torch.no_grad():
        z = encoder(t)
    return EncodeResponse(latents=z.cpu().tolist())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
