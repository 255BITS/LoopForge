import { BaseAbility } from '../BaseAbility.js';

export class SporeCloud extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.timer = 0; 
        this.clouds = [];
    }

    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(90, 180 - (this.level * 15));
            this.clouds.push({ x: this.player.x, y: this.player.y, life: 240, radius: 10 });
        }

        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const c = this.clouds[i];
            c.life--;
            if (c.radius < 70 + (this.level * 10)) c.radius += 0.5;

            if (c.life % 15 === 0) {
                for(const e of context.enemies) {
                    if (Math.hypot(e.x - c.x, e.y - c.y) < c.radius) {
                        e.hp -= this.player.damage * 0.3;
                        e.hitFlash = 2;
                    }
                }
            }
            if (c.life <= 0) this.clouds.splice(i, 1);
        }
    }

    draw(ctx) {
        for(const c of this.clouds) {
            ctx.fillStyle = `rgba(100, 255, 50, ${Math.min(0.3, c.life/60)})`;
            ctx.beginPath(); ctx.arc(c.x, c.y, c.radius, 0, Math.PI*2); ctx.fill();
        }
    }
}
