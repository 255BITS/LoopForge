import { BaseEnemy } from '../BaseEnemy.js';

export class Charger extends BaseEnemy {
    constructor(config) {
        super(config);
        this.baseColor = config.color;
        this.mode = 'STALK'; // STALK, LOCK, DASH
        this.timer = 0;
        this.dashVec = { x: 0, y: 0 };
    }

    behavior(context) {
        const { player, timeScale } = context;
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        
        if (this.mode === 'STALK') {
            // Approach slowly and turn
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.x += Math.cos(angle) * (this.speed * 0.6) * timeScale;
            this.y += Math.sin(angle) * (this.speed * 0.6) * timeScale;
            
            this.timer += timeScale;
            if (this.timer > 100 && dist < 300) {
                this.mode = 'LOCK';
                this.timer = 0;
            }
        } else if (this.mode === 'LOCK') {
            this.timer += timeScale;
            // Warning Flash
            this.color = (this.timer % 10 < 5) ? '#fff' : this.baseColor;
            
            if (this.timer > 45) {
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                this.dashVec.x = Math.cos(angle);
                this.dashVec.y = Math.sin(angle);
                this.mode = 'DASH';
                this.timer = 0;
            }
        } else if (this.mode === 'DASH') {
            this.x += this.dashVec.x * (this.speed * 5) * timeScale;
            this.y += this.dashVec.y * (this.speed * 5) * timeScale;
            if ((this.timer += timeScale) > 30) { this.mode = 'STALK'; this.timer = 0; this.color = this.baseColor; }
        }
    }
}
