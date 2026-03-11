"""
Encoder: maps observations (vision, language, state) to latent embeddings.
Extensible to multimodal (VL-JEPA, CrossJEPA, RadJEPA, WavJEPA, etc.).
"""
from __future__ import annotations

import torch
import torch.nn as nn
from typing import Optional

from .config import AGIJEPAConfig


class Encoder(nn.Module):
    """
    Encoder stack for observations -> latent embeddings.
    Default: MLP over flattened obs; override for vision/transformer backbones.
    """

    def __init__(self, config: AGIJEPAConfig):
        super().__init__()
        self.config = config
        inp = config.obs_dim * config.obs_channels * config.seq_len
        self.net = nn.Sequential(
            nn.Linear(inp, config.hidden_dim),
            nn.LayerNorm(config.hidden_dim),
            nn.GELU(),
            *[
                nn.Sequential(
                    nn.Linear(config.hidden_dim, config.hidden_dim),
                    nn.LayerNorm(config.hidden_dim),
                    nn.GELU(),
                )
                for _ in range(config.num_layers - 2)
            ],
            nn.Linear(config.hidden_dim, config.latent_dim),
        )

    def forward(
        self,
        obs: torch.Tensor,
        mask: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        """
        Args:
            obs: (B, [T,] ...) observations
            mask: optional (B, T) for variable-length sequences
        Returns:
            latents: (B, latent_dim) or (B, T, latent_dim)
        """
        if obs.dim() > 2:
            B, T = obs.shape[:2]
            obs = obs.reshape(B, T, -1)
            out = self.net(obs)
            if mask is not None:
                out = out * mask.unsqueeze(-1)
            return out
        x = obs.reshape(obs.size(0), -1)
        return self.net(x)
