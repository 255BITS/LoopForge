import { Structure } from './structure.js';
import { state } from '../state.js';

export class Turret extends Structure {
    constructor(x, y) {
        super('turret', x, y, 0);
        this.range = 4;
        this.cooldownTimer = 0;
        this.baseFireRate = 20; 
        this.ammo = 10; this.maxAmmo = 200;
        this.damageBuff = 1.0; this.fireRateBuff = 1.0;
        this.laserColor = '#ffff00'; this.ammoEffect = 'none';
    }

    interact(state) {
        const amount = 2; 
        this.ammo = Math.min(this.maxAmmo + 20, this.ammo + amount); 
        this.cooldownTimer = 0; 
        this.fireRateBuff = Math.max(this.fireRateBuff, 5.0); 
        state.effects.push({ type: 'text', text: 'OVERCHARGE!', x: this.x, y: this.y - 1, color: '#00e5ff', life: 45 });
        // Fun: Sound effect trigger would go here
        return super.interact(state); 
    }

    onDestroy(state) {
        if (this.ammo > 5) {
            const radius = this.ammo > 25 ? 2.5 : 1.5;
            state.effects.push({ type: 'explosion', x: this.x, y: this.y, radius: radius, life: 20 });
            state.cameraShake = 8; // Big shake on turret death
            const rSq = radius * radius;
            state.structures.forEach(s => { if (s !== this && (s.x-this.x)**2 + (s.y-this.y)**2 < rSq) s.takeDamage(this.ammo * 10); });
            state.enemies.forEach(e => { if ((e.x-this.x)**2 + (e.y-this.y)**2 < rSq) e.hp -= this.ammo * 10; });
        }
    }

    receiveItem(item) {
        if (this.ammo >= this.maxAmmo) return false;
        let amount = 0, dmgMod = 1.0, frMod = 1.0, newColor = this.laserColor, newEffect = this.ammoEffect;
        if (item.type === 'redium') { amount = 5; dmgMod = 0.2; newColor='#ff6b6b'; newEffect='none'; }
        else if (item.type === 'alloy') { amount = 10; dmgMod = 1.0; newColor='#ffd700'; newEffect='none'; }
        else if (item.type === 'ammo') { amount = 25; dmgMod = 1.5; newColor='#ff9100'; newEffect='splash'; }
        else if (item.type === 'plate') { amount = 10; dmgMod = 0.5; frMod = 0.8; newColor='#00fff5'; newEffect='slow'; }
        else if (item.type === 'battery') { amount = 40; dmgMod = 3.0; frMod = 2.0; newColor='#d602ee'; newEffect='none'; }
        
        if (amount > 0) {
            this.damageBuff = dmgMod; this.fireRateBuff = frMod; this.laserColor = newColor; 
            if (amount > 2) this.ammoEffect = newEffect;
            this.ammo = Math.min(this.maxAmmo, this.ammo + amount); return true;
        }
        return false;
    }

    tick(grid) {
        if (!this.active) return;
        if (this.cooldownTimer > 0) this.cooldownTimer--;
        if (this.cooldownTimer > 0 || this.ammo < 1 || state.enemies.length === 0) return;

        const target = state.enemies.reduce((prev, curr) => {
            const d = (curr.x - this.x)**2 + (curr.y - this.y)**2;
            if (d > this.range**2) return prev;
            return (!prev || d < (prev.x - this.x)**2 + (prev.y - this.y)**2) ? curr : prev;
        }, null);

        if (target) {
            const finalDmg = 8 * state.stats.damageMult * this.damageBuff;
            const finalRate = Math.max(4, this.baseFireRate / this.fireRateBuff);
            state.pollution += 0.2; target.hp -= finalDmg; 
            if (this.ammoEffect === 'splash') {
                state.enemies.forEach(e => { if (e !== target && (e.x - target.x)**2 + (e.y - target.y)**2 < 3.0) e.hp -= finalDmg * 0.6; });
                state.effects.push({type:'explosion', x:target.x, y:target.y, radius: 1.0, life: 10, color: '#ff9100'});
            } else if (this.ammoEffect === 'slow') target.freezeTimer = 90; 
            this.ammo = Math.max(0, this.ammo - 1); if (this.ammo === 0) this.ammoEffect = 'none';
            this.cooldownTimer = finalRate;
            state.effects.push({ type: 'laser', x1: this.x, y1: this.y, x2: target.x, y2: target.y, life: 5, color: this.laserColor });
        }
    }
}
