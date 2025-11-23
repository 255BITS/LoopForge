import { BaseEnemy } from '../BaseEnemy.js';

export class Nullifier extends BaseEnemy {
    constructor(config) {
        super(config);
        this.fieldRadius = config.radius * 2.5;
    }

    behavior(context) {
        const { bullets, timeScale } = context;
        super.behavior(context);

        // Absorb player projectiles
        for (let i = 0; i < bullets.length; i++) {
            const b = bullets[i];
            if (b.team !== 'enemy') {
                const dx = b.x - this.x;
                const dy = b.y - this.y;
                const dist = Math.hypot(dx, dy);

                if (dist < this.fieldRadius) {
                    // Pull bullet in
                    const angle = Math.atan2(dy, dx);
                    b.x -= Math.cos(angle) * 6 * timeScale;
                    b.y -= Math.sin(angle) * 6 * timeScale;
                    
                    if (dist < this.radius + 5) {
                        b.life = 0;
                        this.hitFlash = 3; 
                    }
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath(); ctx.arc(0, 0, this.fieldRadius, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#444'; ctx.setLineDash([2,4]); ctx.stroke(); 
        ctx.restore();
        super.draw(ctx);
    }
}
