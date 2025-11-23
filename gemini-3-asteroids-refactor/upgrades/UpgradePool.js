const UPGRADES = [
    { name: 'Rapid Fire', desc: 'Shoot 15% faster', apply: (p) => p.fireRate *= 0.85 },
    { name: 'High Caliber', desc: '+8 Damage', apply: (p) => p.damage += 8 },
    { name: 'Multishot', desc: '+1 Projectile', apply: (p) => p.bulletCount++ },
    { name: 'Speed', desc: 'Move faster', apply: (p) => p.speed += 1 },
    { name: 'Piercing', desc: '+1 Pierce', apply: (p) => p.piercing++ },
    { name: 'Health', desc: 'Heal 50 HP', apply: (p) => p.hp = Math.min(p.maxHp, p.hp + 50) },
    { name: 'Orbitals', desc: '+1 Shield Orbs', apply: (p) => p.addAbility('orbitals') },
    { name: 'Explosive', desc: 'Blast Dmg', apply: (p) => p.blastRadius += 40 },
    { name: 'Thunder', desc: 'Chain Lightning', apply: (p) => p.thunder += 2 },
    { name: 'Regen', desc: '+1 HP/sec', apply: (p) => p.addAbility('regen') },
    { name: 'Homing', desc: 'Missiles', apply: (p) => p.homing++ },
    { name: 'Ricochet', desc: 'Bouncy Bullets', apply: (p) => p.ricochet++ },
    { name: 'Vortex', desc: 'Gravity Wells', apply: (p) => p.vortex++ },
    { name: 'Nova', desc: 'Periodic Ring Blast', apply: (p) => p.addAbility('nova') },
    { name: 'Railgun', desc: 'Particle Beam', apply: (p) => p.addAbility('railgun') },
    { name: 'Cluster Bomb', desc: 'Hits cause explosions', apply: (p) => p.cluster++ },
    { name: 'Shotgun', desc: '+3 Bullets, Spread', apply: (p) => { p.bulletCount+=3; p.spread+=0.3; p.fireRate*=1.1; } },
    { name: 'Sniper', desc: 'Fast & Piercing', apply: (p) => { p.damage+=30; p.bulletSpeed+=5; p.piercing+=5; } },
    { name: 'Boomerang', desc: 'Bullets Return', apply: (p) => p.boomerang++ },
    { name: 'Tesla Coil', desc: 'Passive Zaps', apply: (p) => p.addAbility('tesla') },
    { name: 'Frenzy', desc: '+20% Fire Rate, -10 HP', apply: (p) => { p.fireRate *= 0.8; p.maxHp -= 10; p.hp = Math.min(p.hp, p.maxHp); } },
    { name: 'Buzzsaw', desc: 'Orbiting Blades', apply: (p) => p.addAbility('saws') }
];

export const UpgradePool = {
    getChoices(count) {
        const choices = [];
        while(choices.length < count) {
            const r = UPGRADES[Math.floor(Math.random() * UPGRADES.length)];
            if(!choices.includes(r)) choices.push(r);
        }
        return choices;
    }
};
