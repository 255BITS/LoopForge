import { BaseAbility } from '../BaseAbility.js';

export class DeathRay extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.angle = 0;
        this.hitTimers = new WeakMap(); 
    }

    update(dt, context) {
        this.angle += 0.02 + (this.level * 0.005);
        const range = 250 + (this.level * 30);
        
        const rX = Math.cos(this.angle);
        const rY = Math.sin(this.angle);
        
        for (const e of context.enemies) {
            const epX = e.x - this.player.x;
            const epY = e.y - this.player.y;
            
            const dot = epX * rX + epY * rY;
            const closeDist = Math.abs(epX * rY - epY * rX);
            
            if (dot > 0 && dot < range && closeDist < e.radius + 15) {
                let ht = this.hitTimers.get(e) || 0;
                if (ht <= 0) {
                    e.hp -= this.player.damage * 0.8 + (this.level * 2);
                    e.hitFlash = 3;
                    this.hitTimers.set(e, 10);
                } else {
                    this.hitTimers.set(e, ht - 1);
                }
            }
        }
    }

    draw(ctx) {
        const range = 250 + (this.level * 30);
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.angle);
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f0f';
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 0, 255, 0.6)`;
        ctx.fillRect(0, -2 - (this.level*0.5), range, 4 + this.level);
        ctx.restore();
    }
}
