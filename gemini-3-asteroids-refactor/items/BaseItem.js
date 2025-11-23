export class BaseItem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.magnetized = false;
        this.radius = 12;
    }

    update(player) {
        const d = Math.hypot(player.x - this.x, player.y - this.y);
        
        if (!this.magnetized && d < 600) {
            this.x += (player.x - this.x) * 0.002;
            this.y += (player.y - this.y) * 0.002;
        }

        if (this.magnetized || d < 120) {
            const speed = this.magnetized ? 0.25 : 0.15;
            this.x += (player.x - this.x) * speed;
            this.y += (player.y - this.y) * speed;
        }
    }

    collect(context) {}
    draw(ctx) {}

    drawPowerUp(ctx, color, symbol) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.1;
        ctx.scale(pulse, pulse);
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI*2);
        ctx.fillStyle = color; ctx.fill();
        
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(symbol, 0, 1); 
        ctx.restore();
    }
}
