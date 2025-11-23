import { BaseEnemy } from '../BaseEnemy.js';

export class Weaver extends BaseEnemy {
    constructor(config) { 
        super(config); 
        this.t = Math.random() * 100; 
    }

    behavior(context) {
        const { player, timeScale } = context;
        this.t += timeScale * 0.15;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const baseAngle = Math.atan2(dy, dx);
        
        // Sine wave deviation perpendicular to path
        const weave = Math.sin(this.t) * 1.2; 
        const finalAngle = baseAngle + weave;

        const speed = this.speed * 1.5 * timeScale;
        this.x += Math.cos(finalAngle) * speed;
        this.y += Math.sin(finalAngle) * speed;
        
        this.angle = finalAngle;
    }
}
