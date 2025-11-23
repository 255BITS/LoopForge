export class LightningBolt {
    constructor(x1,y1,x2,y2) { this.x1=x1; this.y1=y1; this.x2=x2; this.y2=y2; this.life=8; }
    update() { this.life--; }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life/8; ctx.strokeStyle='#0ff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(this.x1, this.y1); ctx.lineTo(this.x2, this.y2); ctx.stroke();
        ctx.restore();
    }
}
