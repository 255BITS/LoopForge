import { BaseAbility } from '../BaseAbility.js';

export class Repulsor extends BaseAbility {
    constructor(player) { super(player); }

    update(dt, context) {
        const radius = 85 + (this.level * 15);
        for(const e of context.enemies) {
            const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
            if (dist < radius) {
                const angle = Math.atan2(e.y - this.player.y, e.x - this.player.x);
                const force = (radius - dist) / radius * 9;
                e.x += Math.cos(angle) * force;
                e.y += Math.sin(angle) * force;
            }
        }
    }

    draw(ctx) {
        const radius = 85 + (this.level * 15);
        ctx.strokeStyle = `rgba(150, 100, 255, ${0.1 + (Math.sin(Date.now() * 0.005)+1)*0.1})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.stroke();
    }
}
