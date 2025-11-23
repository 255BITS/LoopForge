import { BaseEnemy } from '../BaseEnemy.js';

export class Reflector extends BaseEnemy {
    constructor(config) {
        super(config);
        this.shieldRadius = this.radius + 12;
    }

    behavior(context) {
        const { player, bullets, timeScale } = context;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        
        // Slowly rotate to face player
        let angleDiff = angle - this.angle;
        while (angleDiff <= -Math.PI) angleDiff += Math.PI*2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI*2;
        
        this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), 0.05 * timeScale);
        this.x += Math.cos(this.angle) * this.speed * timeScale;
        this.y += Math.sin(this.angle) * this.speed * timeScale;

        // Shield interaction
        for (let b of bullets) {
            if (b.team === 'player') {
                const dist = Math.hypot(b.x - this.x, b.y - this.y);
                if (dist < this.shieldRadius + 5 && dist > this.radius) {
                    const bAngle = Math.atan2(b.y - this.y, b.x - this.x);
                    // Check if bullet is hitting the front arc (120 degrees)
                    let impactDiff = bAngle - this.angle;
                    while (impactDiff <= -Math.PI) impactDiff += Math.PI*2;
                    while (impactDiff > Math.PI) impactDiff -= Math.PI*2;

                    if (Math.abs(impactDiff) < Math.PI / 3) {
                        // Deflect and turn hostile
                        b.vx *= -1; b.vy *= -1;
                        b.team = 'enemy'; b.color = '#fff';
                        b.x += b.vx * 3; b.y += b.vy * 3;
                        this.hitFlash = 4;
                    }
                }
            }
        }
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = '#afe';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.shieldRadius, -Math.PI/3, Math.PI/3);
        ctx.stroke();
        ctx.restore();
    }
}
