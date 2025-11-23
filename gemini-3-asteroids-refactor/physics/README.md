# Physics Module

This directory contains logic related to the physical interactions between entities in the game world.
It decouples the calculation of "Who hit who?" from the main Game Loop.

## Components

*   **CollisionSystem**: The engine that iterates over lists of entities (Bullets, Enemies, Beams) and determines overlaps.

## Responsibilities

1.  **Hit Detection**: Circle-Circle and Line-Circle intersection math.
2.  **Game Logic Triggers**:
    *   Applying damage to HP.
    *   Triggering particle explosions.
    *   Calculating Score/Combo and XP drops on enemy death.
    *   Applying power-up effects (Heal, Nuke, Freeze) when picking up gems.

## Usage

The `CollisionSystem` is stateless; it requires the full `GameContext` to be passed to its `update()` method every frame.
