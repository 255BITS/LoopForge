import { BaseAbility } from '../BaseAbility.js';

export class Reflector extends BaseAbility {
    constructor(player) { super(player); }

    update(dt, context) {
        // Determine facing direction based on mouse input
        const dx = context.input.x - this.player.x;
        const dy = context.input.y - this.player.y;
        const facingAngle = Math.atan2(dy, dx);
        
        const range = 90 + (this.level * 10);
        const arc = 1.2 + (this.level * 0.15); // Widen arc with level

        // Deflect Enemies
        for (const e of context.enemies) {
            const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
            if (d < range) {
                const angleToEnemy = Math.atan2(e.y - this.player.y, e.x - this.player.x);
                let angleDiff = angleToEnemy - facingAngle;
                // Normalize angle
                while (angleDiff > Math.PI) angleDiff -= Math.PI*2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI*2;

                if (Math.abs(angleDiff) < arc / 2) {
                    // Push back hard
                    const push = 8 + (this.level * 2);
                    e.x += Math.cos(angleToEnemy) * push;
                    e.y += Math.sin(angleToEnemy) * push;
                    e.hp -= (e.maxHp ? e.maxHp * 0.02 : 1) + (this.level * 0.5); // % Health damage on bash
                    e.hitFlash = 2;
                }
            }
        }

        // Deflect Projectiles
        if (context.bullets) {
            for (const b of context.bullets) {
                if (b.team === 'enemy') {
                    const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
                    if (dist < range) {
                        const angleToBullet = Math.atan2(b.y - this.player.y, b.x - this.player.x);
                        let angleDiff = angleToBullet - facingAngle;
                        while (angleDiff > Math.PI) angleDiff -= Math.PI*2;
                        while (angleDiff < -Math.PI) angleDiff += Math.PI*2;

                        if (Math.abs(angleDiff) < arc / 2) {
                            b.vx *= -2.0; b.vy *= -2.0; // Return to sender with speed boost
                            b.team = 'player'; // Convert allegiance
                            b.life = 200; // Refresh duration
                            context.sfx.playTone(800, 'square', 0.05, 0.1);
                        }
                    }
                }
            }
        }
    }

    draw(ctx) {
        ctx.strokeStyle = `rgba(100, 200, 255, 0.5)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI*2);
        ctx.stroke();
    }
}
