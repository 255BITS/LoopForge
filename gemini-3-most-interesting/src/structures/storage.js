import { Structure } from './structure.js';
import { COORDS } from '../config.js';

export class Storage extends Structure {
    constructor(x, y, rotation) {
        super('storage', x, y, rotation);
        this.storedType = null;
        this.storedCount = 0;
        this.capacity = 50;
        this.cooldown = 0;
    }

    receiveItem(item) {
        if (this.storedCount === 0) { this.storedType = item.type; this.storedCount = 1; return true; }
        if (this.storedType === item.type && this.storedCount < this.capacity) { this.storedCount++; return true; }
        return false;
    }

    tick(grid) {
        if (this.storedCount > 0 && this.cooldown <= 0) {
             const dir = COORDS[this.rotation];
             const target = grid.get(this.x + dir.x, this.y + dir.y);
             if (target) {
                 let placed = false;
                 if (target.structure && target.structure.type === 'nexus') { target.structure.receiveItem({type:this.storedType}); placed=true; }
                 else if (!target.item && target.structure) { target.item = { type: this.storedType, progress: 0.0 }; placed=true; }
                 if (placed) {
                     this.storedCount--; this.cooldown = 10; if (this.storedCount===0) this.storedType=null;
                 }
             }
        }
        if (this.cooldown > 0) this.cooldown--;
    }
}
