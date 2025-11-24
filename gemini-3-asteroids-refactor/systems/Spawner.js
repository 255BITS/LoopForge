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

        this.timer += (isOverdrive ? 2 : 1);
        
        if (Math.floor(this.timer) % 1000 === 0) { 
            if (level % 5 === 0 && level > 1) {
                floatingTexts.push(new FloatingText(player.x, player.y - 80, "⚠️ BOSS APPROACHING ⚠️"));
                let b = createEnemy(level, width, height, true);
                enemies.push(b);
                if(onBossSpawn) onBossSpawn(b);
            } else if (enemies.length < 60) {
                floatingTexts.push(new FloatingText(player.x, player.y - 50, "⚠️ SWARM DETECTED ⚠️"));
                const count = Math.min(25, 8 + level * 2);
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
        
        const maxEnemies = 100 + (level * 10);
        if (enemies.length < maxEnemies && Math.floor(this.timer) % Math.max(6, 45 - level*4) === 0) {
            enemies.push(createEnemy(level, width, height));
        }
    }
}
