import { BaseAbility } from '../BaseAbility.js';
import { Bullet } from '../../entities/Bullet.js';

export class Mines extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; this.mines = []; }

    update(dt, context) {
        this.timer--;
        const maxMines = 5 + Math.floor(this.level * 1.5);
        if (this.timer <= 0) {
            this.timer = Math.max(40, 120 - (this.level * 10));
            if (this.mines.length < maxMines) { this.mines.push({ x: this.player.x,  y: this.player.y, r: 8, active: false, armTimer: 30 }); }
        }
        for (let i = this.mines.length - 1; i >= 0; i--) {
            let m = this.mines[i];
            if (m.armTimer > 0) m.armTimer--;
            else {
                m.active = true;
                if (this.player.homing > 0) {
                    let target = null, close = 150 + (this.player.homing * 50);
                    for(const e of context.enemies) { const d = Math.hypot(e.x - m.x, e.y - m.y); if (d < close) { close = d; target = e; } }
                    if (target) { const a = Math.atan2(target.y - m.y, target.x - m.x); m.x += Math.cos(a) * (1 + this.player.homing * 0.5); m.y += Math.sin(a) * (1 + this.player.homing * 0.5); }
                }
            }
            let detonated = false;
            if (m.active) {
                for (const e of context.enemies) {
                    if (Math.hypot(e.x - m.x, e.y - m.y) < 25 + e.radius) {
                        context.createExplosion(m.x, m.y, '#f80', 12);
                        for(const subE of context.enemies) { if(Math.hypot(subE.x - m.x, subE.y - m.y) < 70) { subE.hp -= this.player.damage * 4 + (this.level * 5); subE.hitFlash = 5; } }
                        detonated = true; break;
                    }
                }
            }
            if (detonated) this.mines.splice(i, 1);
        }
    }
}
