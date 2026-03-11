# AGI-JEPA: Unified JEPA World Model Stack

Minimal, extensible implementation of an **AGI-oriented** stack that integrates ideas from the [awesome-jepa](https://github.com/gauravfs-14/awesome-jepa) paper list: Joint Embedding Predictive Architecture (JEPA), hierarchical prediction, probabilistic world models, and value-guided planning.

## Relation to awesome-jepa

This package is the **implementation scaffold** for the architecture described in the repo root’s [AGI_MODEL_DESIGN.md](../AGI_MODEL_DESIGN.md). The 86+ papers in the main README (JEPA, H-JEPA, VJEPA, VL-JEPA, value-guided planning, Drive-JEPA, etc.) are the specification; this code provides:

- **Encoder** — map observations to latent embeddings (extensible to vision, language, multimodal).
- **Predictor** — JEPA-style prediction in latent space (no pixel/token reconstruction).
- **World model** — latent dynamics and rollouts (VJEPA-style).
- **Planner** — value-guided action selection using world-model rollouts.

## Install and run

**Option A — Install the package (recommended)**

From the **awesome-jepa** repo root:

```bash
pip install -e agi_jepa
```

Then run training from anywhere:

```bash
python -m agi_jepa.train --steps 1000 --batch_size 32 --lr 1e-4
```

**Option B — Run without installing**

From the **awesome-jepa** repo root, install deps then run the script:

```bash
pip install torch numpy
python agi_jepa/run_train.py
```

Or from inside `agi_jepa`:

```bash
cd agi_jepa
pip install torch numpy
python run_train.py
```

## Usage

```python
from agi_jepa import Encoder, Predictor, WorldModel, Planner
from agi_jepa.config import AGIJEPAConfig

config = AGIJEPAConfig()
encoder = Encoder(config)
predictor = Predictor(config)
world_model = WorldModel(config)
planner = Planner(config)

# Encode context observations
context_latents = encoder(context_obs)

# Predict future latents (JEPA)
predicted_latents = predictor(context_latents, target_obs=None)

# World model rollout (e.g. for planning)
rollout_latents = world_model.rollout(context_latents, actions, horizon=10)

# Value-guided action sequence
actions = planner.plan(context_latents, goal=None, horizon=5)
```

## Training (after install)

```bash
python -m agi_jepa.train --steps 1000 --batch_size 32 --lr 1e-4
```

Arguments: `--steps`, `--batch_size`, `--lr`, `--device` (e.g. `cuda`).

## GUI (React + FastAPI)

A small web UI runs the backend (FastAPI) and frontend (React + Vite) together.

**1. Install backend** (from **awesome-jepa** repo root):

```bash
pip install -e agi_jepa
pip install fastapi "uvicorn[standard]"
```

**2. Start the API** — run from the **outer** `agi_jepa` folder so the package is found:

```bash
cd agi_jepa
python -m uvicorn agi_jepa.api.main:app --reload --port 8000
```

Or from repo root: `python agi_jepa/run_api.py`

**YouTube (search, trending, encode, train on videos):** Set `YOUTUBE_API_KEY` before starting the API.

- **Windows (PowerShell):**
  ```powershell
  cd agi_jepa
  $env:YOUTUBE_API_KEY = "your_api_key_here"
  python -m uvicorn agi_jepa.api.main:app --reload --port 8000
  ```
- **Windows (cmd):**
  ```cmd
  cd agi_jepa
  set YOUTUBE_API_KEY=your_api_key_here
  python -m uvicorn agi_jepa.api.main:app --reload --port 8000
  ```
- **Unix / Mac / Linux:**
  ```bash
  cd agi_jepa
  export YOUTUBE_API_KEY=your_api_key_here
  python -m uvicorn agi_jepa.api.main:app --reload --port 8000
  ```
- Or use a `.env` file: copy `agi_jepa/.env.example` to `agi_jepa/.env`, add your key, then load it (e.g. `pip install python-dotenv` and in code load dotenv before starting uvicorn, or use a tool that injects env from `.env`).

Get a key: [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → create API key → enable **YouTube Data API v3**.

**If you get "403 Forbidden":**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/library) → search **"YouTube Data API v3"** → open it → click **Enable** (for the same project as your API key).
2. If the key has **Application restrictions**, use "None" for testing, or add your server (e.g. "IP addresses" for the machine running the API).
3. Under **API restrictions**, either "Don't restrict key" or ensure **YouTube Data API v3** is in the allowed list.
4. Wait a minute after enabling the API, then try again.

**Download video with JEPA overlay:** After analyzing a video in the UI, use **"Download video with JEPA overlay"** to fetch the YouTube video (first 30 seconds), burn in the JEPA and pixel analysis on each frame, and save an MP4. This needs extra dependencies: `pip install yt-dlp opencv-python-headless` and **ffmpeg** on your PATH (for limiting clip duration). Downloading may be subject to YouTube’s terms of service; use for personal/educational use only.

**3. In another terminal, run the React app:**

```bash
cd agi_jepa/web
npm install
npm run dev
```

**4. Open** [http://localhost:5173](http://localhost:5173). The UI shows backend config, lets you run training (steps, batch size, LR), and run planning (horizon). API requests are proxied to the backend on port 8000.

**Troubleshooting:** If `uvicorn` is not found, use `python -m uvicorn` (as above). If the API fails to import `agi_jepa.api.main`, start the server from inside the outer `agi_jepa` directory (`cd agi_jepa` then run the `uvicorn` command).

See [AGI_MODEL_DESIGN.md](../AGI_MODEL_DESIGN.md) for the high-level design and mapping to papers in the awesome-jepa list.
