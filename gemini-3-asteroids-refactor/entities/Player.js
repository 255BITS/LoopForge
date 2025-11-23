import { Particle } from '../effects/Particle.js';
import { Bullet } from './Bullet.js';
import { createAbility } from '../abilities/Factory.js';
 
export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 15;
        this.color = '#0ff';
        this.friction = 0.92;
        this.accel = 1.2;
        
        // Stats
        this.hp = 100;
        this.maxHp = 100;
        this.fireRate = 400; // ms
        this.lastFire = 0;
        this.bulletSpeed = 9;
        this.damage = 15;
        this.bulletCount = 1;
        this.spread = 0.2;
        this.piercing = 0;
        this.dashCooldown = 0;
        this.dashTime = 0;
        this.blastRadius = 0;
        this.trail = [];
        this.thunder = 0;
        this.homing = 0;
        this.ricochet = 0;
        this.vortex = 0;
        this.cluster = 0;
        this.boomerang = 0;
        this.angle = 0;
        
        // Auto-aim
        this.lastMousePos = {x: 0, y: 0};
        this.cursorIdleTime = 0;

        this.activeAbilities = new Map();
    }

    update(dt, context) {
        const { keys, input, width, height, enemies, isOverdrive, combo, sfx, addParticle, addBullet, createExplosion, setScreenShake } = context;

        // Physics Movement
        let dx = 0;
        let dy = 0;
        
        if (keys['w'] || keys['ArrowUp']) dy -= 1;
        if (keys['s'] || keys['ArrowDown']) dy += 1;
        if (keys['a'] || keys['ArrowLeft']) dx -= 1;
        if (keys['d'] || keys['ArrowRight']) dx += 1;

        // Apply force
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            const s = isOverdrive ? this.accel * 2 : this.accel;
            this.vx += (dx / len) * s;
            this.vy += (dy / len) * s;
            
            // Engine Trail
            if (Math.random() < 0.5) {
                const angle = Math.atan2(this.vy, this.vx);
                const bx = this.x - Math.cos(angle) * this.radius;
                const by = this.y - Math.sin(angle) * this.radius;
                addParticle(new Particle(bx + (Math.random()-0.5)*5, by + (Math.random()-0.5)*5, '#0aa'));
            }
        }

        // Friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.dashTime > 0) this.dashTime--;

        if (keys[' '] && this.dashCooldown <= 0) {
            this.dashTime = 15;
            this.dashCooldown = 90;
            const angle = (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) 
                        ? Math.atan2(this.vy, this.vx) 
                        : Math.atan2(dy, dx);
            
            this.vx = Math.cos(angle) * 12;
            this.vy = Math.sin(angle) * 12;
            
            createExplosion(this.x, this.y, '#fff', 12);
            setScreenShake(5);
            
            addParticle(new Particle(this.x, this.y, '#0ff'));
        }

        this.x += this.vx;
        this.y += this.vy;

        // Trail
        if (this.dashTime > 0)
        this.trail.push({x: this.x, y: this.y, alpha: 0.6});
        if (this.trail.length > 10) this.trail.shift();
        this.trail.forEach(t => t.alpha *= 0.9);

        // Bounds (Screen Wrap)
        const margin = this.radius;
        if (this.x < -margin) this.x = width + margin;
        else if (this.x > width + margin) this.x = -margin;
        if (this.y < -margin) this.y = height + margin;
        else if (this.y > height + margin) this.y = -margin;

        // Auto-aim logic
        if (input.x !== this.lastMousePos.x || input.y !== this.lastMousePos.y) {
            this.lastMousePos.x = input.x;
            this.lastMousePos.y = input.y;
            this.cursorIdleTime = 0;
        } else {
            this.cursorIdleTime += dt;
        }

        let targetAngle;
        let autoTarget = null;

        if (this.cursorIdleTime > 2000 && enemies) {
            let minDist = Infinity;
            for (const e of enemies) {
                const d = Math.hypot(e.x - this.x, e.y - this.y);
                if (d < minDist) { minDist = d; autoTarget = e; }
            }
        }

        if (autoTarget) {
            targetAngle = Math.atan2(autoTarget.y - this.y, autoTarget.x - this.x);
        } else {
            targetAngle = Math.atan2(input.y - this.y, input.x - this.x);
        }

        let diff = targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle += diff * 0.3;

        // Update Abilities
        for (const ability of this.activeAbilities.values()) ability.update(dt, context);

        // Auto Fire
        let rate = this.fireRate;
        if (isOverdrive) rate = 40;
        rate /= (1 + Math.min(0.5, combo * 0.01));
        if (this.dashTime <= 0 && Date.now() - this.lastFire > rate) {
            this.shoot(context);
            this.lastFire = Date.now();
        }
    }

    shoot(context) {
        const { isOverdrive, combo, sfx, addParticle, addBullet, setScreenShake } = context;
        const angle = this.angle;
        const startAngle = angle - (this.spread * (this.bulletCount - 1)) / 2;
        
        for (let i = 0; i < this.bulletCount; i++) {
            let spreadAmt = this.spread;
            if (isOverdrive) spreadAmt = 0.4; 
            const randomness = (Math.random() - 0.5) * (isOverdrive ? 0.2 : 0.05);
            const fireAngle = (this.bulletCount > 1 ? (angle - (spreadAmt * (this.bulletCount - 1)) / 2) + i * spreadAmt : angle) + randomness;
            const isRainbow = isOverdrive || combo > 20;
            
            const mx = this.x + Math.cos(fireAngle) * (this.radius + 10);
            const my = this.y + Math.sin(fireAngle) * (this.radius + 10);
            addParticle(new Particle(mx, my, isRainbow ? `hsl(${Date.now()%360},100%,50%)` : '#fff'));
            
            addBullet(new Bullet(
                mx, my, 
                Math.cos(fireAngle) * this.bulletSpeed, 
                Math.sin(fireAngle) * this.bulletSpeed,
                this.damage, this.piercing, 'player',
                this.homing, this.ricochet, this.boomerang, isRainbow
            ));
        }
        setScreenShake(2);
        sfx.shoot();
    }

    addAbility(type) {
        if (this.activeAbilities.has(type)) {
            this.activeAbilities.get(type).upgrade();
        } else {
            const ab = createAbility(type, this);
            if(ab) { ab.upgrade(); this.activeAbilities.set(type, ab); }
        }
    }

    draw(ctx) {
        ctx.save();
        this.trail.forEach(t => {
            ctx.globalAlpha = t.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(t.x, t.y, this.radius * 0.6, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        ctx.beginPath(); ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius * 0.7, -this.radius * 0.7);
        ctx.lineTo(-this.radius * 0.4, 0);
        ctx.lineTo(-this.radius * 0.7, this.radius * 0.7);
        ctx.closePath();
        
        ctx.strokeStyle = this.dashTime > 0 ? '#fff' : this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (this.dashCooldown > 0) {
            ctx.strokeStyle = '#555';
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 6, -Math.PI/2, (Math.PI*2 * (1 - this.dashCooldown/90)) - Math.PI/2); ctx.stroke();
             ctx.fillStyle = '#444'; ctx.fillRect(-15, 30, 30, 3);
            ctx.fillStyle = '#fff'; ctx.fillRect(-15, 30, 30 * (1 - this.dashCooldown/90), 3);
        } else {
            ctx.strokeStyle = 'rgba(0,255,255,0.6)';
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 6, 0, Math.PI*2); ctx.stroke();
        }

        // Draw Abilities (Orbitals, Saws, etc)
        for (const ability of this.activeAbilities.values()) ability.draw(ctx);

        ctx.fillStyle = 'red'; ctx.fillRect(-20, 25, 40, 4);
        ctx.fillStyle = 'lime'; ctx.fillRect(-20, 25, 40 * (this.hp / this.maxHp), 4);
        ctx.restore();
    }
}
