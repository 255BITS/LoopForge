import { BaseAbility } from '../BaseAbility.js';
import { LightningBolt } from '../../effects/LightningBolt.js';

export class Tesla extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; }

    update(dt, context) {
        const speedMultiplier = this.player.speed ? (this.player.speed / 4) : 1;
        this.timer -= 1 * speedMultiplier;
        if (this.timer <= 0) {
            this.timer = Math.max(10, 60 - this.level * 5);
            const { enemies } = context;
            const arcs = 1 + Math.floor((this.player.bulletCount || 1) / 3);
            const range = 250 * (this.player.spread > 0.3 ? 1.5 : 1.0); 
            const targets = enemies.filter(e => Math.hypot(e.x - this.player.x, e.y - this.player.y) < range).slice(0, arcs);
            for (const nearest of targets) { context.addParticle(new LightningBolt(this.player.x, this.player.y, nearest.x, nearest.y)); }
        }
    }
}
