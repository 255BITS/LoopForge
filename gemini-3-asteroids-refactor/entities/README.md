# Entities Module

Calculations and rendering for dynamic game objects.

## Classes

*   **Player**: The main hero class. Handles:
    *   Input processing (Movement, Aiming)
    *   Weapon systems (Shooting, Skills like Nova/Railgun)
    *   Rendering the ship and attachments (Orbitals, Saws).
*   **Bullet**: Projectile logic.
    *   Handles trajectory for straight shots, homing missiles, and boomerangs.
    *   Richochet physics.

## Usage

Entities expect a `context` object passed to their `update()` method containing reference to the game world (enemies list, canvas bounds, etc) to avoid global state dependencies.
