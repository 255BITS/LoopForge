import { BaseEnemy } from './BaseEnemy.js';
import { Shooter } from './types/Shooter.js';
import { Summoner } from './types/Summoner.js';
import { Boss } from './types/Boss.js';
import { Kamikaze } from './types/Kamikaze.js';
import { Charger } from './types/Charger.js';
import { Orbiter } from './types/Orbiter.js';
import { Railgunner } from './types/Railgunner.js';
import { Pulsar } from './types/Pulsar.js';
import { Weaver } from './types/Weaver.js';
import { Graviton } from './types/Graviton.js';
import { Ghost } from './types/Ghost.js';
import { Miner } from './types/Miner.js';
import { Repulsor } from './types/Repulsor.js';
import { Splitter } from './types/Splitter.js';
import { Trailblazer } from './types/Trailblazer.js';
import { Nullifier } from './types/Nullifier.js';
import { Reflector } from './types/Reflector.js';
import { Warden } from './types/Warden.js';
import { Hive } from './types/Hive.js';
import { Skirmisher } from './types/Skirmisher.js';

export function createEnemy(level, canvasWidth, canvasHeight, isBoss = false, overrideType = null) {
    // Determine Spawn Position
    let x, y;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { x = Math.random() * canvasWidth; y = -30; }
    else if (edge === 1) { x = canvasWidth + 30; y = Math.random() * canvasHeight; }
    else if (edge === 2) { x = Math.random() * canvasWidth; y = canvasHeight + 30; }
    else { x = -30; y = Math.random() * canvasHeight; }

    // Default configuration
    let config = { x, y, type: 'basic', radius: 12 + Math.random() * 8, speed: 1.8 + Math.random() + (level * 0.15), hp: 30 + (level * 22), color: '#f55' };

    const r = Math.random();
    
    if (isBoss) {
        config.type = 'boss';
        config.radius = 60;
        config.hp = 4000 + (level * 800);
        config.speed = 0.9;
        config.color = '#f00';
        config.attackTimer = 100;
    } else if (overrideType) {
        // Handle manual override (minions)
        if(overrideType === 'speeder') {
            config.type = 'speeder'; config.radius = 8; config.hp = 10; config.speed = 4; config.color = '#fd0';
        } else if (overrideType === 'drone') {
            config.type = 'basic'; config.radius = 5; config.hp = 5; config.speed = 4; config.color = '#da0';
        }
    } else if (!isBoss && level > 2 && r < 0.05) {
        config.type = 'charger';
        config.radius = 16; config.hp = 50 + (level * 10); config.speed = 2.8; config.color = '#ff8';
    } else if (!isBoss && level > 3 && r < 0.12) {
        config.type = 'orbiter';
        config.radius = 14; config.hp = 35 + (level * 8); config.speed = 3.2; config.color = '#0ef';
    } else if (!isBoss && level > 4 && r < 0.1) {
        config.type = 'kamikaze';
        config.radius = 14; config.hp = 10 + level * 2; config.speed = 0; config.color = '#fa0';
    } else if (!isBoss && level > 4 && r < 0.16) {
        config.type = 'railgunner';
        config.radius = 16; config.hp = 35 + (level * 5); config.speed = 2; config.color = '#0f0';
    } else if (!isBoss && level > 3 && r < 0.20) {
        config.type = 'weaver';
        config.radius = 10; config.hp = 15 + (level * 5); config.speed = 2.2; config.color = '#7ff';
    } else if (!isBoss && level > 5 && r < 0.08) {
        config.type = 'graviton';
        config.radius = 24; config.hp = 120 + (level * 20); config.speed = 1.0; config.color = '#30f';
    } else if (!isBoss && level > 4 && r < 0.12) {
        config.type = 'repulsor';
        config.radius = 20; config.hp = 100 + (level * 15); config.speed = 1.8; config.color = '#0ff';
    } else if (!isBoss && level > 2 && r < 0.18) {
        config.type = 'splitter';
        config.radius = 25; config.hp = 40 + (level * 10); config.speed = 1.2; config.color = '#d72';
    } else if (!isBoss && level > 4 && r < 0.14) {
        config.type = 'trailblazer';
        config.radius = 14; config.hp = 30 + (level * 5); config.speed = 3.0; config.color = '#f82';
    } else if (!isBoss && level > 5 && r < 0.08) {
        config.type = 'nullifier';
        config.radius = 30; config.hp = 150 + (level * 25); config.speed = 0.7; config.color = '#222';
    } else if (!isBoss && level > 3 && r < 0.22) {
        config.type = 'pulsar';
        config.radius = 12; config.hp = 50 + (level * 8); config.speed = 1.5; config.color = '#f0aa';
    } else if (level > 2 && r < 0.15) {
        config.type = 'tank';
        config.radius = 25; config.hp = 80 + (level * 20); config.speed = 0.5 + (level * 0.05); config.color = '#e44';
    } else if (level > 3 && r < 0.24) {
        config.type = 'miner';
        config.radius = 22; config.hp = 60 + (level * 15); config.speed = 1.2; config.color = '#eb6';
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
    } else if (level > 3 && r < 0.65) {
        config.type = 'ghost';
        config.radius = 14; config.hp = 25 + (level * 6); config.speed = 1.5; config.color = '#fff';
    } else if (!isBoss && level > 4 && r < 0.25) {
        config.type = 'reflector';
        config.radius = 18; config.hp = 50 + (level * 12); config.speed = 1.0; config.color = '#aff';
    } else if (!isBoss && level > 3 && r < 0.28) {
        config.type = 'warden';
        config.radius = 20; config.hp = 70 + (level * 10); config.speed = 0.8; config.color = '#4f4';
    } else if (!isBoss && level > 3 && r < 0.04) {
        config.type = 'hive';
        config.radius = 24; config.hp = 50 + (level * 10); config.speed = 0.5; config.color = '#da0';
    } else if (!isBoss && level > 2 && r < 0.09) {
        config.type = 'skirmisher';
        config.radius = 12; config.hp = 20 + (level * 5); config.speed = 2.0; config.color = '#0fe';
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
        case 'charger': return new Charger(config);
        case 'orbiter': return new Orbiter(config);
        case 'railgunner': return new Railgunner(config);
        case 'pulsar': return new Pulsar(config);
        case 'weaver': return new Weaver(config);
        case 'graviton': return new Graviton(config);
        case 'ghost': return new Ghost(config);
        case 'miner': return new Miner(config);
        case 'repulsor': return new Repulsor(config);
        case 'splitter': return new Splitter(config);
        case 'trailblazer': return new Trailblazer(config);
        case 'nullifier': return new Nullifier(config);
        case 'reflector': return new Reflector(config);
        case 'warden': return new Warden(config);
        case 'hive': return new Hive(config);
        case 'skirmisher': return new Skirmisher(config);
        default: return new BaseEnemy(config);
    }
}
