import { BaseAbility } from '../BaseAbility.js';
import { Bullet } from '../../entities/Bullet.js';

export class Sentry extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; this.turrets = []; }

    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            // Spawn rate
            this.timer = Math.max(150, 700 - (this.level * 80)); 
            if (this.turrets.length < 2 + this.level) {
                this.turrets.push({
                    x: this.player.x, y: this.player.y,
                    life: 1200, // 20 seconds
                    cooldown: 0
                });
            }
        }

        for (let i = this.turrets.length - 1; i >= 0; i--) {
            let t = this.turrets[i];
            t.life--;
            t.cooldown--;
            
            if (t.cooldown <= 0) {
                t.cooldown = 45 - (this.level * 3);
                // Find target
                let target = null;
                let minDist = 300 + (this.level * 20);
                for(let e of context.enemies) {
                    let d = Math.hypot(e.x - t.x, e.y - t.y);
                    if(d < minDist) { minDist = d; target = e; }
                }
                if(target) {
                    const a = Math.atan2(target.y - t.y, target.x - t.x);
                    const b = new Bullet(t.x, t.y, Math.cos(a)*8, Math.sin(a)*8, this.player.damage*0.4, 80, 'player');
                    // Synergy: Turrets use heavy rounds if player has them
                    if (this.player.piercing > 0) b.piercing = this.player.piercing;
                    if (this.player.homing > 0) b.homing = this.player.homing;
                    // Synergy: Railgun Tech (Super Velocity)
                    if (this.player.damage > 150 || (this.player.piercing||0) > 4) {
                        b.color = '#a0f'; b.vx *= 1.5; b.vy *= 1.5; b.damage *= 1.5;
                        b.piercing = (b.piercing || 0) + 4;
                    }
                    context.addBullet(b);
                }
            }

            if (t.life <= 0) this.turrets.splice(i, 1);
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#ea0';
        for(let t of this.turrets) { ctx.fillRect(t.x-6, t.y-6, 12, 12); ctx.strokeRect(t.x-8, t.y-8, 16, 16); }
    }
}
