import { BaseItem } from '../BaseItem.js';
import { FloatingText } from '../../effects/FloatingText.js';

export class Freeze extends BaseItem {
    collect(context) {
        const { setFreeze, floatingTexts, sfx, player } = context;
        setFreeze(300); 
        floatingTexts.push(new FloatingText(player.x, player.y, "❄️ FREEZE")); 
        sfx.powerup();
    }
    draw(ctx) { this.drawPowerUp(ctx, '#0ff', '❄️'); }
}
