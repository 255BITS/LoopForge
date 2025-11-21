import { Structure } from './structure.js';
import { state } from '../state.js';

export class Miner extends Structure {
    constructor(x, y, rotation) {
        super('miner', x, y, rotation);
        this.miningProgress = 0;
        this.speed = 0.02;
    }

    tick(grid) {
        if (!this.active) return;
        const myCell = grid.get(this.x, this.y);
        if (!myCell || !myCell.resource) return;

        const boostMult = this.boostTimer > 0 ? 3.0 : 1.0;
        // Optimization: Don't tick boost timer every frame if not boosted, though check is cheap.
        if (this.boostTimer > 0) this.boostTimer--;
        this.tickHeat();

        const isJammed = this.miningProgress >= 1.0; 
        if (!isJammed) state.pollution += 0.05 * (1 + this.heat/40); 
        
        const miningMult = state.stats ? state.stats.miningMult : 1.0;
        const globalMult = (state.stats && state.stats.globalSpeedMult) || 1.0;

        if (!isJammed) this.miningProgress += this.speed * miningMult * boostMult * globalMult;
        if (this.miningProgress > 1.0) this.miningProgress = 1.0;
        if (!isJammed && this.miningProgress % 0.5 < 0.05 && this.active) state.effects.push({type: 'text', text: '.', x: this.x, y: this.y, color: '#aaa', life: 10});

        if (this.miningProgress >= 1.0) {
            const n = this.getTargetCell(grid);
            let placed = false;
            if (n && n.structure) {
                if (n.structure.type === 'nexus') { state.nexus.receiveItem({type: myCell.resource}); placed = true; }
                else if (n.structure.type === 'turret') { placed = n.structure.receiveItem({type: myCell.resource}); }
                else if (['belt','processor','splitter'].includes(n.structure.type)) {
                    if (!n.item || (n.structure.type === 'belt' && n.item.progress > 0.6)) { n.item = { type: myCell.resource, progress: 0.0 }; placed = true; }
                }
            } else if (n && !n.structure && !n.item) { 
                // Drop on floor so player sees it working immediately even without belts
                n.item = { type: myCell.resource, progress: 0.0 }; placed = true; 
            }
            if (placed) { this.miningProgress = 0; } else { this.miningProgress = 1.0; }
        }
    }
}
