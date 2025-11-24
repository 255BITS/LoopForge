import { BaseAbility } from '../BaseAbility.js';

export class ChronoBreaker extends BaseAbility {
    constructor(player) { 
        super(player); 
        this.timer = 0; 
    }
    update(dt, context) {
        this.timer--;
        if (this.timer <= 0) {
            this.timer = Math.max(300, 900 - (this.level * 100)); // 15s to 5s cooldown
            context.setFreeze(120 + (this.level * 30)); // 2-5 seconds freeze
            context.sfx.playTone(1500, 'sine', 0.5, 1.5);
            context.setScreenShake(5);
            context.createExplosion(this.player.x, this.player.y, '#0ff', 15);
        }
    }
}
