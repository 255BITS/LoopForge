import { BaseAbility } from '../BaseAbility.js';
import { Bullet } from '../../entities/Bullet.js';

export class Clone extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.clones = [];
        this.timer = 0;
    }

    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(60, 180 - (this.level * 15));
            this.clones.push({
                x: this.player.x,
                y: this.player.y,
                life: 180 + (this.level * 30),
                cooldown: 0
            });
        }

        for (let i = this.clones.length - 1; i >= 0; i--) {
            const c = this.clones[i];
            c.life--;
            c.cooldown--;

            if (c.cooldown <= 0) {
                c.cooldown = Math.max(15, this.player.fireRate * 3); // Synergizes with Rapid Fire
                let target = null, minDist = 350;
                for(const e of context.enemies) {
                    const d = Math.hypot(e.x - c.x, e.y - c.y);
                    if (d < minDist) { minDist = d; target = e; }
                }
                if (target) {
                    const angle = Math.atan2(target.y - c.y, target.x - c.x);
                    const b = new Bullet(c.x, c.y, Math.cos(angle)*10, Math.sin(angle)*10, this.player.damage * 0.5, 40, 'player');
                    // Synergy: Clones inherit bullet properties
                    b.piercing = this.player.piercing || 1;
                    b.homing = this.player.homing || 0;
                    b.ricochet = this.player.ricochet || 0;
                    context.addBullet(b);
                }
            }
            if (c.life <= 0) {
                // Synergy: Exploding Decoys (Mines/Explosive)
                if (this.player.blastRadius > 0) {
                    context.createExplosion(c.x, c.y, '#f00', 10);
                    for (const e of context.enemies) {
                        if (Math.hypot(e.x - c.x, e.y - c.y) < this.player.blastRadius) e.hp -= this.player.damage * 2;
                    }
                }
                this.clones.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.rotate(-this.player.angle);
        ctx.translate(-this.player.x, -this.player.y);
        ctx.fillStyle = 'rgba(100, 255, 255, 0.5)';
        for(const c of this.clones) { ctx.beginPath(); ctx.arc(c.x, c.y, 10, 0, Math.PI*2); ctx.fill(); }
        ctx.restore();
    }
}
