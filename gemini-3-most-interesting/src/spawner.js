import { state } from './state.js';
import { GRID_W, GRID_H } from './config.js';
import { Enemy } from './entities/enemy.js';

export function spawnEnemy(difficulty) {
    let ex, ey, safe = false, attempts = 0;
    while(!safe && attempts < 5) {
        if (Math.random() > 0.5) {
            ex = Math.random() > 0.5 ? 0 : GRID_W - 1;
            ey = Math.floor(Math.random() * GRID_H);
        } else {
            ex = Math.floor(Math.random() * GRID_W);
            ey = Math.random() > 0.5 ? 0 : GRID_H - 1;
        }
        const distP = Math.hypot(ex - state.player.x, ey - state.player.y);
        const distN = state.nexus ? Math.hypot(ex - state.nexus.x, ey - state.nexus.y) : 100;
        if (distP > 10 && distN > 15) safe = true;
        attempts++;
    }

    let type = 'basic';
    const rand = Math.random();
    
    if (difficulty > 8) {
        if (rand < 0.20) type = 'tank'; else if (rand < 0.6) type = 'swarmer';
    } else if (difficulty > 4) {
        if (rand < 0.15) type = 'tank'; else if (rand < 0.5) type = 'swarmer';
    }
    state.enemies.push(new Enemy(ex, ey, type));
}
