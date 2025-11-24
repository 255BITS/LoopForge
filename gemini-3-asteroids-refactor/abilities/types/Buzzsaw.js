import { BaseAbility } from '../BaseAbility.js';
import { Particle } from '../../effects/Particle.js';

export class Buzzsaw extends BaseAbility {
    constructor(player) { super(player); this.angle = 0; }

    update(dt, context) {
        this.angle -= 0.15;
        const sawRadius = 70 + (this.level * 10);
        const { enemies, particles } = context;

        for (let e of enemies) {
            const d = Math.hypot(this.player.x - e.x, this.player.y - e.y);
            if (Math.abs(d - sawRadius) < 20) {
                e.hp -= 2 + (this.level * 1);
                e.hitFlash = 1;
                if (Math.random() < 0.1) particles.push(new Particle(e.x, e.y, '#f00'));
            }
        }
    }
    draw(ctx) {}
}
