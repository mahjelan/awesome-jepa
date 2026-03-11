#!/usr/bin/env python3
"""
Start the AGI-JEPA FastAPI backend.
Run from repo root:  python agi_jepa/run_api.py
Or from agi_jepa (outer):  python run_api.py
Must run with cwd = outer agi_jepa so that agi_jepa.api.main is importable.
"""
import os
import sys
import subprocess

def main():
    outer = os.path.dirname(os.path.abspath(__file__))
    port = int(os.environ.get("AGI_JEPA_PORT", "8000"))
    result = subprocess.run(
        [sys.executable, "-m", "uvicorn", "agi_jepa.api.main:app", "--reload", "--port", str(port)],
        cwd=outer,
    )
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
