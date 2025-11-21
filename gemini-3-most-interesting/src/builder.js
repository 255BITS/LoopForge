import { state } from './state.js';
import { COSTS, LEVEL_REQS } from './config.js';
import { Belt } from './structures/belt.js';
import { Miner } from './structures/miner.js';
import { Turret } from './structures/turret.js';
import { Processor } from './structures/processor.js';
import { Splitter } from './structures/splitter.js';
import { Storage } from './structures/storage.js';
import { Wall } from './structures/wall.js';

export function removeStructure(x, y) {
    const cell = state.grid.get(x, y);
    if (cell && cell.structure && cell.structure.type !== 'nexus') {
        // UX Principle: Forgiveness. Refund 100% to encourage experimentation.
        if (COSTS[cell.structure.type]) {
            state.currency += COSTS[cell.structure.type]; 
            // Visual Feedback for refund (Distinct Blue for Refund vs Gold for Income)
            state.effects.push({type:'text', text:`REFUND $${COSTS[cell.structure.type]}`, x:x, y:y, life:40, color:'#66fcf1', vy: -0.5});
        }
        cell.structure.active = false;
        // "Despawn" effect
        state.effects.push({type:'explosion', x:x, y:y, radius:0.3, life:10, color:'#aaa'});
        state.cameraShake = 1;
        cell.structure = null; 
    }
    else if (state.player.buildType) {
        // UX: If tool is selected but no structure here, maybe user clicked wrong.
    }
}

export function placeStructure(x, y) {
    const cell = state.grid.get(x, y);
    
    // Manual Mining Cooldown to prevent autoclicker exploits
    const now = performance.now();

    if (cell && cell.structure) {
        // QoL: Allow painting over belts to change direction instantly.
        // Does not cost money, just updates rotation.
        if (state.player.buildType === 'belt' && cell.structure.type === 'belt') {
            if (cell.structure.rotation !== state.player.rotation) {
                cell.structure.rotation = state.player.rotation;
            }
            return;
        }

        // INTERACT PRIORITY: If structure exists, always interact first, do not replace
        // unless holding a different building type (which would require delete first anyway)
        if (cell.structure.interact(state)) {
            return;
        }
        return;
    }

    // Manual Mining (Click on resource with no structure)
    if (cell && !cell.structure && cell.resource && !state.player.buildType) {
        // Only apply cooldown to mining, not building (allows drag-painting structures)
        if (state.player.lastMine && now - state.player.lastMine < 100) return; 
        // state.player.lastMine = now; // Moved inside strict mining block below
    
        // QoL: Cleanup items on floor
        if (cell && cell.item && !state.player.buildType && !cell.structure) {
            const val = RECIPES[cell.item.type] ? 5 : 1;
            state.currency += val; cell.item = null;
            // Fun: Juicy pickup text
            state.effects.push({type:'text', text:`+${val}`, x:x, y:y, life:20, color:'#fff', vy:1.5});
            return;
        }
        
        const baseYield = cell.resource === 'redium' ? 15 : 25;
        const yieldAmount = Math.floor(baseYield * (1 + (state.nexus.level - 1) * 0.5));
        
        state.player.lastMine = now;
        state.currency += yieldAmount;
        
        // Visual feedback
        state.effects.push({ 
            type: 'text', 
            text: `$${yieldAmount}`, 
            x: x, y: y, 
            life: 30, 
            color: cell.resource === 'redium' ? '#ff6b6b' : '#4ecca3',
            vy: -1.0 // Fast float up to distinguish from passive income
        });
        // Add particles
        for(let i=0; i<3; i++) state.effects.push({type:'explosion', x:x, y:y, radius:0.2, life:10, color: cell.resource==='redium'?'#ff6b6b':'#4ecca3'});
        return;
    }

    if (!cell) return;

    const cost = COSTS[state.player.buildType];
    
    // UX: Clarity - Explicitly warn if placement is invalid (e.g. Miner on dirt)
    if (state.player.buildType === 'miner' && (!cell || !cell.resource)) {
         state.effects.push({type:'text', text:'❌ NEEDS ORE', x:x, y:y, life:40, color:'#ff2e63', vy:0.5});
         return;
    }

    if (state.currency < cost) {
         state.effects.push({type:'text', text:`NEED $${cost}`, x:x, y:y, life:30, color:'#ff2e63', vy:0});
         return;
    }

    const req = LEVEL_REQS[state.player.buildType] || 0;
    if (state.nexus.level < req) {
        if (Math.random() > 0.9) state.effects.push({type:'text', text:`LOCKED (Lv${req})`, x:x, y:y, life:40, color:'#888'});
        return;
    }
    
    let s = getStructure(state.player.buildType, x, y, state.player.rotation);
    if (s) {
        state.currency -= cost;
        cell.structure = s;
        
        // Fun: Interaction Juice
        state.effects.push({type:'text', text:`-$${cost}`, x:x, y:y, life:30, color:'#e94560', vy: -0.2});
        
        // Placement "Pop" animation
        s.boostTimer = 5; // Use existing boost visual for a brief flash on place
        state.cameraShake = 2; // UX: Tactile feedback (thud) on placement
        state.structures.push(s);
    }
}

function getStructure(type, x, y, r) {
    switch(type) {
        case 'belt': return new Belt(x, y, r);
        case 'miner': return new Miner(x, y, r);
        case 'turret': return new Turret(x, y);
        case 'processor': return new Processor(x, y, r);
        case 'wall': return new Wall(x, y);
        case 'splitter': return new Splitter(x, y, r);
        case 'storage': return new Storage(x, y, r);
    }
    return null;
}
