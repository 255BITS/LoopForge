import { BaseEnemy } from '../BaseEnemy.js';

export class Warden extends BaseEnemy {
    constructor(config) {
        super(config);
        this.range = 220;
        this.pulse = 0;
    }

    behavior(context) {
        const { player, enemies, timeScale } = context;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        // Try to maintain specific range
        if (dist < 350) {
            this.x -= Math.cos(angle) * this.speed * timeScale;
            this.y -= Math.sin(angle) * this.speed * timeScale;
        } else {
            this.x += Math.cos(angle) * this.speed * timeScale;
            this.y += Math.sin(angle) * this.speed * timeScale;
        }

        this.pulse += 0.1 * timeScale;

        // Speed Buff Aura
        enemies.forEach(e => {
            if (e === this) return;
            if (Math.hypot(e.x - this.x, e.y - this.y) < this.range) {
                e.x += Math.cos(e.angle) * 1.0 * timeScale; // Bonus velocity
                e.y += Math.sin(e.angle) * 1.0 * timeScale;
            }
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = `rgba(80, 255, 80, ${0.1 + Math.sin(this.pulse)*0.05})`;
        ctx.beginPath(); ctx.arc(0, 0, this.range, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#4f4'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.restore();
        super.draw(ctx);
    }
}
