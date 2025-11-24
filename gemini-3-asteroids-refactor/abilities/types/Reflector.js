import { BaseAbility } from '../BaseAbility.js';

export class Reflector extends BaseAbility {
    constructor(player) { super(player); }

    update(dt, context) {
        const dx = context.input.x - this.player.x;
        const dy = context.input.y - this.player.y;
        const facingAngle = Math.atan2(dy, dx);
        const range = 90 + (this.level * 10);
        const arc = 1.2 + (this.level * 0.15);

        for (const e of context.enemies) {
            const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
            if (d < range) {
                const angleToEnemy = Math.atan2(e.y - this.player.y, e.x - this.player.x);
                let angleDiff = angleToEnemy - facingAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI*2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI*2;
                if (Math.abs(angleDiff) < arc / 2) {
                    const push = 8 + (this.level * 2);
                    e.x += Math.cos(angleToEnemy) * push; e.y += Math.sin(angleToEnemy) * push;
                    e.hp -= (e.maxHp ? e.maxHp * 0.02 : 1) + (this.level * 0.5); e.hitFlash = 2;
                }
            }
        }
        if (context.bullets) {
            for(const b of context.bullets) {
                if (b.team !== 'player') {
                     const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
                     if (dist < range) {
                        const angleToBullet = Math.atan2(b.y - this.player.y, b.x - this.player.x);
                        let angleDiff = angleToBullet - facingAngle;
                        while (angleDiff > Math.PI) angleDiff -= Math.PI*2;
                        while (angleDiff < -Math.PI) angleDiff += Math.PI*2;
                        if (Math.abs(angleDiff) < arc / 2) {
                            const aimX = context.input ? context.input.x : b.x - b.vx; const aimY = context.input ? context.input.y : b.y - b.vy;
                            const retAng = Math.atan2(aimY - b.y, aimX - b.x); const speed = Math.hypot(b.vx, b.vy) * 2.0;
                            b.vx = Math.cos(retAng) * speed; b.vy = Math.sin(retAng) * speed; b.life += 100; b.color = '#fff'; b.damage = (b.damage || 10) * 5;
                            context.sfx.playTone(1200, 'square', 0.05, 0.1); context.createExplosion(b.x, b.y, '#0ff', 3);
                        }
                     }
                }
            }
        }
    }
}
