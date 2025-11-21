import { state } from './state.js';
import { activeKeys } from './input.js';
import { TILE_SIZE, COLORS, COORDS, BUILD_RANGE, MAX_HEAT, COSTS } from './config.js';

export function draw() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const p = state.player;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply Screen Shake
    ctx.save();
    if (state.cameraShake > 0) {
        const dx = (Math.random() - 0.5) * state.cameraShake;
        const dy = (Math.random() - 0.5) * state.cameraShake;
        ctx.translate(dx, dy);
    }

    // Clarity: Use dots instead of lines. Less visual noise.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'; 
    ctx.beginPath();
    for (let x=0; x<=state.grid.width; x++) {
        for (let y=0; y<=state.grid.height; y++) {
            // Only draw every other intersection
            if (x % 2 === 0 && y % 2 === 0) ctx.rect(x*TILE_SIZE-1, y*TILE_SIZE-1, 2, 2);
        }
    }
    ctx.fill();

    // UX: Cursor Tile Highlight (Spatial Anchor)
    // Draws a subtle highlight under the cursor to help with grid alignment
    if (!state.gameOver) {
        const mx = state.player.cursorX; 
        const my = state.player.cursorY;
        if (mx >= 0 && my >= 0 && mx < state.grid.width && my < state.grid.height) {
             ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
             ctx.fillRect(mx * TILE_SIZE, my * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    for (const cell of state.grid.cells) {
        const x = cell.x * TILE_SIZE;
        const y = cell.y * TILE_SIZE;
        
        // Clarity: Show IO when building irrelevant structures
        if (state.player.buildType && cell.structure) {
             if (cell.structure.active) drawIOOverlay(ctx, cell.structure, x, y, false);
        }
        
        if (cell.resource) {
            const pct = Math.max(0.4, cell.amount / cell.maxAmount);
            const size = (TILE_SIZE - 8) * pct;
            ctx.fillStyle = cell.resource === 'redium' ? COLORS.ore_redium : COLORS.ore_bluestone;
            ctx.fillRect(x + 4 + (TILE_SIZE - 8 - size)/2, y + 4 + (TILE_SIZE - 8 - size)/2, size, size);
        }
        if (cell.structure) drawStructure(ctx, cell.structure, x, y);
        // Status Indicators (Jammed/Action)
        if (cell.structure) {
             let jammed = false;
             if (cell.structure.type === 'miner' && cell.structure.miningProgress >= 1.0) jammed = true;
             // Processor is only jammed if it has output AND input waiting
             else if (cell.structure.type === 'processor' && cell.structure.outputBuffer && cell.structure.inputItem) jammed = true;
             
             if (jammed && Math.floor(Date.now() / 500) % 2 === 0) {
                 // Draw Jammed Icon
                 ctx.fillStyle = '#ff2e63'; ctx.beginPath(); ctx.arc(x + TILE_SIZE - 6, y + 6, 5, 0, Math.PI*2); ctx.fill();
                 ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Arial'; ctx.fillText('!', x + TILE_SIZE - 6, y + 9);
            } else if (cell.structure.heat > 0) {
                 // Draw Heat Indicator
                 const hPct = cell.structure.heat / MAX_HEAT;
                 ctx.fillStyle = `rgba(255, 100, 0, ${hPct})`; ctx.fillRect(x, y+TILE_SIZE-2, TILE_SIZE, 2);
            }
        }
        if (cell.item) {
            let ix = x + TILE_SIZE / 2, iy = y + TILE_SIZE / 2;
            if (cell.structure && cell.structure.type === 'belt') {
                const dir = COORDS[cell.structure.rotation];
                const offset = (cell.item.progress - 0.5) * TILE_SIZE;
                ix += dir.x * offset; iy += dir.y * offset;
            }
            drawItem(ctx, cell.item.type, ix, iy);
        }
    }

    state.enemies.forEach(e => {
        ctx.fillStyle = e.type === 'tank' ? '#8e24aa' : (e.type === 'swarmer' ? '#ff9e80' : COLORS.enemy);
        if (e.freezeTimer > 0) ctx.fillStyle = '#00e5ff';
        ctx.beginPath(); ctx.moveTo(e.x * TILE_SIZE + 16, e.y * TILE_SIZE + 8);
        ctx.lineTo(e.x * TILE_SIZE + 24, e.y * TILE_SIZE + 24);
        ctx.lineTo(e.x * TILE_SIZE + 8, e.y * TILE_SIZE + 24); ctx.fill();
        
        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x * TILE_SIZE, e.y * TILE_SIZE - 6, TILE_SIZE, 4);
        ctx.fillStyle = '#f00'; ctx.fillRect(e.x * TILE_SIZE, e.y * TILE_SIZE - 6, TILE_SIZE * hpPct, 4);
    });

    ctx.textAlign = 'center';
    state.effects.forEach(e => {
        if (e.type === 'laser') {
            ctx.strokeStyle = e.color || '#ffff00'; ctx.lineWidth = e.width || 2; ctx.globalAlpha = e.life / 5;
            ctx.beginPath(); ctx.moveTo(e.x1 * TILE_SIZE + 16, e.y1 * TILE_SIZE + 16);
            ctx.lineTo(e.x2 * TILE_SIZE + 16, e.y2 * TILE_SIZE + 16); ctx.stroke(); ctx.globalAlpha = 1.0;
        } else if (e.type === 'explosion') {
            ctx.fillStyle = COLORS.explosion || '#f60'; ctx.globalAlpha = e.life / 20;
            const r = e.radius * TILE_SIZE;
            ctx.shadowBlur = 20; ctx.shadowColor = '#f60';
            ctx.beginPath(); ctx.arc(e.x * TILE_SIZE + 16, e.y * TILE_SIZE + 16, r, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1.0;
        } else if (e.type === 'text') {
            ctx.fillStyle = e.color || '#fff';
            ctx.shadowBlur = 0;
            // Apply velocity to text floating
            const offset = (30 - e.life) * (e.vy || 0.5);
            ctx.fillText(e.text, e.x * TILE_SIZE + TILE_SIZE/2, e.y * TILE_SIZE - offset);
        }
    });

    // Draw Waypoint
    if (p.moveTarget) {
        const tx = p.moveTarget.x * TILE_SIZE;
        const ty = p.moveTarget.y * TILE_SIZE;
        ctx.beginPath(); ctx.moveTo(p.x * TILE_SIZE + 16, p.y * TILE_SIZE + 16); ctx.lineTo(tx, ty);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI*2); ctx.stroke();
    }

    const cx = p.x * TILE_SIZE + TILE_SIZE/2, cy = p.y * TILE_SIZE + TILE_SIZE/2;
    // Draw Build Range Ring
    ctx.strokeStyle = 'rgba(78, 204, 163, 0.15)'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.arc(cx, cy, BUILD_RANGE * TILE_SIZE, 0, Math.PI*2); ctx.stroke(); ctx.setLineDash([]);

    const px = state.player.x * TILE_SIZE, py = state.player.y * TILE_SIZE;
    ctx.fillStyle = COLORS.player; ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
    ctx.strokeStyle = 'white'; ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

    const mx = state.player.cursorX, my = state.player.cursorY;
    
    // Interaction Modelling: Show build preview over UI to ensure player sees what they are doing.
    // Check valid location logic is handled inside drawBuildPreview to give red/green feedback.
    if (typeof mx === 'number' && !state.gameOver && state.player.buildType && mx >= 0 && my >= 0 && mx < state.grid.width && my < state.grid.height && !isMouseOverUI(mx, my)) {
        drawBuildPreview(ctx, mx, my);
    }
    
    ctx.restore(); // End Screen Shake

    if (typeof mx === 'number' && !state.gameOver && !state.player.buildType) {
        // UX: Smart Cursor (Tooltips, health bars, contents)
        drawSmartCursor(ctx, mx, my, canvas);
    }
}

// Helper to prevent drawing cursor under UI
function isMouseOverUI(mx, my) {
    // Interaction Modelling: Precise check using elementFromPoint via tracked pixel coordinates
    // to prevent accidental world-clicks when interacting with HUD.
    const px = state.player.pixelX; 
    const py = state.player.pixelY;
    if (!px || !py) return false;
    const el = document.elementFromPoint(px, py);
    return el && (el.closest('#hotbar') || el.closest('.controls-panel') || el.closest('#recipe-panel') || el.closest('#top-bar'));
} 

function drawBuildPreview(ctx, mx, my) {
    const cost = COSTS[state.player.buildType] || 0;
    // Fun: Pulse animation for valid placement to signal "Ready"
    const pulse = (Math.sin(Date.now() / 150) + 1) / 2; 
    const canAfford = state.currency >= cost;
    const x = mx * TILE_SIZE, y = my * TILE_SIZE;

    const bt = state.player.buildType;

    // Clarity: Floating Cost/Error Label attached to cursor
    const under = state.grid.get(mx, my) || {};
    const isValidLoc = !(bt === 'miner' && (!under || !under.resource));
    
    // Floating Cost Label
    ctx.shadowColor = '#000'; ctx.shadowBlur = 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x + TILE_SIZE + 2, y + 2, 100, 40); // Backing for readability
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    // Context sensitive error messages
    ctx.fillStyle = (canAfford && isValidLoc) ? '#66fcf1' : '#ff2e63';
    const txtX = x + TILE_SIZE + 5;
    ctx.fillText(`-$${cost}`, txtX, y + 15);
    if (!canAfford) ctx.fillText(`Need $${cost}`, txtX, y + 30);
    if (!isValidLoc) ctx.fillText(`Needs Ore`, txtX, y + 30);
    ctx.shadowBlur = 0;

    // UX: Visual validation (Ghost color changes based on validity)
    ctx.globalAlpha = canAfford ? 0.6 : 0.3;
    const ghostStruct = { type: bt, rotation: state.player.rotation, hp: 100, maxHp: 100, maxAmmo: 50, ammo: 50, active:true };

    // Valid Target Pulse
    if (bt === 'miner' && under && under.resource) { ctx.fillStyle = '#fff'; ctx.globalAlpha=0.2; ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE); }

    // Draw Ghost
    ctx.fillStyle = (canAfford && isValidLoc) ? `rgba(78, 204, 163, ${0.3 + pulse * 0.2})` : 'rgba(233, 69, 96, 0.6)';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    drawStructure(ctx, ghostStruct, x, y, true);

    // UX: Connection Line Visualization (Clarity - Show where item goes)
    if (['miner', 'belt', 'processor', 'splitter'].includes(bt)) {
        const dir = COORDS[state.player.rotation];
        const tx = x + TILE_SIZE/2 + dir.x * TILE_SIZE;
        const ty = y + TILE_SIZE/2 + dir.y * TILE_SIZE;
        ctx.beginPath(); ctx.moveTo(x + TILE_SIZE/2, y + TILE_SIZE/2); ctx.lineTo(tx, ty);
        ctx.strokeStyle = (canAfford && isValidLoc) ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 50, 50, 0.5)';
        ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI*2); ctx.fill();
    }

    // UX: Ghost Arrows help orient the player BEFORE they click
    if (['belt','miner','splitter','processor'].includes(bt)) drawIOOverlay(ctx, ghostStruct, x, y, true);
    ctx.globalAlpha = 1.0;

    // Range indicator
    if (bt === 'turret' || bt === 'miner' || bt === 'nexus') {
         ctx.save();
         ctx.lineWidth = 1;
         ctx.strokeStyle = bt === 'turret' ? 'rgba(255, 46, 99, 0.4)' : 'rgba(102, 252, 241, 0.3)';
         ctx.setLineDash([5, 5]);
         const range = bt === 'turret' ? 4 : (bt === 'nexus' ? 8 : 0.5); // Miner range is strict
         ctx.beginPath(); ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, range * TILE_SIZE, 0, Math.PI*2); ctx.stroke();
         ctx.restore();
         ctx.setLineDash([]);
    }

    // Border
    ctx.strokeStyle = (canAfford && isValidLoc) ? '#66fcf1' : '#ff2e63'; ctx.lineWidth = 2;
    if (!canAfford || !isValidLoc) ctx.setLineDash([2, 2]);
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.setLineDash([]);
}

