import { Structure } from './structure.js';
import { state } from '../state.js';
import { COORDS } from '../config.js';
export class Belt extends Structure {
    constructor(x, y, rotation) {
        super('belt', x, y, rotation);
        this.speed = 0.10;
        this.capacity = 1.0;
    }

    tick(grid) {
        if (!this.active) return;
        const myCell = grid.get(this.x, this.y);
        
        if (myCell.item) {
            if (myCell.item.progress < this.capacity) {
                const spd = this.speed * state.stats.beltSpeedMult * (this.boostTimer > 0 ? 2.0 : 1);
                let blocked = false;
                if (myCell.item.progress > 0.90) { 
                     const target = this.getTargetCell(grid);
                     if (target) {
                         if (target.item && target.item.progress < 0.45) {
                             if (target.structure && target.structure.type === 'belt') {
                                 if (target.item.progress < 0.35) blocked = true; 
                             } else if (target.item.progress < 0.8) blocked = true; 
                         }
                     }
                }
                if (!blocked) myCell.item.progress += spd;
            }

            if (myCell.item.progress >= 1.0) {
                const target = this.getTargetCell(grid);
                
                let accepts = true;
                if (target && target.structure && !target.structure.canReceiveFrom(this.rotation)) accepts = false;

                if (accepts && target && (target.structure || (target.x === state.nexus.x && target.y === state.nexus.y))) {
                    if (target.structure && target.structure.type === 'nexus') {
                        state.nexus.receiveItem(myCell.item);
                        myCell.item = null;
                    } else if (target.structure && target.structure.type === 'turret') {
                        if (target.structure.receiveItem(myCell.item)) myCell.item = null;
                        else myCell.item.progress = 1.0;
                    } else if (target.structure && (target.structure.type === 'belt' || target.structure.type === 'processor')) {
                        if (!target.item || (target.structure.type === 'belt' && target.item.progress > 0.35)) {
                             target.item = myCell.item; target.item.progress = this.speed; myCell.item = null;
                        } else myCell.item.progress = 1.0; 
                    } else if (target.structure && target.structure.type === 'splitter') {
                        if (!target.item) { target.item = myCell.item; target.item.progress = 0; myCell.item = null; }
                        else myCell.item.progress = 1.0;
                    } else {
                        myCell.item.progress = 1.0; 
                    }
                } else if (target && !target.structure && !target.item) {
                     // Drop on floor
                     target.item = myCell.item; target.item.progress = 0; myCell.item = null;
                }
            }
        }
    }
}
