import { BaseAbility } from '../BaseAbility.js';
import { Particle } from '../../effects/Particle.js';
import { LightningBolt } from '../../effects/LightningBolt.js';

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
        if (combo > 15 && Math.random() < 0.02) {
            // Synergy: Thunderous Momentum
            // High combo creates lightning arcs
            const { enemies } = context;
            if (enemies.length > 0) {
                const target = enemies[Math.floor(Math.random() * enemies.length)];
                context.addParticle(new LightningBolt(this.player.x, this.player.y, target.x, target.y));
                target.hp -= this.player.damage;
            }
        }

        if (combo > 25 && this.player.hp < this.player.maxHp) {
            if (Math.random() < 0.01 * this.level) {
                this.player.hp += 2;
                context.floatingTexts.push({
                    x: this.player.x, y: this.player.y - 20, text: "ADRENALINE", color: '#ff0', life: 60, vy: -1, update: function(){this.y+=this.vy; this.life--;}, draw: function(ctx){ctx.fillStyle=this.color; ctx.fillText(this.text, this.x, this.y);}
                });
            }
        }
    }
}
