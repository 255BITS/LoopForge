import { BaseAbility } from '../BaseAbility.js';
import { LightningBolt } from '../../effects/LightningBolt.js';

export class IonStorm extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; }

    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(10, 40 - (this.level * 4));
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 250;
            const tx = this.player.x + Math.cos(angle) * dist;
            const ty = this.player.y + Math.sin(angle) * dist;
            
            context.addParticle(new LightningBolt(tx, ty - 300, tx, ty));
            context.sfx.playTone(300 + Math.random() * 500, 'sawtooth', 0.05, 0.05);

            for (const e of context.enemies) {
                if (Math.hypot(e.x - tx, e.y - ty) < 50) {
                    e.hp -= this.player.damage * 1.5;
                    e.hitFlash = 5;
                }
            }
        }
    }
}
