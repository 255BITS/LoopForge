import { BaseAbility } from '../BaseAbility.js';
import { LightningBolt } from '../../effects/LightningBolt.js';

export class Tesla extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; }

    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(10, 60 - this.level * 5);
            const { enemies } = context;
            
            let nearest = null;
            let minDist = 250;
            for (const enemy of enemies) {
                const d = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
                if (d < minDist) { minDist = d; nearest = enemy; }
            }
            if (nearest) {
                nearest.hp -= this.player.damage * 0.8;
                nearest.hitFlash = 10;
                context.addParticle(new LightningBolt(this.player.x, this.player.y, nearest.x, nearest.y));
                context.sfx.playTone(800 + Math.random() * 200, 'sawtooth', 0.1, 0.05);
            }
        }
    }
}
