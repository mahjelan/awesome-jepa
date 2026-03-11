"""
Planner: value-guided action selection using world-model rollouts.
Aligns with "Value-guided action planning with JEPA world models" and Drive-JEPA / EgoAgent.
"""
from __future__ import annotations

import torch
import torch.nn as nn
from typing import Optional

from .config import AGIJEPAConfig
from .world_model import WorldModel


class Planner(nn.Module):
    """
    Plans action sequences by rolling out the world model and scoring with a value head.
    """

    def __init__(self, config: AGIJEPAConfig, world_model: Optional[WorldModel] = None):
        super().__init__()
        self.config = config
        self.world_model = world_model or WorldModel(config)
        self.value_head = nn.Sequential(
            nn.Linear(config.latent_dim, config.value_hidden_dim),
            nn.ReLU(),
            nn.Linear(config.value_hidden_dim, 1),
        )

    def value(self, latent: torch.Tensor) -> torch.Tensor:
        """Scalar value V(latent)."""
        return self.value_head(latent).squeeze(-1)

    def plan(
        self,
        initial_latent: torch.Tensor,
        goal: Optional[torch.Tensor] = None,
        horizon: Optional[int] = None,
        num_candidates: int = 32,
    ) -> torch.Tensor:
        """
        Simple planning: sample random action sequences, roll out, return best.
        Can be replaced by CEM, MCTS, or learned policy.
        Args:
            initial_latent: (B, latent_dim)
            goal: optional (B, latent_dim) for goal-conditioned value
            horizon: plan horizon (default config.plan_horizon)
            num_candidates: number of action sequences to try
        Returns:
            actions: (B, horizon, action_dim) best action sequence per batch item
        """
        H = horizon or self.config.plan_horizon
        B = initial_latent.size(0)
        device = initial_latent.device
        best_actions = torch.zeros(B, H, self.config.action_dim, device=device)
        best_values = torch.full((B,), -1e9, device=device)

        for _ in range(num_candidates):
            actions = torch.randn(B, H, self.config.action_dim, device=device) * 0.5
            latents = self.world_model.rollout(initial_latent, actions, horizon=H)
            final_latents = latents[:, -1]
            values = self.value(final_latents)
            if goal is not None:
                values = values - torch.norm(final_latents - goal, dim=-1)
            improved = values > best_values
            best_values = torch.where(improved, values, best_values)
            best_actions = torch.where(improved.unsqueeze(1).unsqueeze(2), actions, best_actions)

        return best_actions
