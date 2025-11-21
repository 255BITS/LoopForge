# Geo-Factorum

An automation-roguelike hybrid.

## Directory Structure

### Base
*   `index.html`: Application entry point.
*   `style.css`: Core visual styling.

### Source (`/src`)

**Core Systems:**
*   `main.js`: Game loop, initialization, and module aggregation.
*   `state.js`: Singleton Game State object (Player, Grid, Entities).
*   `config.js`: Global constants (Sizes, Colors, Tick rates).
*   `grid.js`: Data structures for the map (`Grid`, `Cell`).
*   `render.js`: Canvas API drawing logic.

**Systems:**
*   `input.js`: Event listeners for Mouse and Keyboard.
*   `ui.js`: DOM manipulation and Game Over logic.
*   `builder.js`: Logic for placing and removing structures.
*   `spawner.js`: Logic for enemy wave generation.

**Entities & Structures:**
*   `/src/entities/`: Dynamic actors (Enemies).
*   `/src/structures/`: Static buildings (Belts, Miners, Turrets).
