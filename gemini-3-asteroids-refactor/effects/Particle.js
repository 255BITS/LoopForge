export class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.vx = (Math.random()-0.5)*4; this.vy = (Math.random()-0.5)*4;
        this.life = 1.0;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= 0.04; }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
}
