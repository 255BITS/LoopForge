import { Structure } from './structure.js';
import { state } from '../state.js';
import { RECIPES, COORDS } from '../config.js';
 
export class Processor extends Structure {
    constructor(x, y, rotation) {
        super('processor', x, y, rotation);
        this.processingTime = 0;
        this.maxProcessingTime = 40; 
        this.inputItem = null;
        this.outputBuffer = null;
    }

    tick(grid) {
        if (!this.active) return;
        const myCell = grid.get(this.x, this.y);
        const jammed = this.outputBuffer !== null;
        this.tickHeat();
        
        if (myCell.item && !this.inputItem && !jammed) {
            const recipe = RECIPES[myCell.item.type];
            if (recipe && myCell.item.progress > 0.2) {
                this.inputItem = myCell.item; myCell.item = null;
                const boostDiv = this.boostTimer > 0 ? 4 : 1;
                const globalDiv = state.stats.globalSpeedMult || 1;
                if (this.boostTimer > 0) this.boostTimer--;
                this.processingTime = Math.floor((this.maxProcessingTime / (1 + state.nexus.level*0.1)) / (boostDiv * globalDiv));
                this.currentMaxTime = this.processingTime; // UX: Store for visual progress bar
                state.pollution += 0.15 * (1 + this.heat/40);
            }
        }
        
        if (this.inputItem && !this.outputBuffer) {
            if (this.processingTime > 0) this.processingTime--;
            else { this.outputBuffer = { type: RECIPES[this.inputItem.type].out, progress: 0.0 }; this.inputItem = null; }
        }

        if (this.outputBuffer) {
             const dir = COORDS[this.rotation];
             const target = grid.get(this.x + dir.x, this.y + dir.y);
             if (target && target.structure) {
                    if (target.structure.type === 'turret') { if (target.structure.receiveItem({type: this.outputBuffer.type})) this.outputBuffer = null; } 
                    else if (target.structure.type === 'nexus') { state.nexus.receiveItem({ type: this.outputBuffer.type }); this.outputBuffer = null; } 
                    else if (target.structure.type === 'belt' && (!target.item || target.item.progress > 0.6)) { target.item = { type: this.outputBuffer.type, progress: 0.1 }; this.outputBuffer = null; }
             }
        }
    }
}
