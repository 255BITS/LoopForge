import { BaseAbility } from '../BaseAbility.js';

export class GravityWell extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.wells = [];
        this.spawnTimer = 0;
        this.rotation = 0;
    }

    update(dt, context) {
        this.rotation += 0.1;
        this.spawnTimer--;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = Math.max(180, 400 - (this.level * 30));
            this.wells.push({ x: this.player.x, y: this.player.y, life: 300, range: 150 + (this.level * 40) });
        }

        for (let i = this.wells.length - 1; i >= 0; i--) {
            const w = this.wells[i]; w.life--;
            for (const e of context.enemies) {
                const dx = w.x - e.x; const dy = w.y - e.y; const dist = Math.hypot(dx, dy);
                if (dist < w.range && dist > 10) {
                    const force = (w.range - dist) / w.range * 8 * (1 + this.level * 0.2);
                    e.x += (dx / dist) * force; e.y += (dy / dist) * force;
                    e.hp -= (0.1 * this.level) + (this.player.damage * 0.05);
                }
            }
            if (w.life <= 0) this.wells.splice(i, 1);
        }
    }

    draw(ctx) {
        ctx.save();
        for (const w of this.wells) {
             ctx.translate(w.x, w.y); ctx.rotate(this.rotation);
             ctx.beginPath(); ctx.arc(0, 0, w.range, 0, Math.PI*2);
             ctx.strokeStyle = `rgba(150, 50, 255, ${w.life/300 * 0.3})`; ctx.lineWidth = 2; ctx.stroke();
             ctx.beginPath(); ctx.arc(0,0, 8, 0, Math.PI*2); ctx.fillStyle = '#000'; ctx.fill();
             ctx.beginPath(); ctx.arc(0,0, 10, 0, Math.PI*2); ctx.strokeStyle = '#d0f'; ctx.lineWidth = 1; ctx.stroke();
             ctx.translate(-w.x, -w.y);
        }
        ctx.restore();
    }
}
