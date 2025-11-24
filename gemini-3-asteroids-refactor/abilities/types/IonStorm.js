import { BaseAbility } from '../BaseAbility.js';
import { LightningBolt } from '../../effects/LightningBolt.js';

export class IonStorm extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.timer = 0;
        this.charge = 0; 
    }
    update(dt, context) {
        const vel = Math.hypot(this.player.vx || 0, this.player.vy || 0);
        const generationRate = (this.player.speed || 5) * 0.5 + (this.level * 0.5);
        this.charge += generationRate;
        const threshold = 100;

        if (this.charge >= threshold) {
            this.charge = 0;
            let tx = null, ty = null;
            if (context.enemies.length > 0) {
                let minDist = 400 + (this.level * 50); let target = null;
                for (const e of context.enemies) { const d = Math.hypot(e.x - this.player.x, e.y - this.player.y); if (d < minDist) { minDist = d; target = e; } }
                if (target) { tx = target.x; ty = target.y; }
            }
            if (tx !== null) {
                context.addParticle(new LightningBolt(this.player.x, this.player.y - 20, tx, ty));
                context.sfx.playTone(400 + Math.random() * 200, 'sawtooth', 0.1, 0.1);
                for (const e of context.enemies) {
                    if (Math.hypot(e.x - tx, e.y - ty) < 80 + (this.level * 10)) { 
                        e.hp -= this.player.damage * 2.5 + (this.level * 5); e.hitFlash = 5; 
                        if (Math.random() < 0.5) context.addParticle(new LightningBolt(tx, ty, e.x, e.y));
                    }
                }
            }
        }
    }
}