function drawSmartCursor(ctx, mx, my, canvas) {
    const x = mx * TILE_SIZE, y = my * TILE_SIZE;
    const hCell = state.grid.get(mx, my);
    
    // Default Cursor
    if (!hCell || (!hCell.structure && !hCell.resource)) {
        const isMoving = (activeKeys['Shift'] || activeKeys[' ']) && !activeKeys['w'] && !activeKeys['a'] && !activeKeys['s'] && !activeKeys['d'];
        drawCursorCrosshair(ctx, mx, my, isMoving ? '#00e5ff' : 'rgba(255,255,255,0.2)');
    }

    ctx.save(); 
    // UX: Hover Range Indicators for clarity
    if (hCell && hCell.structure) {
        const s = hCell.structure;
        let range = 0;
        if (s.type === 'turret') range = 4;
        else if (s.type === 'nexus') range = 8;
        
        if (range > 0) {
            ctx.save();
            ctx.strokeStyle = hCell.structure.type === 'turret' ? 'rgba(255, 46, 99, 0.4)' : 'rgba(102, 252, 241, 0.2)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, range * TILE_SIZE, 0, Math.PI*2);
            ctx.stroke();
            ctx.restore();
        }

        // UX: Visualize Output Connection for Logic clarity
        const dir = COORDS[s.rotation % 4];
        if (['belt','miner','processor','splitter'].includes(s.type)) {
             const tx = x + TILE_SIZE/2 + dir.x * TILE_SIZE;
             const ty = y + TILE_SIZE/2 + dir.y * TILE_SIZE;
             ctx.beginPath(); ctx.moveTo(x+TILE_SIZE/2, y+TILE_SIZE/2); ctx.lineTo(tx, ty);
             ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth=2; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
             ctx.beginPath(); ctx.arc(tx, ty, 3, 0, Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.fill();
        }
    }

    // Smart Interaction Icons
    const pDist = Math.hypot((state.player.x - mx), (state.player.y - my));
    if (pDist < BUILD_RANGE) {
        if (hCell && hCell.structure && ['miner','processor','turret'].includes(hCell.structure.type)) {
             // Gear Icon (Interact)
             ctx.fillStyle = '#4ecca3';
             ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline='middle';
             ctx.shadowColor='#000'; ctx.shadowBlur=4; 
             ctx.fillText('⚙️', x + TILE_SIZE/2, y - 12);
        } else if (hCell && hCell.resource) {
             // Pickaxe for Mine
             ctx.fillStyle = '#fff';
             ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline='middle';
             ctx.shadowColor='#000'; ctx.shadowBlur=2;
             ctx.fillText('⛏️', x + TILE_SIZE/2, y - 10);
             
             // Value Hint
             ctx.font = '10px monospace'; ctx.fillStyle = '#ffd700';
             const val = hCell.resource === 'redium' ? 15 : 25;
             ctx.fillText(`$${Math.floor(val * (1 + (state.nexus.level - 1) * 0.5))}`, x + TILE_SIZE/2, y - 24);
        }
    }

    // Tooltip / HUD - Dynamic Positioning to stay on screen
    if (hCell && (hCell.structure || hCell.resource)) {
        let label = hCell.structure ? hCell.structure.type.toUpperCase() : hCell.resource.toUpperCase();
        let sub = "";
        if (hCell.structure) {
            let status = "Active";
            const s = hCell.structure;
            // Clarity: Status text handles jammed/waiting states
            if (s.type === 'miner') status = s.miningProgress >= 1.0 ? "OUTPUT FULL" : `Mining ${(s.miningProgress*100).toFixed(0)}%`;
            else if (s.type === 'processor') status = s.outputBuffer ? "OUTPUT FULL" : (s.inputItem ? "Processing..." : "WAITING");
            else if (s.type === 'turret') status = `${s.ammo}/${s.maxAmmo} Ammo`;
            else if (s.type === 'storage') status = `${s.storedCount}/${s.capacity} Items`;
            else if (s.type === 'nexus') status = `XP: ${Math.floor(s.xp)}/${Math.floor(s.xpToNext)}`;
            
            sub = `HP: ${Math.floor(s.hp)} | ${status}`;
        } else {
            sub = `Yield: High`;
        }

        // Clarity: Draw Info Box (Smart positioning)
        let bx = x + 24; 
        let by = y - 40;
        // UX: Clamp tooltip to canvas bounds so it doesn't clip
        if (bx + 130 > canvas.width) bx = x - 134;
        if (by < 10) by = y + 48; // Flip tooltip if near top edge
         
        ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
        
        // Contextual styling
        if (hCell.structure && hCell.structure.type === 'nexus') {
             ctx.fillStyle = 'rgba(20, 0, 0, 0.95)'; 
             label = "NEXUS CORE";
             sub = `Lvl ${hCell.structure.level} | HP ${hCell.structure.hp}`;
        } else {
             ctx.fillStyle = 'rgba(11, 12, 16, 0.95)'; 
        }

        ctx.fillRect(bx, by, 130, 36);
        // Border color based on active state or enemy
        ctx.strokeStyle = (hCell.structure && !hCell.structure.active) ? '#ff2e63' : '#45a29e'; 
        ctx.lineWidth = 1; ctx.strokeRect(bx, by, 130, 36);
        
        ctx.fillStyle = '#e94560'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';
        ctx.fillText(label, bx + 6, by + 14);
        ctx.fillStyle = '#ccc'; ctx.font = '10px monospace'; ctx.shadowBlur = 0;
        ctx.fillText(sub, bx + 6, by + 28);
    }
    ctx.restore();
}

function drawCursorCrosshair(ctx, mx, my, color) {
    const x = mx * TILE_SIZE, y = my * TILE_SIZE;
    const s = 6; 
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.shadowColor = color; ctx.shadowBlur = 5;
    ctx.beginPath(); 
    ctx.moveTo(x, y + s); ctx.lineTo(x, y); ctx.lineTo(x + s, y); // TL
    ctx.moveTo(x + TILE_SIZE - s, y); ctx.lineTo(x + TILE_SIZE, y); ctx.lineTo(x + TILE_SIZE, y + s); // TR
    ctx.moveTo(x + TILE_SIZE, y + TILE_SIZE - s); ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE); ctx.lineTo(x + TILE_SIZE - s, y + TILE_SIZE); // BR
    ctx.moveTo(x + s, y + TILE_SIZE); ctx.lineTo(x, y + TILE_SIZE); ctx.lineTo(x, y + TILE_SIZE - s); // BL
    
    // Add central dot
    ctx.fillRect(x + TILE_SIZE/2 - 1, y + TILE_SIZE/2 - 1, 2, 2);
    ctx.stroke(); 
    ctx.shadowBlur = 0;
}

