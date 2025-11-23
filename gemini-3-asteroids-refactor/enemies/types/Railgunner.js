import { BaseEnemy } from '../BaseEnemy.js';
import { createBullet } from '../../entities/Bullet.js';

export class Railgunner extends BaseEnemy {
    constructor(config) {
        super(config);
        this.timer = 0;
        this.state = 'TRACK'; // TRACK, AIM, FLEE
        this.aimAngle = 0;
    }

    behavior(context) {
        const { player, bullets, timeScale } = context;
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);

        if (this.state === 'TRACK') {
            if (dist > 400) {
                this.x += Math.cos(angleToPlayer) * this.speed * timeScale;
                this.y += Math.sin(angleToPlayer) * this.speed * timeScale;
            } else if (dist < 200) {
                this.x -= Math.cos(angleToPlayer) * this.speed * timeScale;
                this.y -= Math.sin(angleToPlayer) * this.speed * timeScale;
            } else {
                this.state = 'AIM';
                this.timer = 80;
            }
        } else if (this.state === 'AIM') {
            this.timer -= timeScale;
            // Track player loosely
            if (this.timer > 30) this.aimAngle = angleToPlayer;
            
            if (this.timer <= 0) {
                bullets.push(createBullet(this.x, this.y, Math.cos(this.aimAngle) * 14, Math.sin(this.aimAngle) * 14, 15, 0, 'enemy'));
                this.state = 'FLEE';
                this.timer = 60;
                this.x -= Math.cos(this.aimAngle) * 15; // Recoil
                this.y -= Math.sin(this.aimAngle) * 15;
            }
        } else if (this.state === 'FLEE') {
            this.x -= Math.cos(angleToPlayer) * (this.speed * 2) * timeScale;
            this.y -= Math.sin(angleToPlayer) * (this.speed * 2) * timeScale;
            this.timer -= timeScale;
            if (this.timer <= 0) this.state = 'TRACK';
        }
    }

    draw(ctx) {
        super.draw(ctx);
        if (this.state === 'AIM') {
            ctx.globalAlpha = 0.5 + Math.sin(this.timer * 0.2) * 0.5;
            ctx.strokeStyle = '#f00'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(this.aimAngle)*800, this.y + Math.sin(this.aimAngle)*800);
            ctx.stroke(); ctx.globalAlpha = 1;
        }
    }
}
