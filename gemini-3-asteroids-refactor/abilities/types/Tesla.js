import { BaseAbility } from '../BaseAbility.js';
import { LightningBolt } from '../../effects/LightningBolt.js';

export class Tesla extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; }

    update(dt, context) {
        // Synergy: Static buildup based on movement speed
        const speedMultiplier = this.player.speed ? (this.player.speed / 4) : 1;
        this.timer -= 1 * speedMultiplier;
        if (this.timer <= 0) {
            this.timer = Math.max(10, 60 - this.level * 5);
            const { enemies } = context;
            
            // Synergy: Multishot increases arc count
            const arcs = 1 + Math.floor((this.player.bulletCount || 1) / 3);
            const range = 250 * (this.player.spread > 0.3 ? 1.5 : 1.0); // Wide spread = Wide Arcs

            const targets = [];
            
            for (const enemy of enemies) {
                const d = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
                if (d < range) {
                    targets.push({ e: enemy, d: d });
                }
            }

            // Sort by distance and take closest 'arcs' amount
            targets.sort((a, b) => a.d - b.d);
            const hitList = targets.slice(0, arcs);

            for (const item of hitList) {
                const nearest = item.e;
                nearest.hp -= this.player.damage * 0.8;
                nearest.hitFlash = 10;
                context.addParticle(new LightningBolt(this.player.x, this.player.y, nearest.x, nearest.y));
                context.sfx.playTone(800 + Math.random() * 200, 'sawtooth', 0.1, 0.05);
            }
        }
    }
}
