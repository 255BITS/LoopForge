import { BaseEnemy } from '../BaseEnemy.js';

export class Pulsar extends BaseEnemy {
    constructor(config) {
        super(config);
        this.baseRadius = config.radius;
        this.maxRadius = config.radius * 4.5;
        this.state = 'IDLE'; // IDLE, WARN, EXPAND, SHRINK
        this.timer = 0;
    }

    behavior(context) {
        const { player, timeScale } = context;

        if (this.state === 'IDLE') {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.x += Math.cos(angle) * this.speed * timeScale;
            this.y += Math.sin(angle) * this.speed * timeScale;
            this.timer += timeScale;
            if (this.timer > 120) {
                this.state = 'WARN';
                this.timer = 0;
            }
        } else if (this.state === 'WARN') {
            this.timer += timeScale;
            if (this.timer > 45) this.state = 'EXPAND';
        } else if (this.state === 'EXPAND') {
            this.radius += 4 * timeScale;
            if (this.radius >= this.maxRadius) this.state = 'SHRINK';
        } else if (this.state === 'SHRINK') {
            this.radius -= 2 * timeScale;
            if (this.radius <= this.baseRadius) {
                this.radius = this.baseRadius;
                this.state = 'IDLE';
                this.timer = 0;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.spawnScale, this.spawnScale);
        // Scale visual based on radius expansion relative to base
        const s = this.radius / this.baseRadius;
        ctx.scale(s, s);
        ctx.rotate(this.angle);
        
        ctx.beginPath();
        this.points.forEach((p, i) => { if (i===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
        ctx.closePath();
        
        if (this.state === 'WARN') ctx.fillStyle = (Math.floor(this.timer/5)%2===0) ? '#fff' : this.color;
        else ctx.fillStyle = (this.state === 'EXPAND' || this.state === 'SHRINK') ? '#ff00ff88' : this.color + '22';
        ctx.strokeStyle = this.hitFlash > 0 ? '#fff' : this.color;
        ctx.fill(); ctx.stroke();
        ctx.restore();
    }
}
