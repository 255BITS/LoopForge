import { BaseEnemy } from '../BaseEnemy.js';

export class Graviton extends BaseEnemy {
    constructor(config) { 
        super(config);
        this.fieldRadius = 250;
        this.pulse = 0;
    }

    behavior(context) {
        const { player, timeScale } = context;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        // Floating slowly
        this.x += Math.cos(angle) * (this.speed * 0.3) * timeScale;
        this.y += Math.sin(angle) * (this.speed * 0.3) * timeScale;
        
        this.pulse += timeScale * 0.1;
        this.angle += timeScale * 0.02;

        // Gravity Field: Pulls player in
        if(dist < this.fieldRadius) {
            const strength = (1 - dist / this.fieldRadius) * 2.5 * timeScale;
            player.x -= (dx / dist) * strength;
            player.y -= (dy / dist) * strength;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(50, 50, 255, ${0.2 + Math.sin(this.pulse)*0.15})`;
        ctx.lineWidth = 2;
        ctx.arc(0, 0, this.fieldRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        super.draw(ctx);
    }
}
