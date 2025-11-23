import { BaseAbility } from '../BaseAbility.js';
import { Particle } from '../../effects/Particle.js';

export class SeekerSwarm extends BaseAbility {
    constructor(player) {
        super(player);
        this.missiles = [];
        this.timer = 0;
    }

    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(30, 70 - this.level * 5);
            const count = 2 + Math.floor(this.level / 2);
            for(let i=0; i<count; i++) {
                this.missiles.push({
                    x: this.player.x, y: this.player.y,
                    vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                    life: 180, speed: 8 + this.level
                });
            }
        }

        for (let i = this.missiles.length - 1; i >= 0; i--) {
            let m = this.missiles[i];
            m.life--;
            m.x += m.vx; m.y += m.vy;

            let target = null, minDist = 400;
            for (const e of context.enemies) {
                const d = Math.hypot(e.x - m.x, e.y - m.y);
                if (d < minDist) { minDist = d; target = e; }
            }

            if (target) {
                const angle = Math.atan2(target.y - m.y, target.x - m.x);
                m.vx += Math.cos(angle) * 0.8; m.vy += Math.sin(angle) * 0.8;
                const speed = Math.hypot(m.vx, m.vy);
                if (speed > m.speed) { m.vx = (m.vx/speed)*m.speed; m.vy = (m.vy/speed)*m.speed; }
                
                if (minDist < target.radius + 10) {
                    target.hp -= this.player.damage * 0.6;
                    target.hitFlash = 2;
                    context.addParticle(new Particle(m.x, m.y, '#0f0'));
                    this.missiles.splice(i, 1);
                    continue;
                }
            }
            if (m.life <= 0) this.missiles.splice(i, 1);
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#0f0';
        for (const m of this.missiles) {
            ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(m.x - m.vx, m.y - m.vy, 1.5, 0, Math.PI*2); ctx.fill();
        }
    }
}
