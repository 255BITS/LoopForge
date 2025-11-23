import { BaseItem } from '../BaseItem.js';

export class Experience extends BaseItem {
    constructor(x, y, value) {
        super(x, y);
        this.value = value;
        this.radius = 4;
    }
    collect(context) {
        const { addXp, sfx, level } = context;
        addXp(this.value * (level < 5 ? 1.2 : 1.5));
        sfx.xp();
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.beginPath();
        ctx.moveTo(0, -this.radius); ctx.lineTo(this.radius, 0);
        ctx.lineTo(0, this.radius); ctx.lineTo(-this.radius, 0);
        ctx.fillStyle = '#0f0'; ctx.fill();
        ctx.restore();
    }
}
