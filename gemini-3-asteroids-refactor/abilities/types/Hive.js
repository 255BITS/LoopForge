import { BaseAbility } from '../BaseAbility.js';
import { Particle } from '../../effects/Particle.js';

export class Hive extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.drones = [];
        this.spawnTimer = 0;
    }

    update(dt, context) {
        const maxDrones = 3 + Math.floor(this.level * 2);
        this.spawnTimer--;
        if (this.spawnTimer <= 0 && this.drones.length < maxDrones) {
            this.spawnTimer = 60;
            this.drones.push({
                x: this.player.x, y: this.player.y,
                angle: Math.random() * Math.PI * 2, target: null, speed: 6 + Math.random() * 2
            });
        }
        for (let i = this.drones.length - 1; i >= 0; i--) {
            let d = this.drones[i];
            if (!d.target || d.target.hp <= 0) {
                let close = 9999; d.target = null;
                for (const e of context.enemies) {
                    const dist = Math.hypot(e.x - d.x, e.y - d.y); if (dist < 400 && dist < close) { close = dist; d.target = e; }
                }
            }
        }
    }
}
