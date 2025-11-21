import { state } from '../state.js';
import { endGame } from '../ui.js';

export class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        // Scale enemy stats with Nexus level
        const lvl = state.nexus ? state.nexus.level : 1;
        
        let hpMult = 1, spdMult = 1, dmgMult = 1;
        // Pollution makes enemies stronger globally
        // FIX: Logarithmic scaling prevents death spiral at high pollution
        const pollutionBuff = 1 + Math.log10(1 + (Math.max(0, state.pollution) / 50));
        
        if (type === 'tank') {
            hpMult = 6.0; spdMult = 0.30; dmgMult = 4.0;
        } else if (type === 'swarmer') {
            hpMult = 0.4; spdMult = 1.3; dmgMult = 0.8;
        }
        
        // Rebalance: Enemies scale HP slower, but damage higher. Glass cannons.
        this.maxHp = (15 + (lvl * 4)) * hpMult * pollutionBuff;
        this.hp = this.maxHp;
        this.baseSpeed = (0.035 + (lvl * 0.003)) * spdMult * Math.min(2.5, pollutionBuff); 
        this.damage = (5 + (lvl * 1.5)) * dmgMult * pollutionBuff;
        
        this.stuckFrames = 0;
        this.freezeTimer = 0;
        this.wobble = Math.random() * Math.PI * 2;
    }

    tick(enemies) {
        if (!state.nexus) return;
        
        // AI: Seek Nexus, but get distracted by high pollution sources (Miners)
        let target = state.nexus;
        
        // Simple heuristic: If I'm far from Nexus, attack nearby loud buildings
        if (state.framenum % 15 === 0) {
            const distToNexus = Math.hypot(state.nexus.x - this.x, state.nexus.y - this.y);
            if (this.stuckFrames > 10 || distToNexus > 30) {
                 // Simplified: target current position is handled in collision
            }
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < 0.5) return;
        
        let currentSpeed = this.baseSpeed;
        if (this.freezeTimer > 0) {
            currentSpeed *= 0.4; 
            this.freezeTimer--;
            if (Math.random() < 0.1) return; 
        }
        
        this.wobble += 0.1;
        let vx = (dx / dist) * currentSpeed;
        let vy = (dy / dist) * currentSpeed;

        if (enemies && enemies.length > 1) {
            let sx = 0, sy = 0;
            for (let i = 0; i < enemies.length; i++) {
                const other = enemies[i];
                if (other === this) continue; 
                const ex = this.x - other.x;
                const ey = this.y - other.y;
                const edist = ex*ex + ey*ey;
                if (edist < 1.5) { 
                    const force = (0.6 - edist) * 0.15;
                    sx += ex * force; sy += ey * force;
                }
            }
            vx += sx; vy += sy;
        }
        
        if (this.type === 'swarmer') { vx += Math.cos(this.wobble) * 0.03; vy += Math.sin(this.wobble) * 0.03; }
        
        const nextX = this.x + vx * (vx !== 0 && vy !== 0 ? 0.7071 : 1);
        const nextY = this.y + vy * (vx !== 0 && vy !== 0 ? 0.7071 : 1);
        const targetCell = state.grid.get(Math.floor(nextX + 0.5), Math.floor(nextY + 0.5));
        
        if (targetCell && targetCell.structure && targetCell.structure.active) {
            const type = targetCell.structure.type;
            const isHardTarget = ['wall', 'turret', 'nexus', 'storage'].includes(type);
            
            if (isHardTarget) {
                const dmgMod = Math.min(2.0, 0.5 + state.nexus.level * 0.1);
                if (state.framenum % 15 === 0) targetCell.structure.takeDamage(this.damage);
                if (state.framenum % 20 === 0) state.effects.push({type: 'explosion', x: this.x, y: this.y, radius: 0.4, life: 5, color: '#fff'});
                this.stuckFrames++;
                return; 
            } else {
                if (state.framenum % 30 === 0) targetCell.structure.takeDamage(this.damage * 0.5);
            }
            if (!targetCell.structure.active && targetCell.structure.type === 'nexus') endGame();
        } 
        this.stuckFrames = 0;
        this.x += vx; this.y += vy;
    }
}
