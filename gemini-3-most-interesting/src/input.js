import { state } from './state.js';
import { updateUI } from './ui.js';
import { TILE_SIZE, BUILD_RANGE } from './config.js';
import { placeStructure, removeStructure } from './builder.js';

export const activeKeys = {};
let lastGx = -1;
let lastGy = -1;

export function bindInputs(canvas) {
    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
}

function handleKey(e) {
    activeKeys[e.key] = true;
    handleHotkeys(e);
}

function handleKeyUp(e) {
    activeKeys[e.key] = false;
}

function handleWheel(e) {
    e.preventDefault();
    rotateSelection(Math.sign(e.deltaY));
}

function rotateSelection(dir = 1) {
    const p = state.player;
    const hCell = state.grid.get(p.cursorX, p.cursorY);
    if (hCell && hCell.structure && hCell.structure.type !== 'nexus') {
        hCell.structure.rotation = (hCell.structure.rotation + 4 + dir) % 4;
        state.effects.push({ type: 'text', text: '↻', x: p.cursorX, y: p.cursorY, color: '#fff', life: 15 });
    } else {
        p.rotation = (p.rotation + 4 + dir) % 4;
    }
    updateUI();
}

function handleHotkeys(e) {
    if (e.repeat) return;
    const p = state.player;
    
    // Interaction Modelling: Pipette tool (Q)
    if (e.key === 'q' || e.key === 'Q') {
        const hCell = state.grid.get(p.cursorX, p.cursorY);
        if (p.buildType) { p.buildType = null; } 
        else if (hCell && hCell.structure) {
            p.buildType = hCell.structure.type;
            p.rotation = hCell.structure.rotation;
            state.effects.push({ type: 'text', text: 'PIP ETTE', x: p.cursorX, y: p.cursorY, color: '#fff', life: 20, vy:0.5 });
        }
        updateUI(); return;
    }

    if (e.key === 'Escape') { p.buildType = null; updateUI(); return; }
    if (e.key === 'x' || e.key === 'X') { removeStructure(p.cursorX, p.cursorY); return; }
    if (e.key === 'r' || e.key === 'R') rotateSelection(1);
    if (e.key === 'e' || e.key === 'E') {
        // Interaction is handled via Mouse Click usually now, or context sensitive.
        interact(e, p.cursorX, p.cursorY, true); // Force interact
    }

    if (e.key === '1') p.buildType = 'belt';
    if (e.key === '2') p.buildType = 'miner';
    if (e.key === '3') p.buildType = 'turret';
    if (e.key === '4') p.buildType = 'processor';
    if (e.key === '5') p.buildType = 'wall';
    if (e.key === '6') p.buildType = 'splitter';
    if (e.key === '7') p.buildType = 'storage';
    updateUI();
}

export function tickInput() {
    if (state.input.mouseDown) {
        interact(state.player.cursorX, state.player.cursorY, state.input.mouseBtn);
    }
}

function handleMouseMove(e) {
    const rect = e.target.getBoundingClientRect();
    const scaleX = e.target.width / rect.width;
    const scaleY = e.target.height / rect.height;
    const gx = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
    const gy = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);
    state.player.pixelX = e.clientX;
    state.player.pixelY = e.clientY;
    state.player.cursorX = gx;
    state.player.cursorY = gy;
    
    // Drag to Move (Right Click Hold)
    if (state.input.mouseDown && state.input.mouseBtn === 2 && !state.player.buildType) {
        state.player.moveTarget = { x: state.player.cursorX + 0.5, y: state.player.cursorY + 0.5 };
    }

    if (state.input.mouseDown && (gx !== lastGx || gy !== lastGy)) {
        // UX: Smart Belt Dragging
        // Calculates rotation based on mouse movement direction
        if (state.player.buildType === 'belt' && lastGx !== -1 && lastGy !== -1) {
            const dx = gx - lastGx;
            const dy = gy - lastGy;
            let newRot = -1;
            if (dy === -1) newRot = 0; // Up
            if (dx === 1) newRot = 1;  // Right
            if (dy === 1) newRot = 2;  // Down
            if (dx === -1) newRot = 3; // Left

            if (newRot !== -1) {
                state.player.rotation = newRot;
                // Retroactively fix the previous belt to point to this one for smooth curves
                const prevCell = state.grid.get(lastGx, lastGy);
                if (prevCell && prevCell.structure && prevCell.structure.type === 'belt') {
                    prevCell.structure.rotation = newRot;
                }
            }
        }
        // Note: We no longer trigger interact() here directly for everything, 
        // relying on tickInput() in main loop for smooth repetition, 
        // but belts need immediate feedback during drag.
         if (state.player.buildType === 'belt') interact(gx, gy, state.input.mouseBtn);
    }
}

function handleMouseDown(e) { 
    state.input.mouseDown = true;
    state.input.mouseBtn = e.button;
    const rect = e.target.getBoundingClientRect();
    const scaleX = e.target.width / rect.width;
    const scaleY = e.target.height / rect.height;
    const gx = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
    const gy = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);
    state.player.pixelX = e.clientX;
    state.player.pixelY = e.clientY;
    state.player.cursorX = gx;
    state.player.cursorY = gy;
    // Trigger immediately for crisp response
    interact(gx, gy, e.button); 
}
function handleMouseUp(e) { state.input.mouseDown = false; lastGx = -1; lastGy = -1; }

export function interact(gx, gy, btn, forceKey = false) {
    if ((state.player.x - gx)**2 + (state.player.y - gy)**2 > BUILD_RANGE * BUILD_RANGE) return;
    
    // Check for mining context (Continuous action allowed)
    const cell = state.grid.get(gx, gy);
    const isMining = cell && cell.resource && !cell.structure && !state.player.buildType;

    // Allow drag on different tiles, but click on same tile repeatedly needs debounce handled in builder
    // Exception: Mining should be allowed to repeat
    if (!forceKey && lastGx === gx && lastGy === gy && state.player.buildType !== 'belt' && !isMining) return;
    
    lastGx = gx; lastGy = gy;

    if (forceKey) {
        // 'E' Key logic
        if (cell && cell.structure) cell.structure.interact(state) || placeStructure(gx, gy); // Try interact, then try build/mine
        else placeStructure(gx, gy);
        return;
    }

    if (btn === 2) {
        // UX Improvement: Interaction Modelling - Cancel first, then Delete
        if (state.player.buildType) {
            state.player.buildType = null;
            state.player.moveTarget = null;
            // Feedback for cancel
            state.effects.push({type:'text', text:'CANCEL', x:gx, y:gy, life:10, color:'#aaa', vy:0.5});
            updateUI();
        } else {
            // Right Click is now Move. Delete is on 'X'.
            state.player.moveTarget = { x: gx + 0.5, y: gy + 0.5 };
            state.effects.push({type:'text', text:'▼', x:gx, y:gy, life:15, color:'#00e5ff', vy:0});
        }
    } else if (btn === 1) {
        if (cell && cell.structure) {
            state.player.buildType = cell.structure.type;
            state.player.rotation = cell.structure.rotation;
            updateUI();
            state.effects.push({ type: 'text', text: 'COPIED', x: gx, y: gy, color: '#fff', life: 20 });
        }
    } else if (btn === 0) {
        if (cell && cell.structure && cell.structure.type === state.player.buildType && cell.structure.rotation === state.player.rotation) return;
        placeStructure(gx, gy); 
    }
}
