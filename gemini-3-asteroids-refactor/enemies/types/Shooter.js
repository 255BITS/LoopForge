import { BaseEnemy } from '../BaseEnemy.js';
import { createBullet } from '../../entities/Bullet.js';

export class Shooter extends BaseEnemy {
    constructor(config) { super(config); }

    behavior(context) {
        const { player, bullets, timeScale } = context;
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        
        if (dist > 250) {
            this.x += Math.cos(angle) * this.speed * timeScale;
            this.y += Math.sin(angle) * this.speed * timeScale;
        } else if (dist < 150) {
            this.x -= Math.cos(angle) * this.speed * timeScale;
            this.y -= Math.sin(angle) * this.speed * timeScale;
        }
        
        if (this.reload <= 0 && dist < 400) {
            bullets.push(createBullet(this.x, this.y, Math.cos(angle)*4, Math.sin(angle)*4, 10, 0, 'enemy'));
            this.reload = 120;
        } else this.reload -= timeScale;
    }
}
