import { BaseAbility } from '../BaseAbility.js';

export class GravityWell extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.wells = [];
        this.spawnTimer = 0;
    }

    update(dt, context) {
        // Timer logic to spawn new wells
        this.spawnTimer--;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = Math.max(180, 400 - (this.level * 30));
            this.wells.push({
                x: this.player.x, 
                y: this.player.y,
                life: 300,
                range: 150 + (this.level * 40)
            });
        }

        // Logic for existing wells
        for (let i = this.wells.length - 1; i >= 0; i--) {
            const w = this.wells[i];
            w.life--;
            
            // Physics: Suck enemies towards center
            for (const e of context.enemies) {
                const dx = w.x - e.x;
                const dy = w.y - e.y;
                const dist = Math.hypot(dx, dy);
                if (dist < w.range && dist > 10) {
                    const force = (w.range - dist) / w.range * 2 * (1 + this.level * 0.2);
                    e.x += (dx / dist) * force;
                    e.y += (dy / dist) * force;
                    e.hp -= (0.05 * this.level) + (this.player.damage * 0.02); // Crush damage scales with Power
                }
            }

            if (w.life <= 0) this.wells.splice(i, 1);
        }
    }

    draw(ctx) {
        ctx.save();
        for (const w of this.wells) {
            // Draw Event Horizon
            ctx.fillStyle = `rgba(70, 0, 150, ${Math.min(0.4, w.life / 60)})`;
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.range * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Draw Accretion Disk
            ctx.strokeStyle = `rgba(180, 100, 255, ${Math.min(0.8, w.life / 60)})`;
            ctx.lineWidth = 2;
            const t = Date.now() / 200;
            ctx.beginPath();
            for(let r = 10; r < w.range; r += 15) {
                const offset = r + t * 20;
                ctx.moveTo(w.x + Math.cos(offset) * r, w.y + Math.sin(offset) * r);
                ctx.arc(w.x, w.y, r, offset, offset + 0.5);
            }
            ctx.stroke();
        }
        ctx.restore();
    }
}
