#!/usr/bin/env python3
"""
Run JEPA training without installing the package.
Usage: from repo root:  python agi_jepa/run_train.py
       or from agi_jepa: python run_train.py
"""
import sys
from pathlib import Path

# Ensure agi_jepa package is on path when run as script
root = Path(__file__).resolve().parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

from agi_jepa.train import main

if __name__ == "__main__":
    main()
