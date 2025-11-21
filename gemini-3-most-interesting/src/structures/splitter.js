import { Structure } from './structure.js';
import { COORDS } from '../config.js';

export class Splitter extends Structure {
    constructor(x, y, rotation) {
        super('splitter', x, y, rotation);
        this.outIndex = 0;
    }

    tick(grid) {
        if (!this.active) return;
        const myCell = grid.get(this.x, this.y);
        
        if (myCell.item && myCell.item.progress >= 0.5) {
            const outputs = [ (this.rotation) % 4, (this.rotation + 3) % 4, (this.rotation + 1) % 4 ];
            for (let i = 0; i < 3; i++) {
                const tryIdx = (this.outIndex + i) % 3;
                const dir = COORDS[outputs[tryIdx]];
                const target = grid.get(this.x + dir.x, this.y + dir.y);
                let accepted = false;
                if (target && target.structure && target.structure.type === 'nexus') { target.structure.receiveItem(myCell.item); accepted = true; }
                else if (target && target.structure && ['turret','storage'].includes(target.structure.type)) { accepted = target.structure.receiveItem(myCell.item); }
                else if (target && !target.item) { target.item = myCell.item; target.item.progress = 0.0; accepted = true; }
                if (accepted) { myCell.item = null; this.outIndex = (tryIdx + 1) % 3; return; }
            }
        }
    }
}
