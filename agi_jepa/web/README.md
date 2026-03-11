# AGI-JEPA Web UI

React + Vite frontend for the AGI-JEPA FastAPI backend.

## Run

1. Start the backend from the **outer** `agi_jepa` folder (so the package is on path):
   ```bash
   cd path/to/awesome-jepa/agi_jepa
   pip install -e . fastapi "uvicorn[standard]"
   python -m uvicorn agi_jepa.api.main:app --reload --port 8000
   ```
   Or from repo root: `python agi_jepa/run_api.py`

2. From this folder (`agi_jepa/web`):
   ```bash
   npm install
   npm run dev
   ```

3. Open http://localhost:5173

The dev server proxies `/api` to the backend on port 8000.
