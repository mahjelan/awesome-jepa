"""
Minimal training loop for JEPA objective: encoder + predictor.
Loss = prediction loss (e.g. MSE or variance-invariance) on latent space.
"""
from __future__ import annotations

import argparse
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

from .config import AGIJEPAConfig
from .encoder import Encoder
from .predictor import Predictor


def jepa_loss(
    context_latents: torch.Tensor,
    target_latents: torch.Tensor,
    predicted_latents: torch.Tensor,
) -> torch.Tensor:
    """Simple MSE between predicted and target latents (JEPA-style)."""
    return nn.functional.mse_loss(predicted_latents, target_latents)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--steps", type=int, default=1000)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--device", type=str, default="cpu")
    args = parser.parse_args()

    config = AGIJEPAConfig(
        batch_size=args.batch_size,
        learning_rate=args.lr,
        device=args.device,
    )
    device = torch.device(args.device)

    encoder = Encoder(config).to(device)
    predictor = Predictor(config).to(device)
    opt = torch.optim.Adam(
        list(encoder.parameters()) + list(predictor.parameters()),
        lr=config.learning_rate,
    )

    # Dummy data: (context_obs, target_obs) -> train predictor to match target latents
    B, dim = args.batch_size, config.obs_dim * config.obs_channels * config.seq_len
    context_obs = torch.randn(B, dim, device=device)
    target_obs = torch.randn(B, dim, device=device)
    dataset = TensorDataset(context_obs.repeat(100, 1), target_obs.repeat(100, 1))
    loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=True)

    for step, (ctx, tgt) in enumerate(loader):
        if step >= args.steps:
            break
        ctx, tgt = ctx.to(device), tgt.to(device)
        ctx_latent = encoder(ctx)
        tgt_latent = encoder(tgt).detach()  # target encoder (stop grad)
        pred_latent = predictor(ctx_latent)
        loss = jepa_loss(ctx_latent, tgt_latent, pred_latent)
        opt.zero_grad()
        loss.backward()
        opt.step()
        if step % 100 == 0:
            print(f"step {step} loss {loss.item():.4f}")


if __name__ == "__main__":
    main()
