import { BaseAbility } from '../BaseAbility.js';

export class Regen extends BaseAbility {
    constructor(player) { super(player); this.timer = 0; }

    update(dt, context) {
        if (this.player.hp < this.player.maxHp) {
            this.timer++;
            if (this.timer > Math.max(10, 60 - (this.level * 8))) {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1 + Math.floor(this.level / 3));
                this.timer = 0;
            }
        }
    }
}
