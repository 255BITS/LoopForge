import { BaseAbility } from '../BaseAbility.js';
import { Particle } from '../../effects/Particle.js';

export class SporeCloud extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.timer = 0; 
        this.clouds = [];
    }

    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(60, 150 - (this.level * 15));
            this.clouds.push({ x: this.player.x, y: this.player.y, life: 300, radius: 10 });
        }

        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const c = this.clouds[i]; c.life--;
            const maxRadius = 120 + (this.level * 20);
            if (c.radius < maxRadius) c.radius += 2.0;
            
            if (Math.random() < 0.2) {
                const ang = Math.random() * Math.PI * 2; const r = Math.random() * c.radius;
                context.addParticle(new Particle(c.x + Math.cos(ang)*r, c.y + Math.sin(ang)*r, '#5f5', 1));
            }
            for (const e of context.enemies) {
                if (Math.hypot(e.x - c.x, e.y - c.y) < c.radius) {
                    e.hp -= 0.1 + (this.level * 0.05); e.color = '#5f5'; 
                    if (!e.defenseDebuff) { e.oldDefense = e.defense || 0; e.defenseDebuff = true; }
                    if (e.hitFlash > 0) e.hp -= 1.0; 
                }
            }
            if (c.life <= 0) this.clouds.splice(i, 1);
        }
    }
}
