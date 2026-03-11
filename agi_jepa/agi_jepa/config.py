"""
Configuration for the AGI-JEPA stack.
See AGI_MODEL_DESIGN.md for architecture overview.
"""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class AGIJEPAConfig:
    """Config for encoder, predictor, world model, and planner."""

    # Observation / input
    obs_dim: int = 256
    obs_channels: int = 3
    seq_len: int = 1

    # Latent space (JEPA embeddings)
    latent_dim: int = 512
    hidden_dim: int = 1024
    num_layers: int = 4

    # Action space (for world model & planner)
    action_dim: int = 4
    action_embed_dim: int = 64

    # World model rollout
    rollout_horizon: int = 10
    num_rollouts: int = 16

    # Planner
    plan_horizon: int = 5
    value_hidden_dim: int = 256

    # Training (optional)
    learning_rate: float = 1e-4
    batch_size: int = 32
    device: str = "cpu"

    def __post_init__(self) -> None:
        if self.device == "auto":
            try:
                import torch
                self.device = "cuda" if torch.cuda.is_available() else "cpu"
            except Exception:
                self.device = "cpu"
