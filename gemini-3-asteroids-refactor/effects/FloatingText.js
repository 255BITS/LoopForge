export class FloatingText {
    constructor(x,y,text) { this.x=x; this.y=y; this.text=text; this.life=60; }
    update() { this.y -= 0.5; this.life--; }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life/60);
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle='#fff'; ctx.strokeStyle='#000'; ctx.lineWidth=3;
        ctx.strokeText(this.text, this.x, this.y); ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}
