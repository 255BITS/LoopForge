export class BaseEnemy {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.type = config.type;
        this.radius = config.radius;
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.speed = config.speed;
        this.color = config.color;
        this.reload = config.reload || 0;
        this.attackTimer = config.attackTimer || 0;
        
        this.points = [];
        const sides = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const dist = this.radius * (0.8 + Math.random() * 0.4);
            this.points.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
        }
        
        this.angle = 0;
        this.spin = (Math.random() - 0.5) * 0.1;
        this.hitFlash = 0;
        this.spawnScale = 0;
    }

    update(gameContext) {
        const { enemies, timeScale } = gameContext;

        // Spawn animation
        if (this.spawnScale < 1) this.spawnScale = Math.min(1, this.spawnScale + 0.1);

        if (timeScale === 0) return; // Frozen

        this.behavior(gameContext);

        // Soft Separation
        if (enemies.length > 1) {
            const neighbor = enemies[Math.floor(Math.random() * enemies.length)];
            if (neighbor !== this) {
                const dx = this.x - neighbor.x;
                const dy = this.y - neighbor.y;
                const dist = Math.hypot(dx, dy);
                if (dist < this.radius + neighbor.radius && dist > 0) {
                    this.x += (dx / dist) * 0.5 * timeScale;
                    this.y += (dy / dist) * 0.5 * timeScale;
                }
            }
        }

        this.angle += this.spin * timeScale;
        if (this.hitFlash > 0) this.hitFlash--;
    }

    behavior(context) {
        // Default simple tracking (Basic, Tank, Speeder, Splitter)
        const { player, timeScale } = context;
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.x += Math.cos(angle) * this.speed * timeScale;
        this.y += Math.sin(angle) * this.speed * timeScale;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.spawnScale, this.spawnScale);
        ctx.rotate(this.angle);
        ctx.beginPath();
        this.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.strokeStyle = this.hitFlash > 0 ? '#fff' : this.color;
        ctx.stroke();

        if (this.type !== 'basic' && this.hp < this.maxHp) {
            ctx.rotate(-this.angle);
            ctx.fillStyle = '#400';
            ctx.fillRect(-20, -this.radius - 10, 40, 4);
            ctx.fillStyle = '#f00';
            ctx.fillRect(-20, -this.radius - 10, 40 * Math.max(0, this.hp / this.maxHp), 4);
        }
        ctx.restore();
    }
}