function drawItem(ctx, type, x, y) {
    ctx.shadowBlur = 4; ctx.shadowColor = '#000';
    if (type === 'redium') {
        ctx.fillStyle = COLORS.item_redium;
        ctx.beginPath(); ctx.moveTo(x, y-5); ctx.lineTo(x+4, y+2); ctx.lineTo(x-2, y+5); ctx.lineTo(x-4, y); ctx.fill();
    } else if (type === 'bluestone') {
        ctx.fillStyle = COLORS.item_bluestone; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
    } else if (type === 'alloy') {
        ctx.fillStyle = COLORS.item_alloy; ctx.fillRect(x-3, y-2, 6, 4);
        ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1; ctx.strokeRect(x-3, y-2, 6, 4);
    } else if (type === 'plate') {
        ctx.fillStyle = COLORS.item_plate; ctx.fillRect(x-4, y-4, 8, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x-2, y-2, 2, 2);
    } else if (type === 'ammo') {
        ctx.fillStyle = COLORS.item_ammo; ctx.fillRect(x-2, y-5, 4, 10);
        ctx.fillStyle = '#f00'; ctx.fillRect(x-2, y-5, 4, 3);
    } else if (type === 'battery') {
        ctx.fillStyle = COLORS.item_battery;
        ctx.beginPath(); ctx.moveTo(x, y-4); ctx.lineTo(x+4, y); ctx.lineTo(x, y+4); ctx.lineTo(x-4, y); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x, y-2); ctx.lineTo(x+1, y); ctx.lineTo(x, y+2); ctx.lineTo(x-1, y); ctx.fill();
    } else {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0;
}

