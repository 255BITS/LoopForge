import { BaseEnemy } from '../BaseEnemy.js';

export class Splitter extends BaseEnemy {
    constructor(config) {
        super(config);
        this.tier = config.tier || 2; // 2=Big, 1=Med
        this.hasSplit = false;
    }

    behavior(context) {
        super.behavior(context);
        
        // Mitosis on death
        if (this.hp <= 0 && !this.hasSplit && this.tier > 1) {
            this.hasSplit = true;
            const count = 2;
            for(let i=0; i<count; i++) {
                const angle = (Math.PI * 2 / count) * i + (Math.random() * 0.5);
                context.enemies.push(new Splitter({
                    x: this.x + Math.cos(angle) * 10,
                    y: this.y + Math.sin(angle) * 10,
                    type: 'splitter',
                    tier: this.tier - 1,
                    radius: this.radius * 0.65,
                    hp: this.maxHp * 0.6,
                    speed: this.speed * 1.4,
                    color: this.color
                }));
            }
        }
    }
}
