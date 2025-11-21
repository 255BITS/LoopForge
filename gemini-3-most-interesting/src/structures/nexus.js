import { Structure } from './structure.js';
import { state } from '../state.js';
 
export class Nexus extends Structure {
    constructor(x, y) {
        super('nexus', x, y, 0);
        this.hp = 500; this.maxHp = 500;
        this.level = 1;
        this.xp = 0; this.xpToNext = 100;
        this.regenTimer = 0;
        this.synergyTimer = 0;
        this.recentItems = new Map();
    }

    tick(grid) {
        if (this.hp < this.maxHp) {
            this.regenTimer += (1 + this.level * 0.2);
            if (this.regenTimer > 60) { this.hp += Math.floor(this.level/2) + 1; this.regenTimer = 0; }
        }
        if (state.framenum % 30 === 0) {
             const rSq = 20 * 20; 
             state.structures.forEach(s => { if (s.hp < s.maxHp && (s.x - this.x)**2 + (s.y - this.y)**2 < rSq) s.hp += 5; });
        }
        if (this.synergyTimer > 0) { this.synergyTimer--; if (this.synergyTimer === 0) this.recentItems.clear(); }
    }
    
    heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }

    receiveItem(item) {
        const c = this.recentItems.get(item.type) || 0;
        this.recentItems.set(item.type, Math.min(5, c+1));
        this.synergyTimer = 300; 
        const diversity = Array.from(this.recentItems.keys()).length;
        const synergyMult = diversity > 1 ? Math.pow(2.5, diversity - 1) : 1.0;
        let val = 0, xp = 0;
        if (item.type === 'ammo') { val = 25; xp = 8; } 
        else if (item.type === 'battery') { this.heal(50); xp = 20; val = 60; state.stats.globalSpeedMult = 1.6; if (state.framenum % 10 === 0) state.effects.push({type:'text', text:'OVERDRIVE', x:this.x, y:this.y-3, color:'#d602ee', life:60}); } 
        else if (item.type === 'alloy') { val = 8; xp = 3; } 
        else if (item.type === 'plate') { val = 12; xp = 5; } 
        else if (item.type === 'redium') { val = 1; xp = 0.8; } 
        else if (item.type === 'bluestone') { xp = 1; }

        state.currency += Math.floor(val * synergyMult);
        if (this.xp < this.xpToNext) this.addXp(xp * synergyMult);
        if (synergyMult > 1.0 && Math.random() > 0.9) state.effects.push({ type: 'text', text: `${synergyMult.toFixed(1)}x SYN!`, x: this.x, y: this.y - 2, color: '#ffd700', life: 40 });
    }

    addXp(amount) { this.xp += amount; if (this.xp >= this.xpToNext) this.levelUp(); }
    levelUp() {
        this.level++; this.xp = 0; this.xpToNext = Math.floor(this.xpToNext * 1.15 + 100);
        this.maxHp += 200; this.hp = this.maxHp;
        state.cameraShake = 12; // Fun: Visceral feedback on level up
        state.stats.damageMult += 0.15; state.stats.beltSpeedMult += 0.05;
        state.effects.push({type: 'text', text: `LEVEL UP! (L${this.level})`, x: this.x, y: this.y - 1, life: 120, color: '#ffff00'});
    }

    interact(state) { super.interact(state); if (this.xp >= this.xpToNext) { this.levelUp(); return true; } return false; }
}
