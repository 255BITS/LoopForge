import { BaseEnemy } from '../BaseEnemy.js';

export class Mine extends BaseEnemy {
    constructor(config) {
        super(config);
        this.armTimer = 0;
        this.armed = false;
    }

    behavior(context) {
        const { timeScale } = context;
        this.armTimer += timeScale;
        if (this.armTimer > 60) this.armed = true;
        
        // Drifts super slowly
        this.angle += 0.05 * timeScale;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.spawnScale, this.spawnScale);
        
        // Blink
        const blink = Math.floor(Date.now() / (this.armed ? 100 : 400)) % 2 === 0;
        
        ctx.strokeStyle = blink ? '#fff' : '#f00';
        ctx.fillStyle = this.armed ? '#800' : '#300';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI*2);
        ctx.fill();
        ctx.stroke();
        
        // Spikes
        ctx.fillStyle = '#f00';
        for(let i=0; i<8; i++) {
           const a = this.angle + (Math.PI*2/8)*i;
           ctx.beginPath();
           ctx.arc(Math.cos(a)*(this.radius+2), Math.sin(a)*(this.radius+2), 2, 0, Math.PI*2);
           ctx.fill();
        }

        ctx.restore();
    }
}
