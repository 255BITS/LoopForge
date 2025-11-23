import { BaseEnemy } from '../BaseEnemy.js';
import { createBullet } from '../../entities/Bullet.js';

export class Boss extends BaseEnemy {
    constructor(config) { super(config); }
    
    behavior(context) {
        const { player, bullets, timeScale, addShake } = context;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed * timeScale;
        this.y += Math.sin(angle) * this.speed * timeScale;

        this.attackTimer -= timeScale;
        if (this.attackTimer <= 0) {
            this.attackTimer = 180; 
            for(let k=0; k<16; k++) { 
                const a = this.angle + (Math.PI * 2 / 16) * k;
                bullets.push(createBullet(this.x, this.y, Math.cos(a)*5, Math.sin(a)*5, 12, 0, 'enemy'));
            }
            addShake(6);
        }
    }
}
