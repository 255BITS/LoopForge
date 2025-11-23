import { BaseEnemy } from '../BaseEnemy.js';
import { Mine } from './Mine.js';

export class Miner extends BaseEnemy {
    constructor(config) {
        super(config);
        this.reload = 100;
    }

    behavior(context) {
        const { player, enemies, timeScale } = context;
        // Area Denial: Tries to stay at medium range and strafe
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        // Movement logic
        if (dist < 250) {
            // Too close, back up
            this.x -= Math.cos(angle) * this.speed * timeScale;
            this.y -= Math.sin(angle) * this.speed * timeScale;
        } else {
            // Strafe around player
            this.x += Math.cos(angle + Math.PI/2) * this.speed * timeScale;
            this.y += Math.sin(angle + Math.PI/2) * this.speed * timeScale;
        }

        this.reload -= timeScale;
        if (this.reload <= 0) {
            this.reload = 300; // Drops a mine every ~5 seconds
            enemies.push(new Mine({
                x: this.x, 
                y: this.y, 
                type: 'mine', 
                radius: 12, 
                hp: 10, 
                color: '#f00', 
                speed: 0 // stationary
            }));
        }
    }
}
