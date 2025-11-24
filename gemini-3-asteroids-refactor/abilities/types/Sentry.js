import { BaseAbility } from '../BaseAbility.js';
import { Bullet } from '../../entities/Bullet.js';

export class Sentry extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; this.turrets = []; }

    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(200, 600 - (this.level * 60)); 
            if (this.turrets.length < 2 + this.level) {
                this.turrets.push({ x: this.player.x, y: this.player.y, life: 1200, cooldown: 0 });
            }
        }

        for (let i = this.turrets.length - 1; i >= 0; i--) {
            let t = this.turrets[i]; t.life--; t.cooldown--;
            const angle = (Date.now() * 0.001) + (i * (Math.PI * 2 / this.turrets.length));
            const homeX = this.player.x + Math.cos(angle) * 60; const homeY = this.player.y + Math.sin(angle) * 60;
            const dx = homeX - t.x; const dy = homeY - t.y; const dist = Math.hypot(dx, dy);

            let target = null; let minDist = 350 + (this.level * 40);
            for(let e of context.enemies) { let d = Math.hypot(e.x - t.x, e.y - t.y); if(d < minDist) { minDist = d; target = e; } }

            if (target) {
                const tx = target.x - t.x; const ty = target.y - t.y; const td = Math.hypot(tx, ty);
                const ang = Math.atan2(ty, tx);
                if (td > 120) {
                    t.x += Math.cos(ang) * 9; t.y += Math.sin(ang) * 9;
                } else {
                    t.x += Math.cos(ang + Math.PI/2) * 6; t.y += Math.sin(ang + Math.PI/2) * 6;
                }
                if (t.cooldown <= 0) {
                    t.cooldown = Math.max(8, 25 - this.level * 2);
                    const spread = (Math.random()-0.5)*0.2;
                    const b = new Bullet(t.x, t.y, Math.cos(ang+spread)*12, Math.sin(ang+spread)*12, this.player.damage*0.6, 60, 'player');
                    b.color = '#ff0'; context.addBullet(b);
                }
            } else {
                if (dist > 10) {
                    const ang = Math.atan2(dy, dx);
                    const speed = dist > 300 ? 15 : 8;
                    t.x += Math.cos(ang) * speed;
                    t.y += Math.sin(ang) * speed;
                }
            }
            if (t.life <= 0) this.turrets.splice(i, 1);
        }
    }
}
