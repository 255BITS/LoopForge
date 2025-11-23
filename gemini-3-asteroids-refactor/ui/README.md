# UI Module

This directory contains logic for the "Heads Up Display" and HTML overlays.
It abstracts direct DOM manipulation away from the core game logic.

## Class: GameUI

The central controller for visual elements layered on top of the canvas.

### Responsibilities
1.  **HUD Updates**: Syncing health bars, score counters, and ability meters (Overdrive) with game state.
2.  **Menus**: Toggling screens for Start, Game Over, and Upgrades.
3.  **Dynamic Generation**: Building HTML elements for upgrade choices procedurally.

### Usage
Instantiate once in `game.js`. Call `update*` methods within the game loop, and `show*` methods during state transitions.
Bind input events (like the Start Button) using callbacks.
