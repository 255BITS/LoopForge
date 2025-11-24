const UPGRADES = [
    { name: 'Vulcan Cannon', desc: 'Active Spooling. <br>FireRate +40%, Spread +15%.', type: 'offense', tags: ['ballistic', 'gun'], apply: (p) => { 
        p.fireRate = Math.max(1, p.fireRate * 0.60); 
        p.spread = (p.spread || 0) + 0.15;
        p.bulletSpeed = (p.bulletSpeed || 10) * 1.1; // Faster bullets for more chaos
        if (p.fireRate <= 12 && !p.hasAbility('inferno')) { p.spread += 0.1; p.addAbility('inferno'); }
        if (p.fireRate <= 6 && !p.hasAbility('saws')) { p.addAbility('saws'); p.bulletCount = (p.bulletCount||1)+1; } 
        if (p.fireRate <= 4.0) { p.bulletCount += 1; p.damage *= 0.90; }
    }},
    { name: 'Gauss Accelerator', desc: 'Hyper-Velocity Slugs. <br>Dmg +80%, Pierce +3.', type: 'offense', tags: ['ballistic', 'precision'], apply: (p) => { 
        p.damage *= 1.8; p.bulletSpeed += 12; p.piercing += 3; 
        p.knockback = (p.knockback||0) + 20; p.bulletSize = (p.bulletSize || 1) * 1.25; 
        if(p.damage > 120 && !p.hasAbility('railgun')) p.addAbility('railgun');
        if((p.damage > 250) && !p.hasAbility('gravity')) p.addAbility('gravity');
    }},
    { name: 'Fracture Cannon', desc: 'Shotgun Logic. <br>+1 Projectile, +20% Spread.', type: 'offense', tags: ['ballistic', 'tech'], apply: (p) => { 
        p.bulletCount = (p.bulletCount || 1) + 1;
        p.damage *= 0.85; 
        p.spread = (p.spread || 0) + 0.2;
        if (p.homing > 0) { p.damage *= 1.10; } // Synergy: Homing ignores spread penalty
        if (p.bulletCount >= 4 && !p.hasAbility('hive')) p.addAbility('hive');
        if (p.bulletCount >= 6 && !p.hasAbility('spores')) p.addAbility('spores'); 
    }},
    { name: 'Phase Engine', desc: 'Slipstream Drive. <br>Speed +25%, Dodge +15%.', type: 'utility', tags: ['movement', 'tech'], apply: (p) => { 
        p.speed = (p.speed || 5) * 1.30; 
        p.dodge = (p.dodge || 0) + 0.10;
        if (p.speed > 9 && !p.hasAbility('ion')) { p.addAbility('ion'); } 
        if(p.speed > 15 && !p.hasAbility('chrono')) p.addAbility('chrono');
    } },
    { name: 'Siege Breaker', desc: 'Heavy Artillery. <br>Dmg +120%, FireRate -10%. Big Bullets.', type: 'offense', tags: ['ballistic', 'precision'], apply: (p) => { 
        p.damage *= 2.5; p.bulletSize = (p.bulletSize || 1) * 1.6; p.knockback = (p.knockback || 0) + 100;
        p.fireRate = Math.max(4, p.fireRate * 1.10); 
        p.piercing += 2;
        if (p.damage > 250 && !p.hasAbility('deathray')) p.addAbility('deathray');
        if (p.knockback > 100 && !p.hasAbility('saws')) p.addAbility('saws');
    } },
    { name: 'Nanite Weave', desc: 'Symbiotic Fleshmend.<br>+30% Max HP. Add Regen.', type: 'defense', tags: ['vitality', 'hull'], apply: (p) => { 
        p.maxHp = Math.floor(p.maxHp * 1.25); p.hp += Math.floor(p.maxHp * 0.3); 
        const regenStacks = Math.floor(p.maxHp / 300);
        const currentRegen = p.abilities.filter(a => a.constructor.name === 'Regen').length;
        if (currentRegen === 0 || regenStacks > currentRegen) p.addAbility('regen');
        if(p.maxHp >= 600 && !p.hasAbility('spores')) { p.addAbility('spores'); }
    }},
    { name: 'Aigis Protocol', desc: 'Hardlight Orbitals. <br>Protective satellites.', type: 'ability', tags: ['tech', 'defense'], apply: (p) => { 
        p.addAbility('orbitals');
        p.hp = Math.min(p.maxHp, p.hp + 100);
        if ((p.speed < 5 || p.maxHp > 500) && !p.hasAbility('reflector')) { p.addAbility('reflector'); p.addAbility('repulsor'); }
    }},
    { name: 'Cluster Charge', desc: 'Explosive Payload. <br>Blast Radius +100%. Spawns Mines.', type: 'offense', tags: ['ballistic', 'area'], apply: (p) => { 
        p.blastRadius = (p.blastRadius || 0) + 100; p.damage *= 1.3; 
        if (p.blastRadius > 50 && !p.hasAbility('mines')) p.addAbility('mines');
        if(p.blastRadius > 150 && !p.hasAbility('orbital_strike')) p.addAbility('orbital_strike'); 
    }},
    { name: 'Tesla Coil', desc: 'High Voltage. <br>Zaps nearby enemies.', type: 'ability', tags: ['tech', 'elemental'], apply: (p) => {
        p.addAbility('tesla'); p.damage *= 1.2;
        if ((p.fireRate < 10 || p.speed > 10) && !p.hasAbility('ion')) p.addAbility('ion'); 
        // Tech synergy
        if (p.maxHp > 500 && !p.hasAbility('repulsor')) p.addAbility('repulsor'); 
    }},
    { name: 'Mitosis', desc: 'Cellular Division. <br>Spawn a Clone that shoots.', type: 'ability', tags: ['vitality', 'summon'], apply: (p) => { 
        p.addAbility('clone'); p.maxHp += 100; p.hp += 100;
        if ((p.fireRate < 8 || p.speed > 8) && !p.hasAbility('adrenaline')) p.addAbility('adrenaline');
    } },
    { name: 'Omni-Visor', desc: 'Weak-Point targeting. <br>Homing +2.0, Crit chance up.', type: 'utility', tags: ['tech', 'precision'], apply: (p) => { 
        p.homing = (p.homing || 0) + 2.0; p.damage *= 1.25; // "Crit" via flat damage boost implies accuracy
        if((p.homing >= 2)) { 
            if(!p.hasAbility('swarm')) p.addAbility('swarm');
            if(p.homing > 4 && !p.hasAbility('railgun')) p.addAbility('railgun');
        }
        // Laser sight synergy
        if(p.homing >= 5 || p.piercing > 4) { if (!p.hasAbility('deathray')) p.addAbility('deathray'); }
    }},
    { name: 'Prismatic Core', desc: 'Refractive Geometry. <br>Ricochet +3. Lasers bounce.', type: 'utility', tags: ['cosmic', 'ballistic'], apply: (p) => { 
        p.ricochet = (p.ricochet || 0) + 3; 
        p.damage *= 1.2; 
        if(p.ricochet >= 2 && p.piercing > 0 && !p.hasAbility('reflector')) p.addAbility('reflector'); 
        if(p.ricochet >= 5 && !p.hasAbility('boomerang')) p.addAbility('boomerang');
    }},
    { name: 'Pulse Armor', desc: 'Reactive Plating. <br>+100 HP. Knockack Pulse when hit.', type: 'defense', tags: ['vitality', 'hull', 'tech'], apply: (p) => { 
        p.maxHp += 150; p.hp += 150;
        // Synergizes with Repulsor logic by stat boosting
        p.knockback = (p.knockback || 0) + 20; 
        if (!p.hasAbility('repulsor')) p.addAbility('repulsor');
    }},
    { name: 'Behemoth Chassis', desc: 'Dreadnought Class. <br>HP +500. Size +50%.', type: 'defense', tags: ['vitality', 'offense'], apply: (p) => { 
        p.maxHp += 500; p.hp += 200; 
        p.radius = (p.radius || 15) * 1.5;
        p.scale = (p.scale || 1) * 1.5;
        p.knockback = (p.knockback || 0) + 40; 
        if (!p.hasAbility('repulsor')) p.addAbility('repulsor'); 
        if(!p.hasAbility('nova')) p.addAbility('nova'); 
        if(p.maxHp > 2000 && !p.hasAbility('gravity')) p.addAbility('gravity'); // Massive mass = gravity
    }},
    { name: 'Singularity', desc: 'Event Horizon. <br>Summons Black Holes.', type: 'ability', tags: ['cosmic', 'area'], apply: (p) => {
        p.addAbility('gravity'); 
        p.damage *= 1.15;
    }},
    { name: 'Ascension', desc: 'SYSTEM OVERRIDE. <br>ALL Abilities Level +1.', type: 'special', tags: ['universal'], apply: (p) => {
        p.abilities.forEach(a => {
            a.upgrade();
            p.damage *= 1.05; 
        });
    }}
];

