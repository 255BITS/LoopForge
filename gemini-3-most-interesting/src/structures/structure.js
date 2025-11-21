import { COORDS, BOOST_DURATION, MAX_HEAT } from '../config.js';

export class Structure {
    constructor(type, x, y, rotation) {
        this.type = type; this.x = x; this.y = y;
        this.rotation = rotation || 0; 
        this.hp = 100; this.maxHp = 100; this.active = true;
        this.boostTimer = 0; this.heat = 0;
    }
    tick(grid) { }
    
    tickHeat() {
        if (this.active) {
             if (this.boostTimer <= 0 && Math.random() < 0.05) this.heat = Math.min(MAX_HEAT, this.heat + 1);
             else if (this.heat > 0 && Math.random() < 0.05) this.heat = Math.max(0, this.heat - 1);
        }
    }
    
    onDestroy(state) { }
    
    interact(state) {
        if (this.type === 'miner' || this.type === 'processor' || this.type === 'turret' || this.type === 'nexus') {
            const heatBonus = this.heat > 50 ? 3.0 : 1.0;
            this.heat = 0;
            this.boostTimer = BOOST_DURATION;
            const txt = this.type === 'nexus' ? 'HEAL' : (heatBonus > 1.5 ? 'MAX BOOST!' : 'BOOST');
            state.effects.push({ type: 'text', text: txt, x: this.x, y: this.y - 0.5, color: heatBonus > 1.5 ? '#00ff00' : '#00e5ff', life: 40 });
            if (this.type === 'turret') this.cooldownTimer = 0; 
            return true;
        }
        return false;
    }
    takeDamage(amount) { if ((this.hp -= amount) <= 0) this.active = false; }
    getTargetCell(grid) { const dir = COORDS[this.rotation]; return grid.get(this.x + dir.x, this.y + dir.y); }
    canReceiveFrom(incRot) { if (this.type === 'processor' && incRot === (this.rotation + 2) % 4) return false; return true; }
}
