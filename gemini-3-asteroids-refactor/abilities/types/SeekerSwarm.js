import { BaseAbility } from '../BaseAbility.js';
import { Particle } from '../../effects/Particle.js';

export class SeekerSwarm extends BaseAbility {
    constructor(player) {
        super(player); this.missiles = []; this.timer = 0;
    }

    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(30, 70 - this.level * 5);
            const count = 2 + Math.floor(this.level / 2);
            for(let i=0; i<count; i++) {
                this.missiles.push({ x: this.player.x, y: this.player.y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 180, speed: 8 + this.level });
            }
        }
        for (let i = this.missiles.length - 1; i >= 0; i--) { let m = this.missiles[i]; m.life--; m.x += m.vx; m.y += m.vy; if (m.life <= 0) this.missiles.splice(i, 1); }
    }
}
