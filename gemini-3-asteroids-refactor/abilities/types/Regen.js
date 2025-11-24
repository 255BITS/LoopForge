import { BaseAbility } from '../BaseAbility.js';
import { Particle } from '../../effects/Particle.js';

export class Regen extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; this.accumulator = 0; }

    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(60, 180 - (this.level * 15)); 
            const range = 100 + (this.level * 20);
            let healed = false;

            context.addParticle(new Particle(this.player.x, this.player.y, '#5f5', 5));
            
            for(const e of context.enemies) {
                if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < range) {
                    e.hp -= 2 + (this.level); e.hitFlash = 2;
                    if (this.player.hp < this.player.maxHp) {
                        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1 + (this.level * 0.5));
                        healed = true;
                    }
                }
            }
            
            if (healed) context.floatingTexts.push({x: this.player.x, y: this.player.y - 20, text: "+HP", color:'#5f5', life: 30, update: function(){this.y--;}, draw: function(c){ c.fillStyle=this.color; c.fillText(this.text, this.x, this.y); } });
        }
        if (Math.random() < 0.01) this.player.maxHp += 1; 
    }
}
