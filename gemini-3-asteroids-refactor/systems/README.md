# Systems Module

Global systems that manage aspect-oriented features like Audio, Input, or Persistence.

## Modules

*   **Audio.js**: Wrapper for Web Audio API.
    *   `sfx`: Dictionary of procedural sound generation functions (Shoot, Explode, Powerup).
    *   `bgm`: Sequencer for the background loop. Uses `requestAnimationFrame` for timing.
*   **Input.js**: Centralized event listeners for Keyboard and Mouse. Tracks state for the game loop and dispatches semantic actions (Pause, Overdrive).
*   **Spawner.js**: Manages enemy wave timers, horde generation, and boss events.

## Usage

Import `audioCtx` to resume audio on first user interaction. Use `sfx.method()` to fire and forget sounds.
