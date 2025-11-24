export class FloatingText {
    constructor(x,y,text,color='#fff',size=16) { 
        this.x=x; this.y=y; this.text=text; this.color=color; this.size=size;
        this.life=50; 
        this.vx = (Math.random()-0.5)*3; 
        this.vy = -3;
    }
    update() { 
        this.x+=this.vx; this.y+=this.vy; this.vy+=0.2; 
        this.life--; 
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const s = 1 + (1 - this.life/50)*0.5;
        ctx.scale(s,s);
        ctx.globalAlpha = Math.max(0, this.life/50);
        ctx.font = `bold ${this.size}px 'Courier New', monospace`;
        ctx.fillStyle=this.color; ctx.strokeStyle='#000'; ctx.lineWidth=3;
        ctx.strokeText(this.text, 0, 0); ctx.fillText(this.text, 0, 0);
        ctx.restore();
    }
}
