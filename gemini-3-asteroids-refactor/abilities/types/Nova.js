import { BaseAbility } from '../BaseAbility.js';
import { Bullet } from '../../entities/Bullet.js';

export class Nova extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; this.angle = 0; }

    update(dt, context) {
        this.angle += 0.05;
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(30, 150 - (this.level * 10));
            const count = 12 + this.level * 2;
            for(let i=0; i<count; i++) {
                const a = this.angle + (Math.PI*2/count)*i;
                const b = new Bullet(this.player.x, this.player.y, Math.cos(a)*5, Math.sin(a)*5, this.player.damage*0.5, 99, 'player');
                if (this.player.piercing > 0) b.piercing = this.player.piercing;
                if (this.player.homing > 0) b.homing = this.player.homing;
                context.addBullet(b);
            }
        }
    }
}
