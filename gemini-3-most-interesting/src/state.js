import { Grid } from './grid.js';
import { GRID_W, GRID_H } from './config.js';

export const state = {
    grid: new Grid(GRID_W, GRID_H),
    player: { x: 22, y: 15, buildType: null, rotation: 1, cursorX: 0, cursorY: 0, pixelX: 0, pixelY: 0, lastMine: 0, dashEnergy: 100, moveTarget: null },
    input: { mouseDown: false, mouseBtn: -1 },
    structures: [],
    enemies: [],
    effects: [],
    nexus: null,
    currency: 400, 
    stats: { miningMult: 1.0, damageMult: 1.0, beltSpeedMult: 1.0, globalSpeedMult: 1.0 },
    score: 0,
    waveCooldown: 0,
    pollution: 0, spawnQueue: 0, cameraShake: 0,
    framenum: 0, gameOver: false
};
