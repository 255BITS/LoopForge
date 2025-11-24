import { BaseAbility } from '../BaseAbility.js';
import { Bullet } from '../../entities/Bullet.js';

export class Inferno extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.timer = 0; 
    }
    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = 4; 
            const dx = context.input.x - this.player.x; const dy = context.input.y - this.player.y;
            const baseAngle = Math.atan2(dy, dx);
            const spread = 0.3 + (this.level * 0.05);
            const count = 1 + Math.floor(this.level / 3);
            for(let i = 0; i < count; i++) {
                const angle = baseAngle + (Math.random() - 0.5) * spread;
                const speed = 8 + Math.random() * 4;
                const b = new Bullet(this.player.x + Math.cos(angle) * 20, this.player.y + Math.sin(angle) * 20, 
                    Math.cos(angle) * speed, Math.sin(angle) * speed, this.player.damage * 0.2, 25, 'player');
                context.addBullet(b);
            }
        }
    }
}
