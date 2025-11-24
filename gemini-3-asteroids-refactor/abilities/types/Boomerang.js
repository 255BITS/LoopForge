import { BaseAbility } from '../BaseAbility.js';
import { Particle } from '../../effects/Particle.js';

export class Boomerang extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; this.projectiles = []; }

    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            // GLAIVE: Throws a bouncing energy disc
            this.timer = Math.max(50, 110 - (this.level * 8));
            const count = 1 + this.level;
            // Find initial target
            let target = null, dist = 600;
            for(const e of context.enemies) {const d=Math.hypot(e.x-this.player.x,e.y-this.player.y); if(d<dist){dist=d;target=e;}}
            
            let baseAngle = target ? Math.atan2(target.y - this.player.y, target.x - this.player.x) : Math.random()*Math.PI*2;

            for(let i=0; i<count; i++) {
                const angle = baseAngle + (i * 0.2);
                this.projectiles.push({
                    x: this.player.x, y: this.player.y,
                    vx: Math.cos(angle) * 15,
                    vy: Math.sin(angle) * 15,
                    life: 180,
                    bounces: 3 + this.level,
                    hitList: [] // IDs of hit enemies to avoid instant re-hit
                });
            }
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx; p.y += p.vy;
            p.life--;
            
            // Visual Trail
            if(Math.random()<0.4) context.addParticle(new Particle(p.x, p.y, '#d966ff', 2));
            
            // Bounce Logic
            for (const e of context.enemies) {
                if (p.hitList.includes(e)) continue;
                if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + 15) {
                    e.hp -= this.player.damage * 0.8 + (this.level * 5);
                    e.hitFlash = 5;
                    context.createExplosion(e.x, e.y, '#d966ff', 3);
                    p.bounces--; p.hitList.push(e); if(p.hitList.length > 5) p.hitList.shift();
                    if (p.bounces <= 0) { p.life = 0; } else {
                        let next = null, closest = 400;
                        for (const ne of context.enemies) { if (ne === e || p.hitList.includes(ne)) continue; const d = Math.hypot(ne.x - p.x, ne.y - p.y); if (d < closest) { closest = d; next = ne; } }
                        if (next) { const ang = Math.atan2(next.y - p.y, next.x - p.x); p.vx = Math.cos(ang) * 16; p.vy = Math.sin(ang) * 16; } else { p.vx *= -1; p.vy = (Math.random()-0.5)*30; }
                    }
                    break;
                }
            }
            if (p.life <= 0) this.projectiles.splice(i, 1);
        }
    }
    draw(ctx) { 
        ctx.fillStyle = '#d966ff'; for(let p of this.projectiles) { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2); ctx.fill(); }
    }
}
