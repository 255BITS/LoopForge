import { BaseItem } from '../BaseItem.js';
import { FloatingText } from '../../effects/FloatingText.js';

export class Magnet extends BaseItem {
    collect(context) {
        const { gems, floatingTexts, sfx, player } = context;
        gems.forEach(gem => gem.magnetized = true); 
        floatingTexts.push(new FloatingText(player.x, player.y, "🧲 MAGNET")); 
        sfx.powerup();
    }
    draw(ctx) { this.drawPowerUp(ctx, '#aaf', '🧲'); }
}
