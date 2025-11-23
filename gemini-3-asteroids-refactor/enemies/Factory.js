import { BaseEnemy } from './BaseEnemy.js';
import { Shooter } from './types/Shooter.js';
import { Summoner } from './types/Summoner.js';
import { Boss } from './types/Boss.js';
import { Kamikaze } from './types/Kamikaze.js';

export function createEnemy(level, canvasWidth, canvasHeight, isBoss = false, overrideType = null) {
    // Determine Spawn Position
    let x, y;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { x = Math.random() * canvasWidth; y = -30; }
    else if (edge === 1) { x = canvasWidth + 30; y = Math.random() * canvasHeight; }
    else if (edge === 2) { x = Math.random() * canvasWidth; y = canvasHeight + 30; }
    else { x = -30; y = Math.random() * canvasHeight; }

    // Default configuration
    let config = { x, y, type: 'basic', radius: 12 + Math.random() * 8, speed: 1.5 + Math.random() + (level * 0.1), hp: 25 + (level * 10), color: '#f55' };

    const r = Math.random();
    
    if (isBoss) {
        config.type = 'boss';
        config.radius = 60;
        config.hp = 500 + (level * 100);
        config.speed = 0.6;
        config.color = '#f00';
        config.attackTimer = 100;
    } else if (overrideType) {
        // Handle manual override (minions)
        if(overrideType === 'speeder') {
            config.type = 'speeder'; config.radius = 8; config.hp = 10; config.speed = 4; config.color = '#fd0';
        }
    } else if (!isBoss && level > 4 && r < 0.1) {
        config.type = 'kamikaze';
        config.radius = 14; config.hp = 10 + level * 2; config.speed = 0; config.color = '#fa0';
    } else if (level > 2 && r < 0.15) {
        config.type = 'tank';
        config.radius = 25; config.hp = 80 + (level * 20); config.speed = 0.5 + (level * 0.05); config.color = '#e44';
    } else if (level > 3 && r < 0.25) {
        config.type = 'splitter';
        config.radius = 30; config.hp = 60 + (level * 15); config.speed = 1.1; config.color = '#91f';
    } else if (level > 1 && r < 0.35) {
        config.type = 'speeder';
        config.radius = 8; config.hp = 15 + (level * 5); config.speed = 3 + (level * 0.2); config.color = '#fd0';
    } else if (level > 3 && r < 0.45) {
        config.type = 'shooter';
        config.radius = 15; config.hp = 30 + (level * 8); config.speed = 1 + (level * 0.05); config.color = '#f0f';
        config.reload = 60;
    } else if (level > 2 && r < 0.55) {
        config.type = 'summoner';
        config.radius = 22; config.hp = 40 + (level * 10); config.speed = 0.8; config.color = '#90f';
        config.reload = 200;
    }

    // Manual override position if needed (used for minions usually, but here we set post-creation in game.js if needed)
    if (overrideType === 'speeder') { 
        // Minions are weaker
    }

    switch (config.type) {
        case 'shooter': return new Shooter(config);
        case 'summoner': return new Summoner(config);
        case 'boss': return new Boss(config);
        case 'kamikaze': return new Kamikaze(config);
        default: return new BaseEnemy(config);
    }
}
