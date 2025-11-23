# Effects Module

This directory contains visual effect classes that do not interact with the game physics directly (mostly).

## Classes

*   **Particle**: Simple fading circles for explosions and trails.
*   **FloatingText**: Damage numbers and labels that float up and fade.
*   **LightningBolt**: Temporary line segment for Tesla/Thunder effects.
*   **Vortex**: Area of effect visual that pulls enemies (Logic requires 'enemies' list injection).
*   **RailBeam**: Visual beam for the Railgun ability.
*   **StarField**: Parallax background stars management.

## Usage
Import these classes into the main game loop primarily for rendering `draw()` and simple `update()` lifecycles.
