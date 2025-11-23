import { BaseEnemy } from '../BaseEnemy.js';

export class Summoner extends BaseEnemy {
    constructor(config) { super(config); }

    behavior(context) {
        const { player, timeScale } = context;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed * timeScale;
        this.y += Math.sin(angle) * this.speed * timeScale;
        if (this.reload <= 0) {
            this.reload = 200;
            if(context.spawnMinion) context.spawnMinion(this.x, this.y);
        } else this.reload -= timeScale;
    }
}