import { Player } from '../entities/Player.js';
Player.prototype.hasAbility = function(key) {
    return this.abilities && this.abilities.some(a => a.constructor.name.toLowerCase().includes(key));
};

// Synergies trigger visual flares and high weighting
const SYNERGY_THRESHOLDS = [
    { check: p => p.fireRate <= 10 || p.damage > 150, hint: "BALLISTIC", color: '#ff4d4d', boost: ['Vulcan Cannon', 'Gauss Accelerator', 'Fracture Cannon', 'Cluster Charge', 'Siege Breaker'] },
    { check: p => p.speed > 10 || p.homing >= 2, hint: "TECH", color: '#4db8ff', boost: ['Phase Engine', 'Aigis Protocol', 'Tesla Coil', 'Omni-Visor', 'Pulse Armor'] },
    { check: p => p.maxHp > 600, hint: "VITALITY", color: '#52ff52', boost: ['Nanite Weave', 'Behemoth Chassis', 'Pulse Armor', 'Mitosis'] },
    { check: p => p.ricochet >= 1 || p.piercing > 2, hint: "COSMIC", color: '#d966ff', boost: ['Prismatic Core', 'Reflector', 'Ascension', 'Singularity'] }
];

const COLORS = { ballistic: '#ff5555', tech: '#4db8ff', vitality: '#50fa7b', cosmic: '#bd93f9', special: '#f1fa8c', offense: '#ff4d4d', defense: '#50fa7b', utility: '#4deeea', ability: '#bd93f9' };

