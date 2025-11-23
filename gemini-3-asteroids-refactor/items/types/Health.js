import { BaseItem } from '../BaseItem.js';
import { FloatingText } from '../../effects/FloatingText.js';

export class Health extends BaseItem {
    collect(context) {
        const { player, floatingTexts, sfx } = context;
        player.hp = Math.min(player.maxHp, player.hp + 40);
        floatingTexts.push(new FloatingText(player.x, player.y, "♥ HEAL"));
        sfx.powerup();
    }
    draw(ctx) { this.drawPowerUp(ctx, '#f33', '✚'); }
}
