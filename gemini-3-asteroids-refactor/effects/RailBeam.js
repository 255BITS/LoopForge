export class RailBeam {
    constructor(x, y, angle, damage) {
        this.x = x; this.y = y; this.angle = angle; this.damage = damage;
        this.life = 20; this.maxLife = 20;
    }
    update() { this.life--; }
    draw(ctx) {
        const w = 1000;
        const ex = this.x + Math.cos(this.angle) * w;
        const ey = this.y + Math.sin(this.angle) * w;
        
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(ex, ey);
        ctx.lineWidth = 4 + (this.life/2);
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.restore();
    }
}
