"""
World model: latent dynamics and rollouts (VJEPA-style).
Supports prediction, counterfactuals, and planning.
"""
from __future__ import annotations

import torch
import torch.nn as nn
from typing import Optional, Tuple

from .config import AGIJEPAConfig


class WorldModel(nn.Module):
    """
    Latent dynamics model: next latent = f(latent, action).
    Used for rollouts in value-guided planning.
    """

    def __init__(self, config: AGIJEPAConfig):
        super().__init__()
        self.config = config
        self.action_embed = nn.Linear(config.action_dim, config.action_embed_dim)
        inp = config.latent_dim + config.action_embed_dim
        self.transition = nn.Sequential(
            nn.Linear(inp, config.hidden_dim),
            nn.LayerNorm(config.hidden_dim),
            nn.GELU(),
            nn.Linear(config.hidden_dim, config.hidden_dim),
            nn.LayerNorm(config.hidden_dim),
            nn.GELU(),
            nn.Linear(config.hidden_dim, config.latent_dim),
        )

    def forward(
        self,
        latent: torch.Tensor,
        action: torch.Tensor,
    ) -> torch.Tensor:
        """Single-step transition: latent, action -> next_latent."""
        a = self.action_embed(action)
        return self.transition(torch.cat([latent, a], dim=-1))

    def rollout(
        self,
        initial_latent: torch.Tensor,
        actions: torch.Tensor,
        horizon: Optional[int] = None,
    ) -> torch.Tensor:
        """
        Roll out latent trajectory given initial state and action sequence.
        Args:
            initial_latent: (B, latent_dim)
            actions: (B, H, action_dim)
        Returns:
            latents: (B, H+1, latent_dim)
        """
        H = actions.size(1)
        if horizon is not None:
            H = min(H, horizon)
        latents = [initial_latent]
        z = initial_latent
        for t in range(H):
            z = self.forward(z, actions[:, t])
            latents.append(z)
        return torch.stack(latents, dim=1)
