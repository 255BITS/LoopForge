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
            context.addParticle(new Particle(this.player.x, this.player.y, '#ff0', 3));
        }

        if (combo > 10 && Math.random() < (0.02 + (this.level * 0.01))) {
            const { enemies } = context;
            if (enemies.length > 0) {
                const target = enemies[Math.floor(Math.random() * enemies.length)];
                context.addParticle(new LightningBolt(this.player.x, this.player.y - 20, target.x, target.y));
                target.hp -= this.player.damage * (1 + (combo * 0.05));
            }
        }

        if (combo > 25 && this.player.hp < this.player.maxHp && Math.random() < 0.01 * this.level) {
             this.player.hp += 2;
        }
    }
}
