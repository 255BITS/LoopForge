import { BaseAbility } from '../BaseAbility.js';

export class Orbitals extends BaseAbility {
    constructor(player) { super(player); this.angle = 0; }

    update(dt, context) {
        this.angle += 0.12 + (this.level * 0.03);
        const { enemies } = context;
        const count = 2 + this.level;
        for (let e of enemies) {
            for(let i=0; i<count; i++) {
                const ang = this.angle + (i * (Math.PI * 2 / count));
                const ox = this.player.x + Math.cos(ang) * 60; const oy = this.player.y + Math.sin(ang) * 60;
                if (Math.hypot(ox - e.x, oy - e.y) < 15 + e.radius) { 
                    e.hp -= (15 + (this.player.damage * 0.4) + (this.level * 5)); e.hitFlash = 2; 
                    e.x += Math.cos(ang) * 2; e.y += Math.sin(ang) * 2;
                }
            }
        }
    }
}
