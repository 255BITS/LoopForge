# Upgrades Module

Contains the data and logic for the Level Up system.

## Components
*   **UpgradePool.js**: A static collection of all possible power-ups.
    *   Pass `getChoices(n)` to generate `n` unique random options.
    *   Each update object contains an `apply(player)` Method to modify stats or inject abilities.

## Extensibility
To add a new item, simply append a new object to the `UPGRADES` array in `UpgradePool.js`.
