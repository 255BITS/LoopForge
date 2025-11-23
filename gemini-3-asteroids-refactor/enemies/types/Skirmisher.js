import { BaseEnemy } from '../BaseEnemy.js';

export class Skirmisher extends BaseEnemy {
    constructor(config) {
        super(config);
    }

    behavior(context) {
        const { player, bullets, timeScale } = context;
        
        // 1. Check for immediate threats
        let dodgeX = 0;
        let dodgeY = 0;
        let threatened = false;

        for(let b of bullets) {
            if (b.team === 'player') {
                const dist = Math.hypot(b.x - this.x, b.y - this.y);
                if (dist < 100) {
                    // Simple repulsion for dodging
                    const angle = Math.atan2(this.y - b.y, this.x - b.x);
                    dodgeX += Math.cos(angle);
                    dodgeY += Math.sin(angle);
                    threatened = true;
                }
            }
        }

        if (threatened) {
            this.x += dodgeX * (this.speed * 1.5) * timeScale;
            this.y += dodgeY * (this.speed * 1.5) * timeScale;
        } else {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.x += Math.cos(angle) * this.speed * timeScale;
            this.y += Math.sin(angle) * this.speed * timeScale;
        }
    }
}
