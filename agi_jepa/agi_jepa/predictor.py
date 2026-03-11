"""
Predictor: JEPA-style prediction of future/alternate latents from context latents.
No pixel or token reconstruction — representation-level prediction only.
"""
from __future__ import annotations

import torch
import torch.nn as nn
from typing import Optional

from .config import AGIJEPAConfig


class Predictor(nn.Module):
    """
    Predicts target latents from context latents (core JEPA objective).
    Can be extended to hierarchical (H-JEPA) or sequential (seq-JEPA).
    """

    def __init__(self, config: AGIJEPAConfig):
        super().__init__()
        self.config = config
        self.net = nn.Sequential(
            nn.Linear(config.latent_dim, config.hidden_dim),
            nn.LayerNorm(config.hidden_dim),
            nn.GELU(),
            nn.Linear(config.hidden_dim, config.hidden_dim),
            nn.LayerNorm(config.hidden_dim),
            nn.GELU(),
            nn.Linear(config.hidden_dim, config.latent_dim),
        )

    def forward(
        self,
        context_latents: torch.Tensor,
        target_latents: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        """
        Args:
            context_latents: (B, latent_dim) or (B, T, latent_dim)
            target_latents: optional, for training loss (e.g. variance-invariance)
        Returns:
            predicted_latents: same shape as context_latents
        """
        return self.net(context_latents)