function drawIOOverlay(ctx, struct, x, y, isGhost) {
    const type = struct.type;
    const cx = x + TILE_SIZE / 2; const cy = y + TILE_SIZE / 2;
    const drawArrow = (rot, color, label, offset = 16) => {
        const dir = COORDS[rot % 4];
        ctx.fillStyle = color; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
        const ax = cx + (dir.x * offset); const ay = cy + (dir.y * offset);
        ctx.beginPath(); ctx.moveTo(ax, ay);
        const s = 5;
        // Arrow shape pointing OUT from center for output, IN for input logic visually depends on pos
        // Simplified: Draw arrow at edge pointing away from center
        ctx.lineTo(ax - dir.x * (s+2) - dir.y * s, ay - dir.y * (s+2) + dir.x * s);
        ctx.lineTo(ax - dir.x * (s+2) + dir.y * s, ay - dir.y * (s+2) - dir.x * s);
        ctx.fill(); ctx.stroke();
        // if (label) { ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Arial'; ctx.fillText(label, ax, ay + 4); }
    };
    if (type === 'miner') drawArrow(struct.rotation, '#00e676', 'OUT');
    else if (type === 'belt') drawArrow(struct.rotation, 'rgba(255,255,255,0.5)', '', 12);
    else if (type === 'processor') {
        drawArrow(struct.rotation, '#00e676', 'OUT', 20); 
    } else if (type === 'splitter') {
        // Splitter has complicated IO, just show outputs
        drawArrow(struct.rotation, '#ffeb3b', '1'); drawArrow(struct.rotation + 1, '#ffeb3b', '3');
        drawArrow(struct.rotation + 3, '#ffeb3b', '2'); drawArrow(struct.rotation + 2, '#2979ff', 'IN');
    }
}

