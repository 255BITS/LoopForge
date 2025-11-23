import { BaseAbility } from '../BaseAbility.js';

export class Orbitals extends BaseAbility {
    constructor(player) { super(player); this.angle = 0; }

    update(dt, context) {
        this.angle += 0.05;
        const { enemies } = context;
        if (this.level <= 0) return;

        for (let e of enemies) {
            for(let i=0; i<this.level; i++) {
                const ang = this.angle + (i * (Math.PI * 2 / this.level));
                const ox = this.player.x + Math.cos(ang) * 50;
                const oy = this.player.y + Math.sin(ang) * 50;
                if (Math.hypot(ox - e.x, oy - e.y) < 8 + e.radius) { e.hp -= 2; e.hitFlash = 1; }
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#0ff';
        for(let i=0; i<this.level; i++) {
            const ang = this.angle + (i * (Math.PI*2/this.level));
            ctx.beginPath(); ctx.arc(Math.cos(ang)*50, Math.sin(ang)*50, 6, 0, Math.PI*2); ctx.fill();
        }
    }
}
