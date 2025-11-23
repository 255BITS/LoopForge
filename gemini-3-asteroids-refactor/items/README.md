# Items Module

This directory contains collectible items.
It uses a polymorphic design to separate visuals and effect logic.

## Architecture
*   **BaseItem**: Common logic for physics (magnetism) and rendering helpers.
*   **types/**: Specific item implementations (Experience, Health, etc).
*   **Factory**: Central registration for item creation.

## Classes
*   **Experience**: Grants XP.
*   **Health**: Restores HP.
*   **Magnet**: Pulls all gems to player.
*   **Nuke**: Destroys all enemies on screen.
*   **Freeze**: Stops time for enemies.
