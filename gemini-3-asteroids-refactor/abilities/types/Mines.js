import { BaseAbility } from '../BaseAbility.js';
import { Bullet } from '../../entities/Bullet.js';

export class Mines extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.timer = 0; 
        this.mines = []; 
    }

    update(dt, context) {
        this.timer--;
        const maxMines = 5 + Math.floor(this.level * 1.5);

        // Deploy Mine
        if (this.timer <= 0) {
            this.timer = Math.max(40, 120 - (this.level * 10));
            if (this.mines.length < maxMines) {
                this.mines.push({
                    x: this.player.x, 
                    y: this.player.y,
                    r: 8,
                    active: false,
                    armTimer: 30 // Delay before it can explode
                });
            }
        }

        // Update Mines
        for (let i = this.mines.length - 1; i >= 0; i--) {
            let m = this.mines[i];
            if (m.armTimer > 0) m.armTimer--;
            else {
                m.active = true;
                // Synergy: Magnetic Mines (Homing)
                if (this.player.homing > 0) {
                    let target = null, close = 150 + (this.player.homing * 50);
                    for(const e of context.enemies) {
                        const d = Math.hypot(e.x - m.x, e.y - m.y);
                        if (d < close) { close = d; target = e; }
                    }
                    if (target) {
                        const a = Math.atan2(target.y - m.y, target.x - m.x);
                        m.x += Math.cos(a) * (1 + this.player.homing * 0.5);
                        m.y += Math.sin(a) * (1 + this.player.homing * 0.5);
                    }
                }
            }

            // Check collision
            let detonated = false;
            if (m.active) {
                for (const e of context.enemies) {
                    if (Math.hypot(e.x - m.x, e.y - m.y) < 25 + e.radius) {
                        context.createExplosion(m.x, m.y, '#f80', 12);
                        context.sfx.playTone(150, 'square', 0.1, 0.2);
                        // AOE Damage
                        for(const subE of context.enemies) {
                            if(Math.hypot(subE.x - m.x, subE.y - m.y) < 70) {
                                subE.hp -= this.player.damage * 4 + (this.level * 5);
                                subE.hitFlash = 5;
                            }
                        }
                        // Synergy: Cluster Bomb
                        if (this.player.cluster > 0) {
                            const count = 3 + this.player.cluster;
                            for (let k = 0; k < count; k++) {
                                const a = (Math.PI * 2 / count) * k;
                                context.addBullet(new Bullet(m.x, m.y, Math.cos(a)*6, Math.sin(a)*6, this.player.damage * 0.3, 20, 'player'));
                            }
                        }
                        detonated = true;
                        break;
                    }
                }
            }
            if (detonated) this.mines.splice(i, 1);
        }
    }

    draw(ctx) {
        for (const m of this.mines) {
            ctx.save();
            ctx.translate(m.x, m.y);
            ctx.fillStyle = m.active ? `hsl(${Date.now() % 360}, 100%, 50%)` : '#555';
            ctx.beginPath();
            ctx.arc(0, 0, m.r, 0, Math.PI * 2);
            ctx.fill();
            // Blinking light
            if (m.active && Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        }
    }
}
