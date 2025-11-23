import { BaseAbility } from '../BaseAbility.js';
import { Particle } from '../../effects/Particle.js';

export class Hive extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.drones = [];
        this.spawnTimer = 0;
    }

    update(dt, context) {
        // Replenish Drones
        const maxDrones = 3 + Math.floor(this.level * 2);
        this.spawnTimer--;
        if (this.spawnTimer <= 0 && this.drones.length < maxDrones) {
            this.spawnTimer = 60;
            this.drones.push({
                x: this.player.x, y: this.player.y,
                angle: Math.random() * Math.PI * 2,
                target: null,
                speed: 6 + Math.random() * 2
            });
        }

        // Update Drones
        for (let i = this.drones.length - 1; i >= 0; i--) {
            let d = this.drones[i];
            
            // Find Target
            if (!d.target || d.target.hp <= 0) {
                let close = 9999;
                d.target = null;
                for (const e of context.enemies) {
                    const dist = Math.hypot(e.x - d.x, e.y - d.y);
                    if (dist < 400 && dist < close) { close = dist; d.target = e; }
                }
            }

            // Move
            if (d.target) {
                const angle = Math.atan2(d.target.y - d.y, d.target.x - d.x);
                d.x += Math.cos(angle) * d.speed;
                d.y += Math.sin(angle) * d.speed;

                if (Math.hypot(d.target.x - d.x, d.target.y - d.y) < d.target.radius + 10) {
                    d.target.hp -= this.player.damage * 1.5;
                    d.target.hitFlash = 5;
                    context.addParticle(new Particle(d.x, d.y, '#fa0'));
                    this.drones.splice(i, 1);
                    continue;
                }
            } else {
                // Orbit player idle
                d.angle += 0.05;
                d.x += (this.player.x + Math.cos(d.angle) * 60 - d.x) * 0.1;
                d.y += (this.player.y + Math.sin(d.angle) * 60 - d.y) * 0.1;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.rotate(-this.player.angle);
        ctx.translate(-this.player.x, -this.player.y);
        ctx.fillStyle = '#fe0';
        for(const d of this.drones) {
            ctx.beginPath(); ctx.arc(d.x, d.y, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x-4, d.y-6); ctx.lineTo(d.x+4, d.y-6); ctx.fill();
        }
        ctx.restore();
    }
}
