import { BaseEnemy } from '../BaseEnemy.js';

export class Kamikaze extends BaseEnemy {
    constructor(config) { super(config); }

    behavior(context) {
        const { player, timeScale, addShake } = context;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        
        this.speed += 0.05 * timeScale;
        if(this.speed > 9) this.speed = 9;
        
        this.x += Math.cos(angle) * this.speed * timeScale;
        this.y += Math.sin(angle) * this.speed * timeScale;
        
        if(Math.random() < 0.1 && Math.hypot(player.x-this.x, player.y-this.y) < 150) addShake(2);
    }
}
