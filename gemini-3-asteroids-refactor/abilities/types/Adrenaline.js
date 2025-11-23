import { BaseAbility } from '../BaseAbility.js';
import { Particle } from '../../effects/Particle.js';

export class Adrenaline extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.baseFireRate = 0; // Calculated at runtime
    }

    update(dt, context) {
        const { combo, isOverdrive } = context;
        
        // Visual flair
        if (combo > 10 && Math.random() < 0.05) {
            context.addParticle(new Particle(this.player.x, this.player.y, '#ff0'));
        }

        // Logic: Dynamically repair HP or boost stats based on combo
        // At high combo/adrenaline, chance to ignore damage or heal
        if (combo > 25 && this.player.hp < this.player.maxHp) {
            if (Math.random() < 0.001 * this.level) {
                this.player.hp += 1;
                context.floatingTexts.push({
                    x: this.player.x, y: this.player.y - 20, text: "ADRENALINE", color: '#ff0', life: 60, vy: -1, update: function(){this.y+=this.vy; this.life--;}, draw: function(ctx){ctx.fillStyle=this.color; ctx.fillText(this.text, this.x, this.y);}
                });
            }
        }
    }
}
