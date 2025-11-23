import { createEnemy } from '../enemies/Factory.js';
import { FloatingText } from '../effects/FloatingText.js';

export class Spawner {
    constructor() {
        this.timer = 0;
    }

    reset() {
        this.timer = 0;
    }

    update(context) {
        const { level, width, height, enemies, player, isOverdrive, floatingTexts, onBossSpawn } = context;

        this.timer += (isOverdrive ? 0.5 : 1);
        
        if (Math.floor(this.timer) % 1000 === 0) { 
            if (level % 5 === 0) {
                floatingTexts.push(new FloatingText(player.x, player.y - 80, "⚠️ BOSS APPROACHING ⚠️"));
                let b = createEnemy(level, width, height, true);
                enemies.push(b);
                if(onBossSpawn) onBossSpawn(b);
            } else if (enemies.length < 60) {
                floatingTexts.push(new FloatingText(player.x, player.y - 50, "⚠️ SWARM DETECTED ⚠️"));
                const count = Math.min(15, 5 + level * 1);
                const radius = 400;
                for(let i=0; i < count; i++) {
                    const e = createEnemy(level, width, height);
                    const angle = (Math.PI * 2 / count) * i;
                    e.x = player.x + Math.cos(angle) * radius;
                    e.y = player.y + Math.sin(angle) * radius;
                    enemies.push(e);
                }
            }
        }
        
        if (enemies.length < 60 && Math.floor(this.timer) % Math.max(30, 70 - level*2) === 0) {
            enemies.push(createEnemy(level, width, height));
        }
    }
}
