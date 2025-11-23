# Enemies Module

This directory contains the logic for enemy generation and behavior loops.

## Architecture

*   **`BaseEnemy.js`**: The primary class definition. It handles:
    *   Rendering (Vectors/Shapes)
    *   Common Physics (Movement, Separation)
*   **`types/` Directory**: Contains specialized behaviors.
    *   `Shooter.js`, `Summoner.js`, `Boss.js`, `Kamikaze.js` override the `behavior()` method of the base class.
*   **`Factory.js`**: Handles the procedural generation. A central place to tweak difficulty scaling, stats, and spawn rates for new enemy types.

## Usage

Include the Factory in the main loop to spawn entities.
Pass the Global Game Context (Player, Bullets array, Canvas dimensions) to the `update` function to allow enemies to interact with the world.
