import { BaseAbility } from '../BaseAbility.js';

export class OrbitalLaser extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.timer = 0; 
        this.strikes = [];
    }

    update(dt, context) {
        this.timer--;
        
        // Target Acquisition
        if (this.timer <= 0) {
            this.timer = Math.max(90, 250 - (this.level * 25)); // Cooldown
            
            // Find random target or random position near player
            let tx, ty;
            if (context.enemies.length > 0 && Math.random() < 0.7) {
                const e = context.enemies[Math.floor(Math.random() * context.enemies.length)];
                tx = e.x; ty = e.y;
            } else {
                const ang = Math.random() * Math.PI * 2;
                const dist = Math.random() * 200;
                tx = this.player.x + Math.cos(ang) * dist;
                ty = this.player.y + Math.sin(ang) * dist;
            }

            this.strikes.push({
                x: tx, y: ty,
                radius: 60 + (this.level * 10),
                charge: 60, // frames before blast
                active: true
            });
        }

        // Process Strikes
        for (let i = this.strikes.length - 1; i >= 0; i--) {
            const s = this.strikes[i];
            if (s.charge > 0) {
                s.charge--;
                if (s.charge === 0) {
                    // BOOM
                    context.setScreenShake(12);
                    context.createExplosion(s.x, s.y, '#aff', 20);
                    context.sfx.playTone(80, 'sawtooth', 0.5, 0.4); // Deep bass impact
                    
                    for(const e of context.enemies) {
                        if (Math.hypot(e.x - s.x, e.y - s.y) < s.radius) {
                            e.hp -= this.player.damage * 10 + (this.level * 10); // Massive damage
                            e.hitFlash = 15;
                        }
                    }
                    s.active = false;
                }
            } else {
                // Linger visual for a moment? Or just remove.
                this.strikes.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.rotate(-this.player.angle);
        ctx.translate(-this.player.x, -this.player.y);
        for (const s of this.strikes) {
            if (s.charge > 0) {
                // Warning reticle
                const progress = 1 - (s.charge / 60);
                ctx.strokeStyle = `rgba(255, 0, 0, 0.5)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
                ctx.stroke();
                
                // Shrinking circle indicating timing
                ctx.strokeStyle = '#fff';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius * (1-progress), 0, Math.PI*2);
                ctx.stroke();
            } else {
                // Blast visual (1 frame usually, but if logic allows lingering)
                ctx.fillStyle = 'rgba(200, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
                ctx.fill();
                
                // Vertical beam effect
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fillRect(s.x - 10, s.y - 1000, 20, 1000);
            }
        }
        ctx.restore();
    }
}
