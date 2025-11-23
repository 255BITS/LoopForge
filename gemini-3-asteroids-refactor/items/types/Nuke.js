import { BaseItem } from '../BaseItem.js';
import { FloatingText } from '../../effects/FloatingText.js';

export class Nuke extends BaseItem {
    collect(context) {
        const { enemies, floatingTexts, sfx, player, createExplosion, addShake } = context;
        enemies.forEach(e => { 
            e.hp = 0; 
            createExplosion(e.x, e.y, '#fa0', 6); 
        }); 
        addShake(30); 
        sfx.explode(); 
        floatingTexts.push(new FloatingText(player.x, player.y, "☢ NUKE"));
    }
    draw(ctx) { this.drawPowerUp(ctx, '#fa0', '☢'); }
}
