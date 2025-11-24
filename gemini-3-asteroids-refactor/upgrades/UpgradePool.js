const UPGRADES = [
    { name: 'Rapid Fire', desc: '+10% Rate (Stack: Inferno)', apply: (p) => { 
        // Infinite Logarithmic Scaling: Never hits 0, but gets infinitely fast
        p.fireRate = Math.max(1, p.fireRate * 0.85); // Extreme scaling allowed
        
        // Synergy: Overheating
        if (p.fireRate <= 10) {
            p.spread = (p.spread || 0) + 0.05; // Heat wobble
            if (Math.random() < 0.5) p.addAbility('inferno');
        }
        // Synergy: Rotary Barrel
        if (p.fireRate <= 5) {
            p.addAbility('saws'); // Metal spinning so fast it cuts
        }
        // Infinite Scaling: Turning speed into lead wall
        if (p.fireRate <= 4.0) {
            p.bulletCount = (p.bulletCount || 1) + 1;
            p.damage *= 0.9; 
        }
    }},
    { name: 'High Caliber', desc: '+25% Dmg, Rate-- (Stack: Gravity)', apply: (p) => { 
        p.damage *= 1.25; 
        p.fireRate *= 1.1; // Slower firing
        p.bulletSpeed += 2; 
        p.knockback = (p.knockback||0) + 8;
        p.bulletSize = (p.bulletSize || 1) * 1.1; // Visual scaling treatment

        // Synergy: Heavy Hitters turn into Railguns
        if(p.damage > 120) p.addAbility('railgun');
        // Synergy: Mass -> Gravity (Density threshold)
        if(p.damage > 200 || p.bulletSize > 1.4) p.addAbility('gravity');
        // Synergy: Impact -> Explosion
        if(p.knockback > 25) p.addAbility('mines');
    }},
    { name: 'Multishot', desc: '+1 Proj (Stack: Swarm)', apply: (p) => { 
        p.bulletCount = (p.bulletCount || 1) + 1;
        
        // Balance: Higher penalty to encourage damage investment usage
        p.damage *= 0.90; 

        // Synergy: Homing bullets negate spread penalty (Smart Targeting)
        if (p.homing > 0) { 
            // If homing is very high, converge stream instead of spread
            if (p.homing > 2) p.spread *= 0.5;
            else p.spread += 0.05; 
            p.damage *= 1.1; 
        }
        // Synergy: Focused Fire (Sniper)
        else if ((p.fireRate > 30 && p.damage > 100) || p.spread === 0) { 
            p.spread = 0; // Maintain Sniper accuracy
        }
        else p.spread += 0.1; // Chaotic spray
    
        // Synergy: Saturation Fire
        if (p.bulletCount >= 4) {
             p.addAbility('hive');
        }
        // Synergy: Carpet Bombing
        if (p.bulletCount >= 6 || p.spread > 0.6) {
             p.addAbility('spores'); 
        }
    }},
    { name: 'Speed', desc: '+15% Speed (Stack: Lightning)', apply: (p) => { 
        p.speed = (p.speed || 5) * 1.15; 
        p.dodge = (p.dodge || 0) + 0.04; 
        // Balance cap
        p.dodge = Math.min(0.75, p.dodge);
        // Synergy: Kinetic Energy (Speed -> Power)
        if (p.speed > 8) { p.damage *= 1.05; p.bulletSpeed += 2; }
        
        // Synergy: Generate static while moving
        if(p.speed > 10) {
            p.addAbility('tesla'); 
        }
        // Synergy: Speed of Light
        if(p.speed > 13) { p.addAbility('ion'); p.dodge = (p.dodge||0) + 0.05; }
        // Synergy: Time Dilation
        if(p.speed > 15) p.addAbility('chrono');
    } },
    { name: 'Piercing', desc: '+1 Pierce (Stack: Saws)', apply: (p) => { 
        p.piercing++; 
        p.damage *= 1.15; 
        // Synergy: High velocity rounds cut through air (Saws)
        if (p.piercing >= 3) p.addAbility('saws');
        if (p.piercing >= 6) p.addAbility('deathray');
    } },
    { name: 'Vitality', desc: '+30% HP (Stack: Regen)', apply: (p) => { 
        p.maxHp = Math.floor(p.maxHp * 1.30); 
        p.hp += Math.floor(p.maxHp * 0.3); 
        // Synergy: Bio-mass -> Regen. Every 2 vitality upgrades worth of HP grants regen lvl
        if (Math.floor(p.maxHp / 250) > (p._lastRegenCheck || 0)) {
            p.addAbility('regen');
            p._lastRegenCheck = Math.floor(p.maxHp / 250);
        }
        
        // Synergy: Titan
        if(p.maxHp >= 600) { p.addAbility('repulsor'); }
        if(p.maxHp >= 800) { p.addAbility('nova'); } // Radiating life force
        if(p.maxHp >= 1000) { p.addAbility('gravity'); p.addAbility('reflector'); p.bulletSize = (p.bulletSize||1)+0.5; }
        // Synergy: Juggernaut (HP adds Damage always now, scaling better)
        p.damage += (p.maxHp * 0.08); 
    }},
    { name: 'Orbitals', desc: '+1 Shield Orbs', apply: (p) => { 
        p.addAbility('orbitals');
        // Synergy: Force field synergy - Orbitals generate friction
        if ((p.bulletCount || 1) > 3) p.addAbility('repulsor'); 
        // Synergy: Turtle Build
        if (p.speed < 5 || p.maxHp > 500) p.addAbility('reflector'); 
    }},
    { name: 'Explosive', desc: '+Blast Area/Dmg', apply: (p) => { 
        p.blastRadius = (p.blastRadius || 0) + 45; 
        p.damage *= 1.1; 
        // Synergy: Minefield
        if(p.blastRadius > 80) p.addAbility('mines');
        // Synergy: Nuke
        if(p.blastRadius > 150) p.addAbility('orbital'); 
        // Synergy: Shaped Charge
        if (p.homing > 0) { p.blastRadius *= 0.9; p.damage *= 1.2; }
    }},
    { name: 'Overload', desc: '+Tesla, +Ion (Stack: Volt)', apply: (p) => {
        p.addAbility('tesla');
        p.damage *= 1.1;
        // Synergy: High Voltage
        if (p.fireRate < 8 || p.speed > 10) p.addAbility('ion'); 
        if (p.maxHp > 500) p.addAbility('repulsor'); // Electromagnetic shield
    }},
    { name: 'Regen', desc: 'Health Rehab & MaxHP', apply: (p) => { 
        p.addAbility('regen'); 
        p.maxHp += 100; p.hp += 100;
        // Synergy: Blood Magic (High Regen fuels High Fire Rate)
        if (p.fireRate < 8) p.addAbility('adrenaline');
        if (p.hp > 500) p.addAbility('spores'); // Bio-emission
    } },
    { name: 'Homing', desc: 'Homing Bullets', apply: (p) => { 
        p.homing++; 
        p.bulletSpeed += 1; 
        p.damage *= 0.9; // Cost of smarts
        // Synergy: Smart Missiles
        if(p.homing >= 2 && p.blastRadius > 0) { 
            p.addAbility('swarm'); 
            p.addAbility('sentry'); // Smart turrets
        }
        if(p.homing >= 5) p.addAbility('deathray');
    } },
    { name: 'Ricochet', desc: 'Bouncy Bullets', apply: (p) => { 
        p.ricochet++;
        // Synergy: Geometry Wars (Bouncing + Piercing = Saws)
        if(p.ricochet >= 2 && p.piercing > 0) p.addAbility('reflector'); 
        // Synergy: Kinetic Return
        if(p.ricochet >= 3 || p.range < 500) p.addAbility('boomerang');
        // Synergy: Trickshot
        if(p.damage > 50) p.piercing++; 
    }},
    { name: 'Vortex Round', desc: 'Chance for Gravity', apply: (p) => { 
        p.vortex++; 
        // Synergy: Event Horizon
        if(p.vortex >= 2 || p.damage > 150) p.addAbility('gravity'); 
        if(p.vortex >= 4) p.addAbility('chrono'); // Singularity
    } },
    { name: 'Nova', desc: 'Periodic Blast (+5% Dmg)', apply: (p) => { p.addAbility('nova'); p.damage *= 1.05; } },
    { name: 'Railgun', desc: 'Piercing Beam (+1 Pierce)', apply: (p) => { p.addAbility('railgun'); p.piercing++; } },
    { name: 'Cluster Bomb', desc: 'Secondary Explosions', apply: (p) => { 
        p.cluster = (p.cluster || 0) + 1; 
        p.blastRadius += 10;
        if (p.cluster >= 2) p.addAbility('mines');
    }},
    { name: 'Buckshot', desc: '+2 Bullets, Spread', apply: (p) => { 
        p.bulletCount = (p.bulletCount || 1) + 2;
        p.spread = Math.min(1.5, (p.spread || 0) + 0.2); // Cap spread
        p.fireRate = p.fireRate * 1.15; // Slower firing
        if(p.spread > 0.8) { 
            p.piercing = (p.piercing || 0) + 2;
            p.damage *= 1.15; 
            p.addAbility('reflector'); // Close quarters defense
        }
    }},
    { name: 'Sniper', desc: 'Dmg x2.5, Rate x0.5 (Stack: Railgun)', apply: (p) => { 
        p.damage *= 2.5; 
        p.bulletSpeed += 12; 
        p.fireRate = p.fireRate * 1.8; // Slightly less penalty
        p.piercing = (p.piercing||0) + 1;
        p.knockback = (p.knockback||0) + 15; 
        p.spread = 0; // Guaranteed perfect accuracy

        // Trade-off: Precision converts wild shots into raw power
        if ((p.bulletCount || 1) > 1) {
            const sacrificed = p.bulletCount - 1;
            p.bulletCount = 1;
            p.damage *= (1 + (sacrificed * 0.5));
            p.bulletSize = (p.bulletSize || 1) + (sacrificed * 0.5);
            p.blastRadius = (p.blastRadius || 0) + (sacrificed * 10);
        }

        // Always applies Railgun if damage is sufficient
        if (p.damage > 180) p.addAbility('railgun');
        
        // Stealth position
        if (p.fireRate > 600 || p.dodge > 0.1) { p.addAbility('clone'); p.dodge = (p.dodge||0)+0.05; }
    }},
    { name: 'Boomerang', desc: 'Throw Boomerangs (+1 Bounce)', apply: (p) => { p.addAbility('boomerang'); p.ricochet++; } },
    { name: 'Tesla Coil', desc: 'Zap Nearby (+5% Speed)', apply: (p) => { p.addAbility('tesla'); p.speed *= 1.05; p.addAbility('ion'); } },
    { name: 'Frenzy', desc: 'Fast Fire, Fragile', apply: (p) => { 
        p.fireRate *= 0.7; p.speed *= 1.1;
        // Safety floor for HP
        if (p.maxHp > 50) {
            p.maxHp = Math.floor(p.maxHp * 0.85); 
            p.hp = Math.min(p.hp, p.maxHp); 
        }
        p.dodge = (p.dodge || 0) + 0.05; // Evasion compensation

        if(p.maxHp < 200) {
            p.addAbility('adrenaline');
            p.addAbility('saws'); // Melee protection for fragile builds
        }
    }},
    { name: 'Buzzsaw', desc: 'Orbiting Saws (+Defense)', apply: (p) => { 
        p.addAbility('saws'); 
        p.maxHp += 20; 
        // Synergy: Bloodletting
        if (p.damage > 80 || p.piercing > 2) p.addAbility('spores');
        p.knockback += 2;
    }},
    { name: 'Reflector', desc: 'Front Shield (+Knockback)', apply: (p) => { 
        p.addAbility('reflector'); 
        p.knockback = (p.knockback || 0) + 8; 
        if(p.knockback > 20) p.addAbility('saws');
    } },
    { name: 'Hive', desc: 'Drone Swarm', apply: (p) => { 
        p.addAbility('hive'); 
        // Synergy: Carrier has more bullets
        p.bulletCount = (p.bulletCount||1) + 1; 
        if (p.homing > 1) p.addAbility('swarm');
        
        // Synergy: Queen Bee
        if (p.bulletCount > 8) p.addAbility('saws');
    } },
    { name: 'Adrenaline', desc: 'Combo Buffs (+Rate)', apply: (p) => { 
        p.addAbility('adrenaline'); 
        p.fireRate *= 0.92; p.speed *= 1.02; // Better scaling on rate
    } },
    { name: 'Titanium Hull', desc: '+200 HP, Speed- (Stack: Fortress)', apply: (p) => { 
        p.maxHp += 200; p.hp += 200; 
        p.speed = Math.max(1, p.speed * 0.85);
        p.knockback = (p.knockback || 0) + 50; // Massive physical presence
        
        // Synergy: Walking Fortress
        p.addAbility('repulsor'); // Always get the shield
        
        if(p.speed <= 4) { p.addAbility('sentry'); p.addAbility('gravity'); } // Dense Mass

        // Synergy: Battering Ram
        p.addAbility('saws');
        // Reactive Armor
        p.addAbility('nova'); p.blastRadius = (p.blastRadius||0)+10;
    }},
    { name: 'Wildcard', desc: 'All Stats Up + Rare', apply: (p) => { 
        const rareCapabilities = ['deathray', 'chrono', 'orbital', 'ion', 'clone', 'spores', 'limitbreak'];
        const r = rareCapabilities[Math.floor(Math.random() * rareCapabilities.length)];
        if(r !== 'limitbreak') p.addAbility(r);

        // Universal Boost - Infinite Scaling Mechanism
        p.damage *= 1.15;
        p.fireRate *= 0.95;
        p.maxHp += 50; p.hp += 50;
        p.speed *= 1.05;
    }},
    { name: 'Glass Cannon', desc: '+80% Dmg, -50% MaxHP (Stack: Clone)', apply: (p) => { 
        p.damage *= 1.80; 
        
        p.maxHp = Math.floor(p.maxHp * 0.5); 
        p.hp = Math.min(p.hp, p.maxHp);
        
        // Already fragile? Gain extra avoidance
        if(p.maxHp < 40) p.dodge = (p.dodge || 0) + 0.1;

        if (Math.random() < 0.5) p.addAbility('clone'); // Decoys

        if (p.maxHp < 150) {
             p.addAbility('orbitals'); // Shield
        }
        // Synergy: Assassin
        if (p.damage > 300) {
            p.addAbility('chrono'); 
        }
    }},
    { name: 'Clone', desc: 'Holo-Decoy (Stack: Dodge)', apply: (p) => { p.addAbility('clone'); p.dodge = (p.dodge || 0) + 0.05; } },
    { name: 'Repulsor', desc: 'Force Field', apply: (p) => { p.addAbility('repulsor'); p.knockback += 5; } },
    { name: 'Ion Storm', desc: 'Lightning Rain', apply: (p) => p.addAbility('ion') },
    { name: 'Spore Cloud', desc: 'Toxic Trail', apply: (p) => p.addAbility('spores') },
    { name: 'Gauss Cannon', desc: 'Fast & Heavy', apply: (p) => { p.bulletSpeed += 15; p.piercing+=4; p.damage+=30; p.fireRate *= 1.2; p.addAbility('railgun'); } },
    { name: 'Minigun', desc: 'Rate+++, Dmg--, Spread++ (Stack: Inferno)', apply: (p) => { 
        p.fireRate = p.fireRate * 0.5;
        p.bulletCount = (p.bulletCount||1) + 2;
        p.spread += 0.5; // Spray and pray
        p.damage *= 0.70; // Less penalty to encourage build

        // Synergy: Momentum (Loss of speed, unless Lightweight)
        if (p.speed > 8) p.speed *= 0.9; 

        // Synergy: Meltdown
        if (p.fireRate <= 10) { 
            p.addAbility('inferno');
        }
        // Synergy: Suppression
        if (p.bulletCount >= 6) { 
            p.addAbility('hive'); 
            p.piercing++; 
        }
        // Stabilizers
        if (p.speed < 5) { p.addAbility('sentry'); p.spread *= 0.85; }
    }},
    { name: 'Heavy Barrel', desc: 'Big Hits, Slow', apply: (p) => { 
        p.damage *= 1.5; p.fireRate *= 1.15; p.bulletSpeed *= 0.9; 
        p.knockback = (p.knockback || 0) + 8; // Kinetic impact
        p.bulletSize = (p.bulletSize || 1) * 1.2;
        // Synergy: Anti-Material
        if(p.damage > 70) p.piercing = (p.piercing||0)+1;
        // Synergy: Stationary defense
        if(p.speed < 6) p.addAbility('sentry');
        // Synergy: Collateral
        if(p.piercing > 2) p.addAbility('railgun');
    }},
    { name: 'Lightweight', desc: 'Agility & Rate', apply: (p) => { 
        p.speed *= 1.25; p.fireRate *= 0.95; 
        // Synergy: Flash
        if(p.speed > 12) p.addAbility('chrono');
        // Synergy: Ninja
        if(p.dodge > 0) p.addAbility('clone');
    }},
    { name: 'Death Ray', desc: 'Spinning Laser (+20% Dmg)', apply: (p) => { p.addAbility('deathray'); p.damage *= 1.2; } },
    { name: 'Seeker Swarm', desc: 'Missiles (+Homing)', apply: (p) => { p.addAbility('swarm'); p.homing++; } },
    { name: 'Inferno', desc: 'Fire Breath', apply: (p) => { p.addAbility('inferno'); p.piercing++; } },
    { name: 'Gravity Well', desc: 'Black Holes', apply: (p) => { p.addAbility('gravity'); p.vortex = (p.vortex || 1) + 1; } },
    { name: 'Sentry Turret', desc: 'Place Turret (+Defense)', apply: (p) => { p.addAbility('sentry'); p.knockback = (p.knockback || 0) + 5; } },
    { name: 'Mines', desc: 'Explosive Mines (+Blast)', apply: (p) => { p.addAbility('mines'); p.blastRadius = (p.blastRadius || 0) + 20; } },
    { name: 'Orbital Laser', desc: 'Nuke Strike', apply: (p) => { p.addAbility('orbital'); p.blastRadius = (p.blastRadius || 0) + 40; } },
    { name: 'Chrono Breaker', desc: 'Stop Time', apply: (p) => { p.addAbility('chrono'); p.speed *= 1.1; } }
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
