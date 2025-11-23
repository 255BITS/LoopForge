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

    draw(ctx) {
        ctx.fillStyle = '#f00';
        const sawRadius = 70 + (this.level * 10);
        for(let i=0; i<this.level; i++) {
            const ang = this.angle + (i * (Math.PI*2/this.level));
            const sx = Math.cos(ang) * sawRadius;
            const sy = Math.sin(ang) * sawRadius;
            ctx.save(); ctx.translate(sx, sy); ctx.rotate(this.angle * 3);
            ctx.beginPath();
            for(let j=0; j<8; j++) {
                const a = (Math.PI*2/8)*j;
                ctx.lineTo(Math.cos(a)*12, Math.sin(a)*12);
                ctx.lineTo(Math.cos(a+0.4)*6, Math.sin(a+0.4)*6);
            }
            ctx.fill(); ctx.restore();
        }
    }
}
