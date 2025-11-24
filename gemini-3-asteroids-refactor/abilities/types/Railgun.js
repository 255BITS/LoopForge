import { BaseAbility } from '../BaseAbility.js';
import { RailBeam } from '../../effects/RailBeam.js';

export class Railgun extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; }

    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(40, 180 - this.level * 20);
            const angle = this.player.angle;
            context.addBeam(new RailBeam(this.player.x, this.player.y, angle, this.player.damage * 3 + (this.level * 10)));
            context.sfx.shoot(); context.setScreenShake(8);
            this.player.vx -= Math.cos(angle) * 5; this.player.vy -= Math.sin(angle) * 5;
        }
    }
}
