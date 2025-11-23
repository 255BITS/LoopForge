import { BaseAbility } from '../BaseAbility.js';

export class Regen extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; }

    update(dt, context) {
        if (this.player.hp < this.player.maxHp) {
            this.timer++;
            if (this.timer > 60) {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.level);
                this.timer = 0;
            }
        }
    }
}
