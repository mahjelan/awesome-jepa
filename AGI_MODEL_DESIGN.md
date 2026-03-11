# AGI-Oriented Model: Integration of Awesome-JEPA

This document describes how the **awesome-jepa** knowledge base (86+ papers on Joint Embedding Predictive Architectures and world models) is integrated into a single, extensible AGI-oriented architecture. The design unifies representation learning, world modeling, and planning into one coherent system.

## Design Principles

1. **Representation over reconstruction** — Predict abstract latent states, not pixels or tokens (core JEPA idea).
2. **Hierarchy** — Multiple levels of abstraction (H-JEPA, seq-JEPA) for long-horizon and composition.
3. **World model** — Latent dynamics for prediction, counterfactuals, and planning (VJEPA, value-guided planning).
4. **Multimodality** — Vision, language, and other modalities in a joint embedding space (VL-JEPA, CrossJEPA).
5. **Action and control** — World model + value function for decision-making (value-guided planning, Drive-JEPA, EgoAgent).

## Unified Architecture

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    AGI-JEPA Stack                        │
                    └─────────────────────────────────────────────────────────┘
                                              │
     ┌────────────────────────────────────────┼────────────────────────────────────────┐
     │                                        │                                        │
     ▼                                        ▼                                        ▼
┌─────────┐                            ┌───────────┐                            ┌───────────┐
│ Encoder │  (vision, language,        │ Predictor │  (latent dynamics,         │  Planner  │
│  stack  │   state, multi-modal)      │  (JEPA)   │   hierarchical)           │ (value +  │
└────┬────┘                            └─────┬─────┘                            │  actions) │
     │                                       │                                  └─────┬─────┘
     │    context + target                    │  predicted latents                     │
     └──────────────────────────────────────►│◄───────────────────────────────────────┘
                                             │
                                             ▼
                                    ┌────────────────┐
                                    │  World Model   │  (latent state space,
                                    │  (VJEPA-style) │   uncertainty, rollouts)
                                    └────────────────┘
```

### Components (mapped to awesome-jepa papers)

| Component   | Role | Key references from Papers |
|------------|------|-----------------------------|
| **Encoder** | Map observations (video, text, sensor) to latent embeddings | VL-JEPA, CrossJEPA, RadJEPA, WavJEPA, BERT-JEPA, Cell-JEPA |
| **Predictor** | Predict future / alternate latents from current latents (no pixel/token reconstruction) | Core JEPA, H-JEPA, LeJEPA, KerJEPA, DSeq-JEPA |
| **World model** | Probabilistic latent dynamics; supports rollouts and counterfactuals | VJEPA, seq-JEPA, "Value-guided action planning with JEPA world models", "Beyond Generative AI: World Models for Clinical Prediction" |
| **Planner** | Value-guided action selection using world model rollouts | Value-guided action planning, Drive-JEPA, EgoAgent, HanoiWorld |

## Integration with This Repo

- **Papers (86+)** in [README.md](README.md#papers-86) are the **specification**: each linked paper contributes ideas (architectures, objectives, domains) to the above stack.
- **Library / Tutorial / Theorem** sections in the README are the place to add links to implementations and formalizations of this design.
- The **`agi_jepa`** Python package in this repo provides a minimal, runnable implementation of this architecture so that:
  - Encoder, predictor, world model, and planner are separate modules.
  - Training and inference pipelines can be extended with ideas from any paper in the list without rewriting the core.

## Intended Use

- **Research**: Use this design as a roadmap to implement or ablate ideas from the awesome-jepa papers in one codebase.
- **Extension**: Add new modalities (e.g. RadJEPA, US-JEPA), new objectives (e.g. diffusion noise, auxiliary tasks), or new planning strategies by plugging into the same stack.
- **AGI narrative**: The stack is agnostic to domain (vision, language, driving, health, etc.) and emphasizes world models and planning, aligning with agentic and general intelligence goals.

## References

- Survey: *A Survey on Joint Embedding Predictive Architectures and World Models* (SSRN 5772122).
- All paper links: see [README.md](README.md) § Papers.