function drawStructure(ctx, s, x, y, ghost=false) {
    ctx.save();
    ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    ctx.rotate(s.rotation * Math.PI / 2);

    if (s.type === 'belt') {
        ctx.fillStyle = COLORS.belt;
        ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(12, -12); ctx.lineTo(12, 12); ctx.lineTo(-12, 12); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-10, -12); ctx.lineTo(-10, 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(10, -12); ctx.lineTo(10, 12); ctx.stroke();
        const offset = -(Date.now() / (s.boostTimer > 0 ? 10 : 30)) % 8;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for(let i=-12; i<12; i+=8) ctx.fillRect(-6, i + offset + 4, 12, 2);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.moveTo(-5, 4); ctx.lineTo(0, -6); ctx.lineTo(5, 4); ctx.fill();
    } else if (s.type === 'miner') {
        ctx.fillStyle = COLORS.miner; ctx.fillRect(-13, -13, 26, 26);
        ctx.fillStyle = s.boostTimer > 0 ? '#ff0055' : '#fff'; ctx.fillRect(-4, -4, 8, 8);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(0, -14); ctx.lineTo(4, -8); ctx.fill();
        if (s.miningProgress >= 1.0 && !ghost) { ctx.fillStyle = '#ff2e63'; ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill(); }
    } else if (s.type === 'wall') {
        ctx.fillStyle = COLORS.wall; ctx.fillRect(-16, -16, 32, 32); ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 2; ctx.strokeRect(-15, -15, 30, 30);
    } else if (s.type === 'processor') {
        ctx.fillStyle = COLORS.processor; ctx.fillRect(-12, -12, 24, 24); 
        ctx.fillStyle = (s.inputItem) ? (s.boostTimer > 0 ? '#fff' : '#0f0') : '#555'; ctx.fillRect(-4, -4, 8, 8);
        if (s.outputBuffer) drawItem(ctx, s.outputBuffer.type, 0, 0);
        // Clarity: Progress Bar
        if (s.inputItem && s.processingTime > 0 && !ghost) {
             const maxT = s.currentMaxTime || s.maxProcessingTime;
             const pct = 1 - (s.processingTime / maxT);
             ctx.fillStyle = '#222'; ctx.fillRect(-10, -16, 20, 3);
             ctx.fillStyle = '#0f0'; ctx.fillRect(-10, -16, 20 * pct, 3);
        }
        if (s.heat > 0 && !ghost) { ctx.fillStyle = `rgba(255, 50, 50, ${s.heat / MAX_HEAT * 0.6})`; ctx.fillRect(-10, -10, 20, 20); }
    } else if (s.type === 'turret') {
        ctx.fillStyle = COLORS.turret; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111'; ctx.fillRect(-2, -12, 4, 12);
        ctx.fillStyle = (s.damageBuff > 1.5) ? '#ff9100' : '#0f0'; ctx.fillRect(-10, 8, 20 * Math.min(1, s.ammo / s.maxAmmo), 4);
        // Clarity: Critical State
        if (s.ammo <= 0 && !ghost && Math.floor(Date.now()/500)%2===0) {
            ctx.fillStyle = '#ff2e63'; ctx.font='bold 10px Arial'; ctx.fillText('NO AMMO', 0, -16);
        }
    } else if (s.type === 'nexus') {
        ctx.fillStyle = COLORS.nexus; ctx.fillRect(-14, -14, 28, 28);
    } else if (s.type === 'splitter') {
        ctx.fillStyle = COLORS.splitter; ctx.fillRect(-12, -12, 24, 12); ctx.fillRect(-6, 0, 12, 12);
    } else if (s.type === 'storage') {
        ctx.fillStyle = COLORS.storage; ctx.fillRect(-14, -14, 28, 28); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-10, -10, 20, 20);
        if (s.storedCount !== undefined) { ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.textAlign='center'; ctx.fillText(s.storedCount, 0, 4); }
    }
    
    ctx.restore();

    if (s.boostTimer > 0) {
        ctx.strokeStyle = `rgba(0, 255, 255, 0.6)`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x + TILE_SIZE/2, y + TILE_SIZE/2, TILE_SIZE * 0.7, 0, Math.PI*2); ctx.stroke();
    }
    if (s.heat > MAX_HEAT * 0.8) { ctx.fillStyle = `rgba(255, 0, 0, 0.8)`; ctx.font = '12px Arial'; ctx.fillText('⚠', x + TILE_SIZE/2, y); }
    if (s.hp < s.maxHp) {
        const pct = Math.max(0, s.hp / s.maxHp);
        ctx.fillStyle = '#000'; ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4); // Background
        ctx.fillStyle = '#000'; ctx.fillRect(x + 4, y - 6, TILE_SIZE - 8, 4);
        ctx.fillStyle = pct < 0.3 ? '#f00' : '#0f0'; ctx.fillRect(x + 4, y - 6, (TILE_SIZE - 8) * pct, 4);
    }
}
