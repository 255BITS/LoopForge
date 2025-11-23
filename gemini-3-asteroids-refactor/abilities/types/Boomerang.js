import { BaseAbility } from '../BaseAbility.js';

export class Boomerang extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; this.projectiles = []; }

    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(40, 100 - (this.level * 10));
            const count = 1 + this.level;
            // Fan out based on generic direction or random
            let baseAngle = Math.random() * Math.PI * 2;
            if (context.input) baseAngle = Math.atan2(context.input.y - this.player.y, context.input.x - this.player.x);
            
            for(let i=0; i<count; i++) {
                const angle = baseAngle - 0.5 + (Math.random() * 1.0) + ((i%2==0 ? 1 : -1) * 0.2 * i);
                this.projectiles.push({
                    x: this.player.x, y: this.player.y,
                    vx: Math.cos(angle) * 15,
                    vy: Math.sin(angle) * 15,
                    state: 0, // 0: out, 1: return
                    life: 300
                });
            }
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx; p.y += p.vy;
            p.life--;

            if (p.state === 0) {
                p.vx *= 0.93; p.vy *= 0.93;
                if (Math.hypot(p.vx, p.vy) < 1.5) p.state = 1;
            } else {
                // Homing return
                const dx = this.player.x - p.x;
                const dy = this.player.y - p.y;
                const d = Math.hypot(dx, dy);
                const speed = 14 + this.level;
                p.vx = (dx/d) * speed; p.vy = (dy/d) * speed;
                if (d < 25) { this.projectiles.splice(i, 1); continue; }
            }

            for (const e of context.enemies) {
                if (Math.abs(e.x - p.x) < 30 && Math.abs(e.y - p.y) < 30) {
                     e.hp -= this.player.damage * 0.5;
                     e.hitFlash = 1;
                }
            }
            if (p.life <= 0) this.projectiles.splice(i, 1);
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#5f5';
        for (const p of this.projectiles) {
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Date.now()/30);
            ctx.beginPath(); ctx.moveTo(0,-12); ctx.lineTo(8,4); ctx.lineTo(0,0); ctx.lineTo(-8,4); ctx.fill(); ctx.restore();
        }
    }
}
