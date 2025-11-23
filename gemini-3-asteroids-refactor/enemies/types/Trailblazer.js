import { BaseEnemy } from '../BaseEnemy.js';
import { createBullet } from '../../entities/Bullet.js';

export class Trailblazer extends BaseEnemy {
    constructor(config) {
        super(config);
        this.turnTimer = 0;
        this.dropTimer = 0;
        this.angle = Math.random() * Math.PI * 2;
    }

    behavior(context) {
        const { player, bullets, timeScale } = context;
        
        this.turnTimer += timeScale;
        if (this.turnTimer > 45) {
            this.turnTimer = 0;
            const toPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            // Bias direction towards player
            this.angle = toPlayer + (Math.random() - 0.5);
        }

        this.x += Math.cos(this.angle) * this.speed * 1.8 * timeScale;
        this.y += Math.sin(this.angle) * this.speed * 1.8 * timeScale;

        // Leave trail
        this.dropTimer += timeScale;
        if (this.dropTimer > 6) {
            this.dropTimer = 0;
            const b = createBullet(this.x, this.y, 0, 0, 8, 0, 'enemy');
            b.life = 120; 
            b.color = this.color;
            bullets.push(b);
        }
    }
}
