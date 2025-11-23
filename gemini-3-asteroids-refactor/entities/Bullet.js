export class Bullet {
    constructor(x, y, vx, vy, damage, piercing, team, homing = 0, ricochet = 0, boomerang = 0, rainbow = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.life = 100; // frames
        this.piercing = piercing;
        this.team = team;
        this.homing = homing;
        this.ricochet = ricochet;
        this.boomerang = boomerang;
        this.hitList = [];
        this.radius = 3;
        this.color = rainbow ? `hsl(${Math.random()*360},100%,60%)` : (team === 'enemy' ? '#f0f' : '#ff0');
        this.maxSpeed = Math.hypot(vx, vy);
    }

    update(context) {
        const { enemyTimeScale, enemies, player, width, height } = context;
        let ts = 1;
        if (this.team === 'enemy') ts = enemyTimeScale;
        if (ts === 0) return;

        if (this.homing > 0 && this.team === 'player') {
            let target = null;
            let minD = 400;
            for(let e of enemies) {
                const d = Math.hypot(e.x - this.x, e.y - this.y);
                if(d < minD) { minD = d; target = e; }
            }
            if(target) {
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                this.vx += Math.cos(angle) * 0.5 * this.homing;
                this.vy += Math.sin(angle) * 0.5 * this.homing;
                const s = Math.hypot(this.vx, this.vy);
                if(s > 12) { this.vx = (this.vx/s)*12; this.vy = (this.vy/s)*12; }
            }
        }

        if (this.boomerang > 0 && this.team === 'player' && player) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            const turnSpeed = 0.2 + (this.boomerang * 0.1);
            this.vx += (dx / dist) * turnSpeed;
            this.vy += (dy / dist) * turnSpeed;
            const s = Math.hypot(this.vx, this.vy);
            if (s > this.maxSpeed * 1.5) {
                this.vx = (this.vx / s) * (this.maxSpeed * 1.5);
                this.vy = (this.vy / s) * (this.maxSpeed * 1.5);
            }
        }

        this.x += this.vx * ts;
        this.y += this.vy * ts;
        
        if (this.ricochet > 0) {
            if (this.x < 0 || this.x > width) { this.vx = -this.vx; this.ricochet--; }
            if (this.y < 0 || this.y > height) { this.vy = -this.vy; this.ricochet--; }
        }
        
        this.life -= ts;
    }

    draw(ctx) {
        ctx.beginPath();
        const tailLen = 15;
        const angle = Math.atan2(this.vy, this.vx);
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - Math.cos(angle) * tailLen * (this.color.includes('hsl') ? 2 : 1), this.y - Math.sin(angle) * tailLen * (this.color.includes('hsl') ? 2 : 1));
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
}

export function createBullet(x, y, vx, vy, damage, piercing, team) {
    return new Bullet(x, y, vx, vy, damage, piercing, team);
}
