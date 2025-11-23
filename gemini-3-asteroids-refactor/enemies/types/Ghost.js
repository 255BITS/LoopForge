import { BaseEnemy } from '../BaseEnemy.js';

export class Ghost extends BaseEnemy {
    constructor(config) {
        super(config);
        this.state = 'VISIBLE'; // VISIBLE, FADE_OUT, HIDDEN, FADE_IN
        this.stateTimer = 0;
        this.alpha = 1;
        this.targetPos = {x:0, y:0};
    }

    behavior(context) {
        const { player, timeScale } = context;
        this.stateTimer += timeScale;

        if (this.state === 'VISIBLE') {
            // Chase slowly
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.x += Math.cos(angle) * (this.speed * 0.6) * timeScale;
            this.y += Math.sin(angle) * (this.speed * 0.6) * timeScale;
            
            if (this.stateTimer > 100) {
                this.state = 'FADE_OUT';
                this.stateTimer = 0;
            }
        } else if (this.state === 'FADE_OUT') {
            this.alpha -= 0.03 * timeScale;
            if (this.alpha <= 0) {
                this.alpha = 0;
                this.state = 'HIDDEN';
                this.stateTimer = 0;
                // Teleport logic: Pick random point near player
                const angle = Math.random() * Math.PI * 2;
                this.targetPos.x = player.x + Math.cos(angle) * 200;
                this.targetPos.y = player.y + Math.sin(angle) * 200;
            }
        } else if (this.state === 'HIDDEN') {
            // Move extremely fast to ambush point
            const dx = this.targetPos.x - this.x;
            const dy = this.targetPos.y - this.y;
            
            this.x += (dx * 0.1) * timeScale;
            this.y += (dy * 0.1) * timeScale;

            if (this.stateTimer > 40) {
                this.state = 'FADE_IN';
                this.stateTimer = 0;
            }
        } else if (this.state === 'FADE_IN') {
            this.alpha += 0.05 * timeScale;
            if (this.alpha >= 1) {
                this.alpha = 1;
                this.state = 'VISIBLE';
                this.stateTimer = 0;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        super.draw(ctx);
        ctx.restore();
    }
}
