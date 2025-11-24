import { BaseAbility } from '../BaseAbility.js';

export class OrbitalLaser extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.timer = 0; 
        this.strikes = [];
    }
    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(90, 250 - (this.level * 25)); 
            let tx, ty;
            if (context.enemies.length > 0 && Math.random() < 0.7) {
                const e = context.enemies[Math.floor(Math.random() * context.enemies.length)];
                tx = e.x; ty = e.y;
            } else {
                const ang = Math.random() * Math.PI * 2; const dist = Math.random() * 200;
                tx = this.player.x + Math.cos(ang) * dist; ty = this.player.y + Math.sin(ang) * dist;
            }
            this.strikes.push({ x: tx, y: ty, radius: 60 + (this.level * 10), charge: 60, active: true });
        }
        for (let i = this.strikes.length - 1; i >= 0; i--) {
            const s = this.strikes[i];
            if (s.charge > 0) {
                s.charge--;
                if (s.charge === 0) {
                    context.setScreenShake(12); context.createExplosion(s.x, s.y, '#aff', 20);
                    for(const e of context.enemies) { if (Math.hypot(e.x - s.x, e.y - s.y) < s.radius) { e.hp -= this.player.damage * 10 + (this.level * 10); e.hitFlash = 15; } }
                    s.active = false;
                }
            } else { this.strikes.splice(i, 1); }
        }
    }
}
