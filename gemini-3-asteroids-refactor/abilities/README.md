# Abilities Module

Modular ability system that handles active skills and routines attached to the Player.

## Architecture
* **BaseAbility**: Abstract interface.
* **types/**: Individual implementations for skills (Nova, Railgun, etc).
* **Factory**: Central registration for string-based instantiation (used by Upgrade menu).

## Usage
* **Player**: Maintains a list of active abilities.
* **Context**: Passed to `update()` to allow abilities to query enemies, spawn projectiles, or emit particles.
