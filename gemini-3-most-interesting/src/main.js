import { GRID_W, GRID_H, TILE_SIZE, TICK_RATE, PLAYER_SPEED, PLAYER_DASH_SPEED, POLLUTION_DECAY, RESOURCE_DENSITY, POLLUTION_TRIGGER } from './config.js';
import { state } from './state.js';
import { updateUI } from './ui.js';
import { spawnEnemy } from './spawner.js';
import { bindInputs, activeKeys, tickInput } from './input.js';
import { draw } from './render.js';
import { Nexus } from './structures/nexus.js';

function init() {
    const canvas = document.getElementById('gameCanvas');
    canvas.width = GRID_W * TILE_SIZE;
    canvas.height = GRID_H * TILE_SIZE;
    
    const generateVein = (type, count, clusterSize) => {
        for (let i = 0; i < count; i++) {
            let cx = Math.floor(Math.random() * (GRID_W - 6)) + 3;
            let cy = Math.floor(Math.random() * (GRID_H - 6)) + 3;
            for (let j = 0; j < clusterSize; j++) {
                const ox = Math.floor(Math.random() * 3);
                const oy = Math.floor(Math.random() * 3);
                const cell = state.grid.get(cx + ox, cy + oy);
                if (Math.abs((cx+ox) - GRID_W/2) < 4 && Math.abs((cy+oy) - GRID_H/2) < 4) continue;
                if (cell && !cell.structure && !cell.resource) {
                    cell.resource = type;
                    cell.maxAmount = cell.amount = Math.floor(Math.random() * (RESOURCE_DENSITY.max - RESOURCE_DENSITY.min)) + RESOURCE_DENSITY.min;
                }
            }
        }
    };

    generateVein('redium', 18, 15);
    generateVein('bluestone', 8, 8);
    // Ensure starter resources near spawn
    generateVein('redium', 1, 5); 
    generateVein('bluestone', 1, 5);
    
    const cx = Math.floor(GRID_W / 2);
    const cy = Math.floor(GRID_H / 2);
    state.nexus = new Nexus(cx, cy);
    state.grid.get(cx, cy).structure = state.nexus;
    state.structures.push(state.nexus);
    
    bindInputs(canvas);
    requestAnimationFrame(loop);
}

let lastTime = 0, accumulator = 0;
const TIMESTEP = 1000 / TICK_RATE;

function loop(timestamp) {
    const deltaTime = timestamp - lastTime || 0;
    lastTime = timestamp;
    accumulator += deltaTime;
    if (accumulator > 200) accumulator = 200; 
    while (accumulator >= TIMESTEP) { update(); accumulator -= TIMESTEP; }
    draw();
    requestAnimationFrame(loop);
}

function update() { 
    if (state.gameOver) return;
    state.framenum++;
    if (state.framenum % 60 === 0) state.stats.globalSpeedMult = 1.0;

    // Camera Shake Decay
    if (state.cameraShake > 0) state.cameraShake *= 0.85;
    if (state.cameraShake < 0.5) state.cameraShake = 0;

    state.structures = state.structures.filter(s => {
        if (s.hp <= 0 && s.active) { s.active = false; if (s.onDestroy) s.onDestroy(state); }
        if (!s.active) { const c = state.grid.get(s.x, s.y); if (c.structure === s) c.structure = null; return false; }
        return true;
    });
    state.enemies = state.enemies.filter(e => {
        if (e.hp <= 0) {
            const val = 5 + Math.floor(state.nexus.level * 2);
            state.currency += val; state.nexus.addXp(2);
            state.effects.push({type:'text', text:`+$${val}`, x:e.x, y:e.y, life:20, color:'#ffd700'}); 
            if (Math.random() < 0.30) {
                 const c = state.grid.get(Math.round(e.x), Math.round(e.y));
                 if (c && !c.structure && !c.item) c.item = { type: 'redium', progress: 0 };
            }
            return false;
        }
        return true;
    });
    state.effects = state.effects.filter(e => --e.life > 0);
    state.structures.forEach(s => s.tick(state.grid));
    state.enemies.forEach(e => e.tick(state.enemies));

    const p = state.player;
    
    // MOVEMENT LOGIC
    let spd = (activeKeys['Shift'] || activeKeys[' ']) && p.dashEnergy > 0 ? PLAYER_DASH_SPEED : PLAYER_SPEED;
    if (spd === PLAYER_DASH_SPEED) p.dashEnergy -= 2; else if (p.dashEnergy < 100) p.dashEnergy += 0.5;

    let dx = 0, dy = 0;
    if (activeKeys['w'] || activeKeys['ArrowUp']) dy -= spd;
    if (activeKeys['s'] || activeKeys['ArrowDown']) dy += spd;
    if (activeKeys['a'] || activeKeys['ArrowLeft']) dx -= spd;
    if (activeKeys['d'] || activeKeys['ArrowRight']) dx += spd;
    
    // Trackpad Friendly: Shift + Point to move (if no keys pressed)
    if (dx === 0 && dy === 0 && (activeKeys['Shift'] || activeKeys[' '])) {
        state.player.moveTarget = null;
        const cx = p.cursorX + 0.5, cy = p.cursorY + 0.5;
        const dxToC = cx - p.x, dyToC = cy - p.y;
        const dist = Math.hypot(dxToC, dyToC);
        if (dist > 0.2) {
            dx = (dxToC / dist) * spd;
            dy = (dyToC / dist) * spd;
            if (dist < spd) { dx = dxToC; dy = dyToC; } // Snap to avoid jitter
        }
    }

    // Mouse Auto-Move (Right Click)
    if (dx === 0 && dy === 0 && p.moveTarget) {
        const mdx = p.moveTarget.x - p.x;
        const mdy = p.moveTarget.y - p.y;
        const dist = Math.hypot(mdx, mdy);
        if (dist < spd) {
            p.x = p.moveTarget.x; p.y = p.moveTarget.y;
            p.moveTarget = null;
        } else {
            const angle = Math.atan2(mdy, mdx);
            dx = Math.cos(angle) * spd;
            dy = Math.sin(angle) * spd;
        }
    } else if (dx !== 0 || dy !== 0) {
        p.moveTarget = null; // Manual override
        if (!(activeKeys['Shift'] || activeKeys[' '])) { dx *= 0.7071; dy *= 0.7071; } // Diagonal correction for keys
    }

    if (p.x + dx >= 0 && p.x + dx <= GRID_W - 0.1) p.x += dx;
    if (p.y + dy >= 0 && p.y + dy <= GRID_H - 0.1) p.y += dy;

    state.pollution = Math.max(0, state.pollution - POLLUTION_DECAY);
    if (state.spawnQueue > 0 && state.framenum % 30 === 0) {
        spawnEnemy((state.nexus.level - 1) * 1.5 + (state.pollution/10)); state.spawnQueue--;
    }

    if (state.waveCooldown > 0) state.waveCooldown--;
    if (state.pollution >= POLLUTION_TRIGGER && state.waveCooldown <= 0) {
        state.pollution -= POLLUTION_TRIGGER * 0.75;
        state.cameraShake = 15;
        state.spawnQueue += 3 + Math.round(((state.nexus.level - 1) * 1.5) / 1.2);
        state.waveCooldown = 1200;
        state.effects.push({type:'text', text:'⚠️ WAVE DETECTED ⚠️', x:state.player.x, y:state.player.y-2, color:'#ff2e63', life:120});
    }
    
    tickInput(); // Handle auto-mining/building on hold
    updateUI();
}
window.onload = init
