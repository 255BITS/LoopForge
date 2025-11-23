import { BaseEnemy } from '../BaseEnemy.js';

export class Orbiter extends BaseEnemy {
    constructor(config) { super(config); }

    behavior(context) {
        const { player, timeScale } = context;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        // Desired orbit distance
        const targetDist = 180;
        
        // Tangential movement (Orbit)
        const orbitSpeed = (this.speed * 1.2) * timeScale;
        this.x += Math.cos(angle + Math.PI / 2) * orbitSpeed;
        this.y += Math.sin(angle + Math.PI / 2) * orbitSpeed;

        // Radial correction (Drift towards/away from ring)
        const radialSpeed = (dist - targetDist) * 0.05 * timeScale;
        this.x += Math.cos(angle) * radialSpeed;
        this.y += Math.sin(angle) * radialSpeed;
    }
}
