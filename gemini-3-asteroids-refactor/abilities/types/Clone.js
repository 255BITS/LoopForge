import { BaseAbility } from '../BaseAbility.js';
import { Bullet } from '../../entities/Bullet.js';

export class Clone extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.clones = [];
        this.history = [];
    }

    update(dt, context) {
        this.history.unshift({ x: this.player.x, y: this.player.y, angle: this.player.angle });
        const maxHistory = 40 + (this.level * 20);
        if (this.history.length > maxHistory) this.history.pop();

        const cloneCount = 1 + Math.floor(this.level / 2);
        const delay = Math.max(5, 15 - this.level);
        const isFiring = context.input && (context.input.isDown || context.input.isPressed);

        for(let i=1; i<=cloneCount; i++) {
            const idx = i * delay;
            if (this.history[idx]) {
                const pos = this.history[idx];
                if (isFiring && Math.random() < (0.1 + (this.level * 0.05))) {
                    const aimX = context.input.x; const aimY = context.input.y;
                    const angle = Math.atan2(aimY - pos.y, aimX - pos.x);
                    const b = new Bullet(pos.x, pos.y, Math.cos(angle)*12, Math.sin(angle)*12, this.player.damage * 0.35, 40, 'player');
                    b.color = '#5f5';
                    context.addBullet(b);
                }
            }
        }
    } 
    draw(ctx) {}
}
