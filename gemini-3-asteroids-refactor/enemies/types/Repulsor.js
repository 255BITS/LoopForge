import { BaseEnemy } from '../BaseEnemy.js';

export class Repulsor extends BaseEnemy {
    constructor(config) { 
        super(config);
        this.fieldRadius = 180;
        this.pulse = 0;
    }

    behavior(context) {
        const { player, timeScale } = context;
        super.behavior(context); // Chase logic
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        // Repulsion Field: Pushes player away
        if(dist < this.fieldRadius && dist > 10) {
            const strength = (1 - dist / this.fieldRadius) * 4.0 * timeScale;
            player.x += (dx / dist) * strength;
            player.y += (dy / dist) * strength;
        }
        this.pulse += timeScale * 0.2;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + Math.sin(this.pulse)*0.2})`;
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.arc(0, 0, this.fieldRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        super.draw(ctx);
    }
}
