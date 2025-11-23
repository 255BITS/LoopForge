export class Vortex {
    constructor(x,y,lvl) { this.x=x; this.y=y; this.lvl=lvl; this.life=120; this.angle=0; }
    update(enemies) {
        this.life--; this.angle+=0.1;
        if(enemies) {
            enemies.forEach(e=>{
                if(Math.hypot(e.x-this.x, e.y-this.y)<150) {
                     let a = Math.atan2(this.y-e.y, this.x-e.x);
                     e.x+=Math.cos(a)*3; e.y+=Math.sin(a)*3;
                }
            });
        }
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.angle);
        ctx.strokeStyle='#a0f'; ctx.lineWidth=3;
        ctx.beginPath();
        for(let i=0;i<3;i++) {
            ctx.rotate(Math.PI*2/3); ctx.moveTo(0,0); 
            for(let r=10;r<100;r+=10) ctx.lineTo(r, Math.sin(r*0.1)*20);
        }
        ctx.stroke(); ctx.restore();
    }
}