const CSS_INJECT = `
<style>
.upgrade-container { display: flex; flex-direction: column; gap: 12px; perspective: 1000px; }
.upgrade-card { position: relative; padding: 12px; font-family: 'Courier New', monospace; cursor: pointer; transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1); clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
.upgrade-card:hover { transform: scale(1.03) translateZ(10px); z-index: 10; filter: brightness(1.3); }
@keyframes neonPulse { 0% { box-shadow: 0 0 5px currentColor; border-color: currentColor; } 50% { box-shadow: 0 0 20px currentColor; border-color: #fff; } 100% { box-shadow: 0 0 5px currentColor; border-color: currentColor; } }
@keyframes textGlitch { 0% { opacity: 1; transform: translate(0); } 98% { opacity: 1; transform: translate(0); } 99% { opacity: 0.8; transform: translate(-2px, 1px); } 100% { opacity: 1; transform: translate(0); } }
.stat-num { font-weight: bold; color: #fff; }
</style>
`;

export const UpgradePool = {
    getChoices(count, player) {
        const choices = [];
        const available = [...UPGRADES];

        const playerTags = {};
        if (player && player.abilities) {
            player.abilities.forEach(a => {
                const source = UPGRADES.find(u => u.apply.toString().includes(`'${a.constructor.name.toLowerCase()}'`));
                if(source && source.tags) source.tags.forEach(t => playerTags[t] = (playerTags[t] || 0) + 3);
            });
            if (player.upgradeLevels) {
                Object.keys(player.upgradeLevels).forEach(name => {
                     const source = UPGRADES.find(u => u.name === name);
                     if(source && source.tags) source.tags.forEach(t => playerTags[t] = (playerTags[t] || 0) + 1);
                });
            }
        }

        for(let i=0; i<count; i++) {
            if(available.length === 0) break;
            let weightedPool = [];
            
            available.forEach(u => {
                let weight = 100;
                let shortType = u.tags ? u.tags[0].toUpperCase() : 'UPGRADE';
                let titleColor = '#fff';
                let subtext = [];
                let activeSynergy = false;
                let borderColor = '#666';
                let cardBg = 'linear-gradient(135deg, rgba(20,20,25,0.95) 0%, rgba(10,10,15,0.98) 100%)';
                let badge = 'NEW';
                let badgeStyle = 'background:rgba(255,255,255,0.1); color:#aaa; font-size:0.7em; padding:2px 6px; letter-spacing:1px;';
                let extraGlow = '';

                let mainTag = 'special';
                if (u.tags) mainTag = u.tags.find(t => ['ballistic','tech','vitality','cosmic'].includes(t)) || u.tags[0];
                if (COLORS[mainTag]) borderColor = COLORS[mainTag];

                // Reformat Description Numbers
                let desc = u.desc.replace(/(\+?-?\d+%?)/g, `<span class="stat-num" style="color:${borderColor}; text-shadow:0 0 5px ${borderColor};">$1</span>`);
                desc = desc.replace(/(Damage|Speed|Rate|HP|Blast|Pierce|Homing|Spread|Knockback)/g, `<span style="color:#fff; opacity:0.8;">$1</span>`);
                
                if (player) {
                    if (u.tags) u.tags.forEach(tag => { if(playerTags[tag]) weight += playerTags[tag] * 250; });

                    let currentLevel = 0;
                    if (player.upgradeLevels && player.upgradeLevels[u.name]) currentLevel = player.upgradeLevels[u.name]; 

                    if (currentLevel > 0 && u.type !== 'special') {
                        weight += 2500 + (currentLevel * 500); // Strong bias towards leveling existing items
                        badge = `LVL ${currentLevel + 1}`; 
                        badgeStyle = `background: ${borderColor}; color: #000; font-weight:900; padding:2px 8px; box-shadow: 0 0 10px ${borderColor};`;
                        cardBg = `linear-gradient(135deg, ${borderColor}33 0%, rgba(10,10,10,0.95) 100%)`;
                        if(!activeSynergy) titleColor = borderColor;
                    } else { weight += 500; }

                    SYNERGY_THRESHOLDS.forEach(s => {
                        if (s.check(player) && (s.boost.includes(u.name) || (u.tags && u.tags.includes(s.hint.toLowerCase())))) {
                            weight += 4000; activeSynergy = true; 
                            cardBg = `linear-gradient(90deg, ${s.color}22 0%, rgba(0,0,0,0.9) 50%)`;
                            shortType = `<span style="color:${s.color}; text-shadow:0 0 8px ${s.color}; animation: textGlitch 4s infinite;">>>> ${s.hint} MATCH</span>`;
                            titleColor = s.color; borderColor = s.color;
                            extraGlow = `animation: neonPulse 2s infinite;`;
                        }
                    });
                }
                
                let levelPips = '';
                if (u.type !== 'special') {
                    levelPips = `<div style="display:flex; flex-direction:row; gap:3px; margin-top:4px;">`;
                    let lvl = player && player.upgradeLevels && player.upgradeLevels[u.name] ? player.upgradeLevels[u.name] : 0;
                    for(let k=0; k<5; k++) { const fill = k < lvl; levelPips += `<div style="width:8px; height:4px; background:${fill?borderColor:'#333'}; box-shadow:${fill?'0 0 4px '+borderColor:'none'}"></div>`; }
                    levelPips += `</div>`;
                }

                let containerCSS = `border: 1px solid ${borderColor}66; border-left: 4px solid ${borderColor}; background: ${cardBg}; ${extraGlow} backdrop-filter: blur(4px); margin-bottom: 10px;`;
                const styles = (i === 0 && weightedPool.length === 0) ? CSS_INJECT : '';
                
                const htmlName = `
                ${styles}
                <div class="upgrade-card" style="${containerCSS}">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid ${borderColor}33; padding-bottom:6px; margin-bottom:6px;">
                        <div>
                            <div style="font-size:0.7em; color:${borderColor}; font-weight:700; letter-spacing:1px; text-transform:uppercase;">${shortType}</div>
                            <div style="color:${titleColor}; font-size:1.3em; font-weight:800; text-shadow:0 0 10px ${borderColor}44;">${u.name}</div>
                        </div>
                        <div style="text-align:right;">
                            <span style="${badgeStyle}">${badge}</span>
                        </div>
                    </div>
                    <div style="color:#ccc; font-size:0.85em; line-height:1.4;">${desc}</div>
                    ${levelPips}
                </div>`;

                const htmlDesc = ``; // Integrated into card for better layout control

                weightedPool.push({ item: { ...u, name: htmlName, desc: htmlDesc, id: u.name, style: containerCSS }, weight, original: u });
            });

            const totalWeight = weightedPool.reduce((a,b) => a + b.weight, 0);
            let r = Math.random() * totalWeight; let selected = weightedPool[0];
            for(let w of weightedPool) { r -= w.weight; if (r <= 0) { selected = w; break; } }
            
            const originalApply = selected.item.apply;
            selected.item.apply = (p) => {
                p.upgradeLevels = p.upgradeLevels || {};
                p.upgradeLevels[selected.original.name] = (p.upgradeLevels[selected.original.name] || 0) + 1;
                originalApply(p);
            };
            choices.push(selected.item); available.splice(available.indexOf(selected.original), 1);
        }
        return choices;
    }
};
