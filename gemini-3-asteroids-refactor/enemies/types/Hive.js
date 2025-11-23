import { BaseEnemy } from '../BaseEnemy.js';

export class Hive extends BaseEnemy {
    constructor(config) {
        super(config);
        this.reload = 120;
    }

    behavior(context) {
        const { player, timeScale } = context;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed * timeScale;
        this.y += Math.sin(angle) * this.speed * timeScale;

        this.reload -= timeScale;
        if (this.reload <= 0) {
            this.reload = 180 // Spawn batch every ~3.5 seconds
            if(context.spawnEnemy) {
                for(let i=0; i<3; i++) {
                    const offsetX = (Math.random() - 0.5) * 20;
                    const offsetY = (Math.random() - 0.5) * 20;
                    context.spawnEnemy('drone', this.x + offsetX, this.y + offsetY);
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        // Hexagon ish shape handled by BaseEnemy points logic usually (random sides), 
        // but we rely on color/size to distinguish.
        super.draw(ctx);
        ctx.restore();
    }
}
