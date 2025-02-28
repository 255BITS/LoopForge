// Game state - Fantasy Quest: The Incremental Adventure
const game = {
    gold: 0,
    clickPower: 1,
    autoGoldRate: 0,
    playerLevel: 1,
    experience: 0,
    experienceNeeded: 100,
    attackPower: 1,
    defense: 0,
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    healingPotions: 0,
    manaPotions: 0,
    dungeonProgress: 0,
    currentDungeon: null,
    lastSaved: null,
    notifications: [],
    
    // Achievements system implementation
    achievements: [
        {
            id: "goldHoarder1",
            name: "Gold Hoarder I",
            description: "Collect 1,000 gold",
            requirement: function(game) { return game.gold >= 1000; },
            rewardType: "attackBonus",
            rewardValue: 2,
            earned: false
        },
        {
            id: "goldHoarder2",
            name: "Gold Hoarder II",
            description: "Collect 10,000 gold",
            requirement: function(game) { return game.gold >= 10000; },
            rewardType: "attackBonus",
            rewardValue: 5,
            earned: false
        },
        {
            id: "monsterSlayer1",
            name: "Monster Slayer I",
            description: "Defeat 10 enemies",
            counter: 0,
            targetValue: 10,
            rewardType: "defenseBonus",
            rewardValue: 3,
            earned: false
        },
        {
            id: "adventurer1",
            name: "Adventurer I",
            description: "Complete 5 adventures",
            counter: 0,
            targetValue: 5,
            rewardType: "maxHealthBonus",
            rewardValue: 50,
            earned: false
        }
    ],
    
    // Current enemy state
    enemy: {
        active: false,
        name: "",
        currentHP: 0,
        maxHP: 0,
        attack: 0,
        defense: 0,
        isBoss: false,
        goldReward: 0,
        expReward: 0,
        isAttacking: false,
        isStunned: false,
        onDefeat: null
    },
    
    // Player equipment
    equipment: {
        weapon: null,
        armor: null,
        accessory: null
    },
    
    // Available upgrades
    upgrades: [
        {
            id: "clickUpgrade",
            name: "Mining Efficiency",
            description: "Increases gold per click",
            baseCost: 10,
            costMultiplier: 1.5,
            level: 0,
            maxLevel: 50,
            effect: level => level * 1.5,
            applyEffect: function(game) {
                game.clickPower = 1 + this.effect(this.level);
            }
        },
        {
            id: "autoGoldUpgrade",
            name: "Hire Dwarf Miners",
            description: "Automatically generates gold over time",
            baseCost: 50,
            costMultiplier: 1.7,
            level: 0,
            maxLevel: 50,
            effect: level => level * 0.5,
            applyEffect: function(game) {
                game.autoGoldRate = this.effect(this.level);
            }
        },
        {
            id: "attackUpgrade",
            name: "Sharpen Weapon",
            description: "Increases attack power",
            baseCost: 100,
            costMultiplier: 1.6,
            level: 0,
            maxLevel: 50,
            effect: level => level * 2,
            applyEffect: function(game) {
                game.attackPower = 1 + this.effect(this.level);
            }
        },
        {
            id: "defenseUpgrade",
            name: "Reinforce Armor",
            description: "Increases defense",
            baseCost: 120,
            costMultiplier: 1.6,
            level: 0,
            maxLevel: 50,
            effect: level => level,
            applyEffect: function(game) {
                game.defense = this.effect(this.level);
            }
        },
        {
            id: "healthUpgrade",
            name: "Vitality Training",
            description: "Increases maximum health",
            baseCost: 150,
            costMultiplier: 1.5,
            level: 0,
            maxLevel: 50,
            effect: level => level * 10,
            applyEffect: function(game) {
                const oldMax = game.maxHealth;
                game.maxHealth = 100 + this.effect(this.level);
                // Increase current health proportionally
                if (oldMax > 0) {
                    game.health = Math.floor(game.health * (game.maxHealth / oldMax));
                } else {
                    game.health = game.maxHealth;
                }
            }
        },
        {
            id: "manaUpgrade",
            name: "Arcane Studies",
            description: "Increases maximum mana",
            baseCost: 180,
            costMultiplier: 1.6,
            level: 0,
            maxLevel: 50,
            effect: level => level * 5,
            applyEffect: function(game) {
                const oldMax = game.maxMana;
                game.maxMana = 50 + this.effect(this.level);
                // Increase current mana proportionally if oldMax is not zero
                if (oldMax > 0) {
                    game.mana = Math.floor(game.mana * (game.maxMana / oldMax));
                } else {
                    game.mana = game.maxMana;
                }
            }
        }
    ],
    
    // Items that can be found or purchased
    items: [
        {
            id: "healingPotion",
            name: "Healing Potion",
            description: "Restores 40% of max health",
            type: "consumable",
            cost: 50,
            effect: function(game) {
                return Math.floor(game.maxHealth * 0.4);
            }
        },
        {
            id: "manaPotion",
            name: "Mana Potion",
            description: "Restores 40% of max mana",
            type: "consumable",
            cost: 75,
            effect: function(game) {
                return Math.floor(game.maxMana * 0.4);
            }
        },
        {
            id: "ironSword",
            name: "Iron Sword",
            description: "A basic but reliable weapon",
            type: "weapon",
            cost: 200,
            attackBonus: 5,
            defenseBonus: 0
        },
        {
            id: "steelArmor",
            name: "Steel Armor",
            description: "Solid protection for any adventurer",
            type: "armor",
            cost: 350,
            attackBonus: 0,
            defenseBonus: 8
        },
        {
            id: "luckyAmulet",
            name: "Lucky Amulet",
            description: "Increases gold and experience gains",
            type: "accessory",
            cost: 500,
            goldBonus: 0.1,
            expBonus: 0.1
        }
    ],
    
    // Available adventures
    adventures: [
        {
            id: "caveExploration",
            name: "Explore the Mystic Cave",
            description: "Search for treasures in a mysterious cave",
            cost: 100,
            minReward: 80,
            maxReward: 200,
            successRate: 0.7,
            expReward: 20,
            levelRequired: 1
        },
        {
            id: "forestHunt",
            name: "Hunt in Enchanted Forest",
            description: "Hunt for magical creatures and valuable resources",
            cost: 300,
            minReward: 200,
            maxReward: 500,
            successRate: 0.6,
            expReward: 40,
            levelRequired: 3
        },
        {
            id: "dungeonRaid",
            name: "Raid Ancient Dungeon",
            description: "Brave the dangers of an ancient dungeon for epic loot",
            cost: 800,
            minReward: 500,
            maxReward: 1500,
            successRate: 0.5,
            expReward: 100,
            levelRequired: 5
        },
        {
            id: "mountainClimb",
            name: "Scale the Frost Mountains",
            description: "Brave the icy peaks for rare treasures",
            cost: 1500,
            minReward: 1000,
            maxReward: 3000,
            successRate: 0.45,
            expReward: 200,
            levelRequired: 8
        },
        {
            id: "dragonLair",
            name: "Infiltrate Dragon's Lair",
            description: "The ultimate adventure with legendary rewards",
            cost: 5000,
            minReward: 3000,
            maxReward: 10000,
            successRate: 0.3,
            expReward: 500,
            levelRequired: 15
        }
    ],
    
    // Skills the player can use
    skills: [
        {
            id: "slash",
            name: "Slash",
            description: "A basic attack with your weapon",
            manaCost: 0,
            cooldown: 0,
            damage: level => level * 2.2,
            level: 1,
            maxLevel: 10,
            levelUpCost: level => level * 100,
            unlockLevel: 1
        },
        {
            id: "fireball",
            name: "Fireball",
            description: "Launch a ball of fire at your enemy",
            manaCost: 15,
            cooldown: 3,
            damage: level => level * 4.0, // Increased damage for better balance
            level: 0,
            maxLevel: 10,
            levelUpCost: level => level * 150,
            unlockLevel: 3
        },
        {
            id: "healingLight",
            name: "Healing Light",
            description: "Restore your health using divine magic",
            manaCost: 20,
            cooldown: 5,
            healing: level => level * 30,
            level: 0,
            maxLevel: 10,
            levelUpCost: level => level * 200,
            unlockLevel: 5
        },
        {
            id: "whirlwind",
            name: "Whirlwind",
            description: "Spin your weapon in a deadly arc",
            manaCost: 30,
            cooldown: 10,
            damage: level => level * 5,
            level: 0,
            maxLevel: 10,
            specialEffect: "stun", // New feature: stun enemies
            levelUpCost: level => level * 300,
            unlockLevel: 8
        },
        {
            id: "lightningStrike",
            name: "Lightning Strike",
            description: "Call down lightning on your foes",
            manaCost: 45,
            cooldown: 15,
            damage: level => level * 8,
            level: 0,
            maxLevel: 10,
            specialEffect: "chain", // New feature: chain damage
            areaEffect: true,
            chainFactor: 0.5, // Each subsequent hit does 50% damage
            levelUpCost: level => level * 300,
            unlockLevel: 8
        }
    ],
    
    // Enemy types by level range
    enemyTypes: [
        {
            name: "Goblin",
            minLevel: 1,
            maxLevel: 3,
            baseHP: 20,
            baseAttack: 2,
            baseDefense: 1,
            baseGoldReward: 15,
            baseExpReward: 10
        },
        {
            name: "Wolf",
            minLevel: 1,
            maxLevel: 4,
            baseHP: 25,
            baseAttack: 3,
            baseDefense: 1,
            baseGoldReward: 20,
            baseExpReward: 15
        },
        {
            name: "Bandit",
            minLevel: 2,
            maxLevel: 5,
            baseHP: 35,
            baseAttack: 4,
            baseDefense: 2,
            baseGoldReward: 30,
            baseExpReward: 20
        },
        {
            name: "Skeleton",
            minLevel: 3,
            maxLevel: 7,
            baseHP: 40,
            baseAttack: 5,
            baseDefense: 2,
            baseGoldReward: 40,
            baseExpReward: 25
        },
        {
            name: "Orc",
            minLevel: 4,
            maxLevel: 8,
            baseHP: 60,
            baseAttack: 7,
            baseDefense: 3,
            baseGoldReward: 60,
            baseExpReward: 35
        },
        {
            name: "Troll",
            minLevel: 6,
            maxLevel: 10,
            baseHP: 100,
            baseAttack: 10,
            baseDefense: 5,
            baseGoldReward: 100,
            baseExpReward: 50
        },
        {
            name: "Dark Mage",
            minLevel: 8,
            maxLevel: 12,
            baseHP: 80,
            baseAttack: 15,
            baseDefense: 4,
            baseGoldReward: 150,
            baseExpReward: 70
        },
        {
            name: "Wyvern",
            minLevel: 10,
            maxLevel: 15,
            baseHP: 150,
            baseAttack: 20,
            baseDefense: 7,
            baseGoldReward: 250,
            baseExpReward: 100
        },
        {
            name: "Ancient Golem",
            minLevel: 12,
            maxLevel: 18,
            baseHP: 200,
            baseAttack: 25,
            baseDefense: 12,
            baseGoldReward: 350,
            baseExpReward: 150
        },
        {
            name: "Dragon",
            minLevel: 15,
            maxLevel: 25,
            baseHP: 500,
            baseAttack: 35,
            baseDefense: 15,
            baseGoldReward: 1000,
            baseExpReward: 300
        }
    ],
    
    // Cooldowns for skills
    skillCooldowns: {
        slash: 0,
        fireball: 0,
        healingLight: 0,
        whirlwind: 0,
        lightningStrike: 0
    },
    
    // Last time the game was updated
    lastUpdate: Date.now(),
    
    // Dungeons for progression
    dungeons: [
        {
            id: "goblinCaves",
            name: "Goblin Caves",
            description: "A network of caves inhabited by goblins",
            levelRequired: 1,
            enemyTypes: ["Goblin", "Wolf"],
            stages: 5,
            bossName: "Goblin Chieftain",
            rewards: {gold: 200, exp: 100, item: "Rusty Sword"}
        },
        {
            id: "hauntedForest",
            name: "Haunted Forest",
            description: "An ancient forest filled with undead creatures",
            levelRequired: 5,
            enemyTypes: ["Skeleton", "Bandit", "Wolf"],
            stages: 8,
            bossName: "Forest Wraith",
            rewards: {gold: 500, exp: 250, item: "Enchanted Bow"}
        },
        {
            id: "dragonPeak",
            name: "Dragon's Peak",
            description: "The treacherous mountain home of the ancient dragon",
            levelRequired: 15,
            enemyTypes: ["Troll", "Dark Mage", "Wyvern"],
            stages: 10,
            bossName: "Elder Dragon",
            rewards: {gold: 2000, exp: 1000, item: "Dragon Scale Armor"}
        }
    ],
    
    // Shop items
    shopItems: [
        {
            id: "healingPotion",
            name: "Healing Potion",
            description: "Restores 40% of your max health",
            cost: 50,
            available: true
        },
        {
            id: "manaPotion",
            name: "Mana Potion",
            description: "Restores 40% of your max mana",
            cost: 75,
            available: true
        },
        {
            id: "ironSword",
            name: "Iron Sword",
            description: "+5 Attack Power",
            cost: 200,
            available: true,
            onPurchase: function(game) {
                game.attackPower += 5;
                game.equipment.weapon = "Iron Sword";
                showNotification("You equipped the Iron Sword!", 'item');
                updateUI();
            }
        }
    ],
    
    // Quests
    quests: [
        {
            id: "quest1",
            name: "The Missing Artifacts",
            description: "Find 3 ancient artifacts hidden in the Mystic Cave",
            requirements: {
                adventure: "caveExploration",
                completions: 3
            },
            rewards: {
                gold: 300,
                exp: 50,
                item: "healingPotion",
                itemQuantity: 2
            },
            completed: false,
            progress: 0
        },
        {
            id: "quest2",
            name: "Goblin Threat",
            description: "Defeat 5 goblins that are threatening the village",
            requirements: { enemyType: "Goblin", count: 5 },
            rewards: { gold: 200, exp: 100, attackBonus: 2 },
            completed: false,
            progress: 0
        }
    ]
};

// Helper functions
function calculateUpgradeCost(upgrade) {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
}

function canAffordUpgrade(upgrade) {
    return game.gold >= calculateUpgradeCost(upgrade) && upgrade.level < upgrade.maxLevel;
}

function purchaseUpgrade(upgradeId) {
    const upgrade = game.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;
    
    const cost = calculateUpgradeCost(upgrade);
    
    if (game.gold >= cost && upgrade.level < upgrade.maxLevel) {
        game.gold -= cost;
        upgrade.level++;
        // Apply the effects of skill level up if applicable
        if (upgrade.id === 'slash' || upgrade.id === 'fireball' || upgrade.id === 'whirlwind' || upgrade.id === 'lightningStrike') {
            showNotification(`${upgrade.name} now deals more damage!`, 'skill');
        } else if (upgrade.id === 'healingLight') {
            showNotification(`${upgrade.name} now heals for more health!`, 'skill');
        }
        upgrade.applyEffect(game);
        renderSkills();
        updateUI();
    }
}

function buyShopItem(itemId) {
    const item = game.shopItems.find(i => i.id === itemId);
    if (!item || !item.available) return;
    
    if (game.gold >= item.cost) {
        game.gold -= item.cost;
        
        if (item.id === "healingPotion") {
            game.healingPotions++;
            showNotification("Purchased a healing potion!", 'item');
        } else if (item.id === "manaPotion") {
            game.manaPotions++;
            showNotification("Purchased a mana potion!", 'item');
        } else if (item.onPurchase) {
            item.onPurchase(game);
        }
        
        updateUI();
    } else {
        showNotification("Not enough gold!", 'warning');
    }
}

function goOnAdventure(adventureId) {
    const adventure = game.adventures.find(a => a.id === adventureId);
    if (!adventure) return;
    
    if (game.gold >= adventure.cost && game.playerLevel >= adventure.levelRequired) {
        document.getElementById('adventureButton' + adventure.id).disabled = true;
        game.gold -= adventure.cost;
        
        // Apply player stats to improve success chance
        const playerBonus = (game.attackPower + game.defense) / 50;
        const adjustedSuccessRate = Math.min(0.95, adventure.successRate + playerBonus);
        
        // Determine success based on success rate
        if (Math.random() < adjustedSuccessRate) {
            const reward = Math.floor(Math.random() * (adventure.maxReward - adventure.minReward + 1)) + adventure.minReward;
            // Apply gold bonus from equipment if any
            const goldBonus = game.equipment.accessory === "Lucky Amulet" ? 0.1 : 0;
            const finalReward = Math.floor(reward * (1 + goldBonus));
            game.gold += finalReward;
            checkForItemDrop(adventure);
            
            updateQuestProgressForAdventure(adventure.id);
            
            // Update achievement counter for adventures
            const adventurerAchievement = game.achievements.find(a => a.id === "adventurer1");
            if (adventurerAchievement && !adventurerAchievement.earned) {
                adventurerAchievement.counter++;
                if (adventurerAchievement.counter >= adventurerAchievement.targetValue) {
                    earnAchievement(adventurerAchievement.id);
                }
            }
            
            showNotification(`Success! You completed "${adventure.name}" and found ${reward} gold and gained ${adventure.expReward} experience.`, 'success');
        } else {
            // Return half the cost on failure to make it less punishing
            const refund = Math.floor(adventure.cost / 2);
            game.gold += refund;
            showNotification(`Failed! You weren't able to complete "${adventure.name}" and lost ${adventure.cost - refund} gold.`, 'failure');
        }
        addExperience(adventure.expReward);
        
        updateUI();
        
        // Re-enable the button after a delay
        setTimeout(() => {
            const button = document.getElementById('adventureButton' + adventure.id);
            if (button) button.disabled = false;
        }, 2000);
    }
}

function updateQuestProgressForAdventure(adventureId) {
    // Update quests that require completing specific adventures
    game.quests.forEach(quest => {
        if (!quest.completed && quest.requirements.adventure === adventureId) {
            quest.progress++;
            if (quest.progress >= quest.requirements.completions) {
                completeQuest(quest.id);
            }
        }
    });
}

function checkForItemDrop(adventure) {
    // Chance to find items based on adventure difficulty
    const dropChance = 0.1 + (adventure.levelRequired * 0.02);
    
    if (Math.random() < dropChance) {
        game.healingPotions += Math.floor(Math.random() * 2) + 1;
        showNotification("You found some healing potions!", 'item');
    }
    if (Math.random() < dropChance / 2) {
        game.manaPotions += 1;
        showNotification("You found a mana potion!", 'item');
    }
}

function findEnemy() {
    // Filter enemies appropriate for player level
    const possibleEnemies = game.enemyTypes.filter(
        enemy => game.playerLevel >= enemy.minLevel && game.playerLevel <= enemy.maxLevel
    );
    
    if (possibleEnemies.length === 0) {
        // If no suitable enemies, use the highest level enemies
        possibleEnemies.push(game.enemyTypes[game.enemyTypes.length - 1]);
    }
    
    // Select random enemy
    const enemyType = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
    
    // Scale enemy stats based on player level
    const levelFactor = 1 + (game.playerLevel - enemyType.minLevel) * 0.2;
    
    game.enemy.active = true;
    game.enemy.name = enemyType.name;
    game.enemy.maxHP = Math.floor(enemyType.baseHP * levelFactor);
    game.enemy.currentHP = game.enemy.maxHP;
    game.enemy.attack = Math.floor(enemyType.baseAttack * levelFactor);
    game.enemy.defense = Math.floor(enemyType.baseDefense * levelFactor);
    game.enemy.goldReward = Math.floor(enemyType.baseGoldReward * levelFactor);
    game.enemy.expReward = Math.floor(enemyType.baseExpReward * levelFactor);
    
    // Disable find enemy button during combat
    document.getElementById('findEnemyButton').disabled = true;
    
    document.getElementById('enemyContainer').style.display = 'block';
    updateEnemyUI();
}

function attackEnemy() {
    if (!game.enemy.active) return;
    
    const attackType = "normal";
    attackEnemyWithDamage(calculateDamage(attackType));
}

function useSkill(skillId) {
    if (!game.enemy.active) {
        showNotification("You need to find an enemy first!", 'warning');
        return false;
    }
    
    const skill = game.skills.find(s => s.id === skillId);
    if (!skill || skill.level === 0) {
        return false;
    }
    
    // Check cooldown
    if (game.skillCooldowns[skillId] > 0) {
        showNotification(`${skill.name} is on cooldown for ${Math.ceil(game.skillCooldowns[skillId])}s`, 'warning');
        return false;
    }
    
    if (game.mana < skill.manaCost) {
        showNotification("Not enough mana!", 'warning');
        return false;
    }
    
    // Spend mana and set cooldown
    game.mana -= skill.manaCost;
    game.skillCooldowns[skillId] = skill.cooldown;
    
    // Apply the skill effect
    if (skill.healing) {
        const healAmount = Math.floor(skill.healing(skill.level));
        healPlayer(healAmount);
    } else if (skill.damage) {
        const damage = calculateDamage("skill", skill);
        attackEnemyWithDamage(damage);
        
        // Apply special effects
        if (skill.specialEffect === "stun" && game.enemy.active) {
            // Stun the enemy for its next turn
            game.enemy.isStunned = true;
            showNotification(`${game.enemy.name} is stunned!`, 'combat');
        }
        
        if (skill.areaEffect && game.enemy.active) {
            // For now, just apply extra damage to the current enemy
            const chainDamage = Math.floor(damage * skill.chainFactor);
            attackEnemyWithDamage(chainDamage);
            showNotification(`Chain lightning deals an additional ${chainDamage} damage!`, 'combat');
        }
    }
    
    showNotification(`You used ${skill.name}!`, 'skill');
    updateSkillCooldowns();
    return true;
}

function updateSkillCooldowns() {
    // Update the UI to reflect cooldowns
    for (const skillId in game.skillCooldowns) {
        const cooldownElement = document.getElementById(`cooldown-${skillId}`);
        if (cooldownElement) {
            if (game.skillCooldowns[skillId] > 0) {
                cooldownElement.textContent = `(${Math.ceil(game.skillCooldowns[skillId])}s)`;
                cooldownElement.style.display = 'inline';
            } else {
                cooldownElement.style.display = 'none';
            }
        }
    }
}

function processSkillCooldowns(deltaTime) {
    // Reduce cooldowns based on time passed
    for (const skillId in game.skillCooldowns) {
        if (game.skillCooldowns[skillId] > 0) {
            game.skillCooldowns[skillId] = Math.max(0, game.skillCooldowns[skillId] - deltaTime);
        }
    }
    updateSkillCooldowns();
}

function calculateDamage(attackType, skill = null) {
    const damageVariation = 0.2; // 20% damage variation
    let baseDamage;
    let critChance = 0.05; // 5% base critical hit chance
    let critMultiplier = 2.0; // 2x damage on critical hit
    
    // Apply equipment bonuses to critical chance
    if (game.equipment.accessory === "Lucky Amulet") {
        critChance += 0.05; // +5% critical chance with Lucky Amulet
    }
    
    if (attackType === "normal") {
        baseDamage = Math.max(1, game.attackPower - game.enemy.defense / 2);
    } else if (attackType === "skill" && skill) {
        // Skills ignore some enemy defense
        const defenseReduction = 0.7; // Skills ignore 30% of enemy defense
        baseDamage = Math.max(1, (game.attackPower + skill.damage(skill.level)) - (game.enemy.defense * defenseReduction) / 2);
    }
    
    const randomFactor = 1 - damageVariation + Math.random() * damageVariation * 2;
    let damage = baseDamage * randomFactor;
    
    // Check for critical hit
    if (Math.random() < critChance) {
        damage *= critMultiplier;
        showNotification("CRITICAL HIT!", 'combat');
    }
    
    return Math.floor(damage);
}

function attackEnemyWithDamage(damage) {
    if (!game.enemy.active) return;
    
    game.enemy.currentHP -= damage;
    showNotification(`You hit the ${game.enemy.name} for ${damage} damage!`, 'combat');
    
    if (game.enemy.currentHP <= 0) {
        game.enemy.currentHP = 0;
        game.gold += game.enemy.goldReward;
        
        // Update achievements for monster kills
        const monsterSlayerAchievement = game.achievements.find(a => a.id === "monsterSlayer1");
        if (monsterSlayerAchievement && !monsterSlayerAchievement.earned) {
            monsterSlayerAchievement.counter++;
            if (monsterSlayerAchievement.counter >= monsterSlayerAchievement.targetValue) {
                earnAchievement(monsterSlayerAchievement.id);
            }
        }
        
        // Call the onDefeat callback if it exists (for dungeon progression)
        if (typeof game.enemy.onDefeat === 'function') {
            game.enemy.onDefeat();
            game.enemy.onDefeat = null;
        }
        
        // Check achievements after enemy defeat
        checkAchievements();
        
        showNotification(`You defeated the ${game.enemy.name} and gained ${game.enemy.goldReward} gold and ${game.enemy.expReward} experience!`, 'success');
        
        // Re-enable find enemy button
        document.getElementById('findEnemyButton').disabled = false;
        
        game.enemy.active = false;
        updateQuestProgress(game.enemy.name);
        document.getElementById('enemyContainer').style.display = 'none';
    } else {
        // Enemy counterattacks
        enemyAttack();
    }
    
    updateEnemyUI();
    updateUI();
}

function updateQuestProgress(enemyName) {
    // Update enemy defeat quests
    game.quests.forEach(quest => {
        if (!quest.completed && quest.requirements.enemyType === enemyName) {
            quest.progress++;
            if (quest.progress >= quest.requirements.count) {
                completeQuest(quest.id);
            }
        }
    });
}

function enemyAttack() {
    if (!game.enemy.active) return;
    
    // Check if enemy is stunned
    if (game.enemy.isStunned) {
        showNotification(`${game.enemy.name} is stunned and cannot attack!`, 'combat');
        game.enemy.isStunned = false; // Remove stun after skipping one attack
        return;
    }
    
    // Boss enemies have a chance to use special attacks
    if (game.enemy.isBoss && Math.random() < 0.3) {
        performBossSpecialAttack();
        return;
    }
    
    const damageVariation = 0.2; // 20% damage variation
    const baseDamage = Math.max(1, game.enemy.attack - (game.defense / 2));
    const randomFactor = 1 - damageVariation + Math.random() * damageVariation * 2;
    
    // Enemy has a small chance to miss
    if (Math.random() < 0.1) {
        showNotification(`The ${game.enemy.name} attacks but misses!`, 'combat');
        return;
    }
    
    const damage = Math.floor(baseDamage * randomFactor);
    
    let message;
    if (damage < 5) {
        message = `The ${game.enemy.name} grazes you for ${damage} damage.`;
    } else if (damage < 15) {
        message = `The ${game.enemy.name} hits you for ${damage} damage!`;
    } else {
        message = `The ${game.enemy.name} strikes you hard for ${damage} damage!`;
    }
    
    showNotification(message, 'damage');
    
    game.health -= damage;
    
    if (game.health <= 0) {
        game.health = 0;
        playerDeath();
    }
    
    updateUI();
}

function performBossSpecialAttack() {
    if (!game.enemy.active || !game.enemy.isBoss) return;
    
    const bossName = game.enemy.name;
    let damage = 0;
    let attackName = "";
    
    if (bossName.includes("Goblin")) {
        damage = Math.floor(game.enemy.attack * 1.5);
        attackName = "Frenzied Slash";
    } else if (bossName.includes("Wraith")) {
        damage = Math.floor(game.enemy.attack * 1.3);
        attackName = "Soul Drain";
        game.mana = Math.max(0, game.mana - Math.floor(game.maxMana * 0.2));
    } else if (bossName.includes("Dragon")) {
        damage = Math.floor(game.enemy.attack * 2);
        attackName = "Fire Breath";
    } else {
        damage = Math.floor(game.enemy.attack * 1.7);
        attackName = "Power Attack";
    }
    
    game.health -= damage;
    showNotification(`${bossName} uses ${attackName} for ${damage} damage!`, 'damage');
}

function playerDeath() {
    showNotification("You have been defeated! You lost some gold and have been revived in the village.", 'failure');
    document.getElementById('findEnemyButton').disabled = false;
    
    const goldLost = Math.floor(game.gold * 0.2);
    game.gold = Math.max(0, game.gold - goldLost);
    
    game.health = game.maxHealth;
    
    game.enemy.active = false;
    document.getElementById('enemyContainer').style.display = 'none';
    
    updateUI();
}

function completeQuest(questId) {
    const quest = game.quests.find(q => q.id === questId);
    if (!quest || quest.completed) return;
    
    quest.completed = true;
    
    if (quest.rewards.gold) game.gold += quest.rewards.gold;
    if (quest.rewards.exp) addExperience(quest.rewards.exp);
    if (quest.rewards.attackBonus) game.attackPower += quest.rewards.attackBonus;
    
    if (quest.rewards.item === "healingPotion") {
        game.healingPotions += (quest.rewards.itemQuantity || 1);
    } else if (quest.rewards.item === "manaPotion") {
        game.manaPotions += (quest.rewards.itemQuantity || 1);
    }
    
    showNotification(`Quest Complete: ${quest.name}! You received your rewards.`, 'quest');
    
    updateUI();
}

function addExperience(amount) {
    const expBonus = game.equipment.accessory === "Lucky Amulet" ? 0.1 : 0;
    const finalAmount = Math.floor(amount * (1 + expBonus));
    
    game.experience += finalAmount;
    
    let leveledUp = false;
    while (game.experience >= game.experienceNeeded) {
        game.experience -= game.experienceNeeded;
        game.playerLevel++;
        
        const oldExpNeeded = game.experienceNeeded;
        game.experienceNeeded = Math.floor(oldExpNeeded * 1.4);
        
        game.health = game.maxHealth;
        game.mana = game.maxMana;
        game.attackPower += 1;
        game.defense += 1;
        
        leveledUp = true;
        
        showNotification(`Level up! You are now level ${game.playerLevel}!`, 'levelup');
        healPlayer(game.maxHealth);
        checkSkillUnlocks();
    }
    
    if (leveledUp) {
        renderSkills();
    }
    renderAdventures();
    
    updateUI();
}

function checkSkillUnlocks() {
    let newSkills = false;
    
    game.skills.forEach(skill => {
        if (skill.level === 0 && game.playerLevel >= skill.unlockLevel) {
            skill.level = 1;
            newSkills = true;
            showNotification(`New skill unlocked: ${skill.name}!`, 'unlock');
        }
    });
    
    return newSkills;
}

function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    
    game.notifications.push({
        message,
        type,
        time: new Date().toLocaleTimeString()
    });
    
    if (game.notifications.length > 100) {
        game.notifications.shift();
    }
    
    updateNotifications();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notifications.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notifications.contains(notification)) {
                notifications.removeChild(notification);
            }
        }, 500);
    }, 3500);
}

function updateNotifications() {
    const logContainer = document.getElementById('gameLog');
    if (!logContainer) return;
    
    logContainer.innerHTML = '';
    
    const recentNotifications = game.notifications.slice(-10).reverse();
    
    recentNotifications.forEach(notification => {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${notification.type}`;
        logEntry.innerHTML = `<span class="log-time">[${notification.time}]</span> ${notification.message}`;
        logContainer.appendChild(logEntry);
    });
}

function saveGame(event) {
    localStorage.setItem('fantasyRPGSave', JSON.stringify(game));
    game.lastSaved = new Date();
    
    if (event && event.type === 'click')
        showNotification("Game saved successfully!", "success");
}

function resetGame() {
    if (confirm("Are you sure you want to reset your game? All progress will be lost!")) {
        localStorage.removeItem('fantasyRPGSave');
        location.reload();
    }
}

function loadGame() {
    const savedGame = localStorage.getItem('fantasyRPGSave');
    if (savedGame) {
        const loadedGame = JSON.parse(savedGame);
        loadedGame.lastUpdate = Date.now();
        
        Object.assign(game, loadedGame);
        updateUI();
        
        renderUpgrades();
        renderSkills();
        renderDungeons();
        renderShop();
        updateEnemyUI();
        showNotification("Game loaded successfully!", "success");
    } else {
        showNotification("No saved game found.", "warning");
    }
}

function updateUI() {
    document.getElementById('gold').textContent = Math.floor(game.gold);
    document.getElementById('clickPowerDisplay').textContent = game.clickPower;
    document.getElementById('playerLevel').textContent = game.playerLevel;
    document.getElementById('experience').textContent = Math.floor(game.experience);
    document.getElementById('experienceNeeded').textContent = game.experienceNeeded;
    document.getElementById('autoGoldRate').textContent = game.autoGoldRate;
    document.getElementById('attackPower').textContent = game.attackPower;
    document.getElementById('expPercentage').style.width = `${(game.experience / game.experienceNeeded) * 100}%`;
    document.getElementById('defense').textContent = game.defense.toFixed(1);
    
    document.getElementById('health').textContent = Math.floor(game.health);
    document.getElementById('maxHealth').textContent = game.maxHealth;
    document.getElementById('healthBar').style.width = `${(game.health / game.maxHealth) * 100}%`;
    
    document.getElementById('mana').textContent = Math.floor(game.mana);
    document.getElementById('maxMana').textContent = game.maxMana;
    document.getElementById('manaBar').style.width = `${(game.mana / game.maxMana) * 100}%`;
    
    document.getElementById('healingPotions').textContent = game.healingPotions;
    document.getElementById('manaPotions').textContent = game.manaPotions;
    
    renderAdventures();
    renderUpgrades();
    updateNotifications();
}

function updateEnemyUI() {
    if (game.enemy.active) {
        document.getElementById('enemyName').textContent = game.enemy.name;
        document.getElementById('enemyCurrentHP').textContent = game.enemy.currentHP;
        document.getElementById('enemyMaxHP').textContent = game.enemy.maxHP;
        
        const healthPercentage = (game.enemy.currentHP / game.enemy.maxHP) * 100;
        const healthBar = document.getElementById('enemyHealth');
        if (healthBar) {
            healthBar.style.width = `${healthPercentage}%`;
        }
        
        document.getElementById('enemyAttack').textContent = game.enemy.attack;
        document.getElementById('enemyHealth').style.width = `${healthPercentage}%`;
    } else {
        document.getElementById('enemyContainer').style.display = 'none';
    }
}

function renderUpgrades() {
    const container = document.getElementById('upgradesContainer');
    container.innerHTML = '';
    
    game.upgrades.forEach(upgrade => {
        const cost = calculateUpgradeCost(upgrade);
        const disabled = game.gold < cost || upgrade.level >= upgrade.maxLevel;
        
        const upgradeElement = document.createElement('div');
        upgradeElement.className = disabled ? 'upgrade disabled' : 'upgrade';
        upgradeElement.innerHTML = `
            <div class="upgrade-header">
                <h3>${upgrade.name}</h3>
                <span class="upgrade-level">Level ${upgrade.level}${upgrade.maxLevel ? '/' + upgrade.maxLevel : ''}</span>
            </div>
            <p class="upgrade-desc">${upgrade.description}</p>
            <div class="upgrade-footer">
                <span class="upgrade-cost">${cost} gold</span>
                <button ${disabled ? 'disabled' : ''} onclick="purchaseUpgrade('${upgrade.id}')">
                    ${upgrade.level >= upgrade.maxLevel ? 'MAXED' : 'Purchase'}
                </button>
            </div>
        `;
        
        container.appendChild(upgradeElement);
    });
}

function renderAdventures() {
    const container = document.getElementById('adventuresContainer');
    container.innerHTML = '';
    
    game.adventures.forEach(adventure => {
        const disabled = game.gold < adventure.cost || game.playerLevel < adventure.levelRequired;
        
        const adventureElement = document.createElement('div');
        adventureElement.className = disabled ? 'adventure disabled' : 'adventure';
        adventureElement.innerHTML = `
            <div class="adventure-header">
                <h3>${adventure.name}</h3>
                ${adventure.levelRequired > game.playerLevel ? 
                    `<span class="level-req">Requires Level ${adventure.levelRequired}</span>` : 
                    `<span class="level-ok">Level ${adventure.levelRequired}+</span>`
                }
            </div>
            <p class="adventure-desc">${adventure.description}</p>
            <div class="adventure-stats">
                <div class="stat"><span class="stat-label">Cost:</span> ${adventure.cost} gold</div>
                <div class="stat"><span class="stat-label">Reward:</span> ${adventure.minReward}-${adventure.maxReward} gold</div>
                <div class="stat"><span class="stat-label">XP:</span> ${adventure.expReward}</div>
                <div class="stat"><span class="stat-label">Success:</span> ${Math.round(adventure.successRate * 100)}%</div>
            </div>
            <button id="adventureButton${adventure.id}" class="adventure-btn" ${disabled ? 'disabled' : ''} onclick="goOnAdventure('${adventure.id}')">Embark</button>
            <div class="cooldown-timer" id="adventureCooldown-${adventure.id}" style="display: none;"></div>
        `;
        
        container.appendChild(adventureElement);
    });
}

function renderSkills() {
    const container = document.getElementById('skillsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    game.skills.forEach(skill => {
        if (skill.level === 0 && game.playerLevel < skill.unlockLevel) {
            const lockedSkill = document.createElement('div');
            lockedSkill.className = 'skill locked';
            lockedSkill.innerHTML = `
                <div class="skill-header">
                    <h3>??? (Unlocks at Level ${skill.unlockLevel})</h3>
                </div>
                <p class="skill-desc">This skill is not yet unlocked.</p>
            `;
            container.appendChild(lockedSkill);
            return;
        }
        
        const levelUpCost = skill.levelUpCost(skill.level);
        const canLevelUp = game.gold >= levelUpCost && skill.level < skill.maxLevel;
        const onCooldown = game.skillCooldowns[skill.id] > 0;
        
        const skillElement = document.createElement('div');
        skillElement.className = skill.level === 0 ? 'skill locked' : 'skill';
        
        let damageOrHealing = '';
        if (skill.damage) {
            damageOrHealing = `Damage: ${Math.floor(skill.damage(skill.level))}`;
        } else if (skill.healing) {
            damageOrHealing = `Healing: ${Math.floor(skill.healing(skill.level))}`;
        }
        
        skillElement.innerHTML = `
            <div class="skill-header">
                <h3>${skill.name}</h3>
                <span class="skill-level">Level ${skill.level}/${skill.maxLevel}</span>
            </div>
            <p class="skill-desc">${skill.description}</p>
            <div class="skill-stats">
                <div class="stat"><span class="stat-label">Mana:</span> ${skill.manaCost}</div>
                <div class="stat"><span class="stat-label">Cooldown:</span> ${skill.cooldown}s</div>
                <div class="stat"><span id="cooldown-${skill.id}" class="cooldown" style="display: none;"></span></div>
                <div class="stat"><span class="stat-label">${damageOrHealing}</span></div>
            </div>
            <div class="skill-footer">
                ${skill.level < skill.maxLevel ? 
                    `<button class="use-skill" ${canLevelUp ? '' : 'disabled'} 
                     onclick="upgradeSkill('${skill.id}')">
                        Upgrade (${levelUpCost} gold)
                     </button>` : 
                    '<span class="max-level">MAXED</span>'
                }
                <button class="use-skill" ${(game.enemy.active && game.mana >= skill.manaCost && !onCooldown) ? '' : 'disabled'} 
                 onclick="useSkill('${skill.id}')">Use</button>
            </div>
        `;
        
        container.appendChild(skillElement);
    });
}

function upgradeSkill(skillId) {
    const skill = game.skills.find(s => s.id === skillId);
    if (!skill) return;
    
    const cost = skill.levelUpCost(skill.level);
    if (game.gold >= cost && skill.level < skill.maxLevel) {
        game.gold -= cost;
        skill.level++;
        
        if (skill.id === 'slash' || skill.id === 'fireball' || skill.id === 'whirlwind' || skill.id === 'lightningStrike') {
            showNotification(`${skill.name} now deals more damage!`, 'skill');
        } else if (skill.id === 'healingLight') {
            showNotification(`${skill.name} now heals for more health!`, 'skill');
        }
        
        renderSkills();
        updateUI();
    }
}

function renderShop() {
    const container = document.getElementById('shopContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    game.shopItems.forEach(item => {
        const disabled = game.gold < item.cost || !item.available;
        
        const itemElement = document.createElement('div');
        itemElement.className = disabled ? 'shop-item disabled' : 'shop-item';
        itemElement.innerHTML = `
            <div class="shop-item-header">
                <h3>${item.name}</h3>
                <span class="shop-item-cost">${item.cost} gold</span>
            </div>
            <p class="shop-item-desc">${item.description}</p>
            <button class="shop-buy-btn" ${disabled ? 'disabled' : ''} 
             onclick="buyShopItem('${item.id}')">Buy</button>
        `;
        
        container.appendChild(itemElement);
    });
}

function renderDungeons() {
    const container = document.getElementById('dungeonsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    game.dungeons.forEach(dungeon => {
        const disabled = game.playerLevel < dungeon.levelRequired;
        const dungeonElement = document.createElement('div');
        dungeonElement.className = disabled ? 'dungeon locked' : 'dungeon';
        dungeonElement.innerHTML = `
            <div class="dungeon-header">
                <h3>${dungeon.name}</h3>
                <span class="dungeon-level">Requires Level ${dungeon.levelRequired}</span>
            </div>
            <p class="dungeon-desc">${dungeon.description}</p>
            <div class="dungeon-stats">
                <div class="stat"><span class="stat-label">Stages:</span> ${dungeon.stages}</div>
                <div class="stat"><span class="stat-label">Boss:</span> ${dungeon.bossName}</div>
            </div>
            <div class="dungeon-rewards">
                <div class="stat"><span class="stat-label">Rewards:</span> ${dungeon.rewards.gold} gold, ${dungeon.rewards.exp} XP, ${dungeon.rewards.item}</div>
            </div>
            <button class="dungeon-btn" ${disabled ? 'disabled' : ''} onclick="enterDungeon('${dungeon.id}')">Enter Dungeon</button>
        `;
        container.appendChild(dungeonElement);
    });
}

function enterDungeon(dungeonId) {
    const dungeon = game.dungeons.find(d => d.id === dungeonId);
    if (!dungeon) return;
    
    if (game.playerLevel < dungeon.levelRequired) {
        showNotification(`You need to be level ${dungeon.levelRequired} to enter ${dungeon.name}!`, 'warning');
        return;
    }
    
    game.currentDungeon = dungeonId;
    game.dungeonProgress = 0;
    
    showNotification(`You have entered ${dungeon.name}! Prepare for battle!`, 'quest');
    
    progressDungeon();
}

function progressDungeon() {
    if (!game.currentDungeon) return;
    
    const dungeon = game.dungeons.find(d => d.id === game.currentDungeon);
    if (!dungeon) return;
    
    if (game.dungeonProgress >= dungeon.stages) {
        fightDungeonBoss(dungeon);
        return;
    }
    
    const possibleEnemies = game.enemyTypes.filter(e => dungeon.enemyTypes.includes(e.name));
    
    if (possibleEnemies.length === 0) {
        showNotification("No suitable enemies found in this dungeon!", 'warning');
        return;
    }
    
    const enemyType = possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)];
    
    const progressFactor = 1 + (game.dungeonProgress * 0.1);
    
    game.enemy.active = true;
    game.enemy.name = enemyType.name;
    game.enemy.maxHP = Math.floor(enemyType.baseHP * progressFactor);
    game.enemy.currentHP = game.enemy.maxHP;
    game.enemy.attack = Math.floor(enemyType.baseAttack * progressFactor);
    game.enemy.defense = Math.floor(enemyType.baseDefense * progressFactor);
    game.enemy.goldReward = Math.floor(enemyType.baseGoldReward * progressFactor);
    game.enemy.expReward = Math.floor(enemyType.baseExpReward * progressFactor);
    
    game.enemy.onDefeat = function() {
        game.dungeonProgress++;
        showNotification(`Dungeon progress: ${game.dungeonProgress}/${dungeon.stages}`, 'quest');
        
        setTimeout(progressDungeon, 1500);
    };
    
    document.getElementById('enemyContainer').style.display = 'block';
    updateEnemyUI();
    showNotification(`You encounter a ${game.enemy.name} in the dungeon!`, 'combat');
}

function fightDungeonBoss(dungeon) {
    const bossLevel = dungeon.levelRequired + 5;
    const bossFactor = 2.5;
    
    game.enemy.active = true;
    game.enemy.name = dungeon.bossName;
    game.enemy.maxHP = Math.floor(100 * bossFactor * (1 + (bossLevel * 0.2)));
    game.enemy.currentHP = game.enemy.maxHP;
    game.enemy.attack = Math.floor(10 * bossFactor * (1 + (bossLevel * 0.15)));
    game.enemy.defense = Math.floor(5 * bossFactor * (1 + (bossLevel * 0.1)));
    game.enemy.goldReward = Math.floor(dungeon.rewards.gold * 1.5);
    game.enemy.expReward = Math.floor(dungeon.rewards.exp * 1.5);
    
    game.enemy.isBoss = true;
    
    game.enemy.onDefeat = function() {
        game.gold += dungeon.rewards.gold;
        addExperience(dungeon.rewards.exp);
        
        if (dungeon.rewards.item) {
            if (dungeon.rewards.item === "Rusty Sword") {
                game.attackPower += 3;
                showNotification(`You found ${dungeon.rewards.item}! +3 Attack Power`, 'item');
            } else if (dungeon.rewards.item === "Enchanted Bow") {
                game.attackPower += 8;
                showNotification(`You found ${dungeon.rewards.item}! +8 Attack Power`, 'item');
            } else if (dungeon.rewards.item === "Dragon Scale Armor") {
                game.defense += 15;
                showNotification(`You found ${dungeon.rewards.item}! +15 Defense`, 'item');
            }
        }
        
        game.currentDungeon = null;
        showNotification(`You have defeated ${dungeon.bossName} and completed ${dungeon.name}!`, 'success');
    };
    
    document.getElementById('enemyContainer').style.display = 'block';
    updateEnemyUI();
    showNotification(`BOSS BATTLE: ${dungeon.bossName} appears!`, 'combat');
}

function checkAchievements() {
    game.achievements.forEach(achievement => {
        if (!achievement.earned) {
            let achieved = false;
            
            if (achievement.requirement) {
                achieved = achievement.requirement(game);
            } else if (achievement.counter !== undefined && achievement.targetValue) {
                achieved = achievement.counter >= achievement.targetValue;
            }
            
            if (achieved) {
                earnAchievement(achievement.id);
            }
        }
    });
}

function earnAchievement(achievementId) {
    const achievement = game.achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.earned) return;
    
    achievement.earned = true;
    
    if (achievement.rewardType === "attackBonus") {
        game.attackPower += achievement.rewardValue;
    } else if (achievement.rewardType === "defenseBonus") {
        game.defense += achievement.rewardValue;
    } else if (achievement.rewardType === "maxHealthBonus") {
        game.maxHealth += achievement.rewardValue;
        game.health += achievement.rewardValue;
    }
    
    showNotification(`Achievement Unlocked: ${achievement.name} - ${achievement.description}`, 'unlock');
}

// Game loop
setInterval(() => {
    const now = Date.now();
    const deltaTime = (now - game.lastUpdate) / 1000;
    const oldGold = game.gold;
    game.lastUpdate = now;
    
    game.gold += game.autoGoldRate * deltaTime;
    
    const healthRegenRate = game.enemy.active ? 0.002 : 0.01;
    const manaRegenRate = game.enemy.active ? 0.005 : 0.02;
    
    if (game.health < game.maxHealth) {
        game.health = Math.min(game.maxHealth, game.health + (game.maxHealth * healthRegenRate * deltaTime));
    }
    
    if (game.mana < game.maxMana) {
        game.mana = Math.min(game.maxMana, game.mana + (game.maxMana * manaRegenRate * deltaTime));
    }
    
    processSkillCooldowns(deltaTime);
    
    if (game.gold - oldGold > 100 || Math.floor(game.gold / 1000) > Math.floor(oldGold / 1000)) {
        checkAchievements();
    }
    
    updateUI();
}, 100);

function applyEquipmentEffects() {
    let baseAttack = 1;
    game.upgrades.forEach(upgrade => {
        if (upgrade.id === "attackUpgrade") {
            baseAttack += upgrade.effect(upgrade.level);
        }
    });
    
    let attackBonus = 0;
    let defenseBonus = 0;
    
    if (game.equipment.weapon === "Iron Sword") {
        attackBonus += 5;
    }
    
    if (game.equipment.armor === "Steel Armor") {
        defenseBonus += 8;
    }
    
    game.attackPower = Math.max(1, baseAttack + attackBonus);
    game.defense = Math.max(0, game.defense + defenseBonus);
    
    updateUI();
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            tab.classList.add('active');
            const contentId = tab.getAttribute('data-tab');
            document.getElementById(contentId).classList.add('active');
        });
    });
    
    if (tabs.length > 0) {
        tabs[0].click();
    }
}

function initEventListeners() {
    document.getElementById('findEnemyButton').addEventListener('click', findEnemy);
    document.getElementById('attackButton').addEventListener('click', attackEnemy);
    document.getElementById('useHealingPotionButton').addEventListener('click', useHealingPotion);
    document.getElementById('useManaPotionButton').addEventListener('click', useManaPotion);
    document.getElementById('saveButton').addEventListener('click', (e) => saveGame(e));
    document.getElementById('loadButton').addEventListener('click', loadGame);
    document.getElementById('resetButton').addEventListener('click', resetGame);
    document.getElementById('goldClick').addEventListener('click', () => { game.gold += game.clickPower; updateUI(); });
    
    setInterval(saveGame, 60000);
}

function healPlayer(amount) {
    if (game.health < game.maxHealth) {
        const oldHealth = game.health;
        game.health = Math.min(game.maxHealth, game.health + amount);
        const healed = game.health - oldHealth;
        showNotification(`You healed for ${healed} health.`, 'heal');
        updateUI();
        return true;
    }
    return false;
}

function useHealingPotion() {
    if (game.healingPotions > 0) {
        if (healPlayer(Math.floor(game.maxHealth * 0.4))) {
            game.healingPotions--;
            updateUI();
        } else {
            showNotification("You're already at full health!", 'info');
        }
    } else {
        showNotification("You don't have any healing potions!", 'warning');
    }
    updateUI();
}

function useManaPotion() {
    if (game.manaPotions > 0) {
        if (game.mana < game.maxMana) {
            const oldMana = game.mana;
            game.mana = Math.min(game.maxMana, game.mana + Math.floor(game.maxMana * 0.4));
            const restored = game.mana - oldMana;
            game.manaPotions--;
            showNotification(`You restored ${restored} mana.`, 'mana');
            updateUI();
        } else {
            showNotification("You're already at full mana!", 'info');
        }
    } else {
        showNotification("You don't have any mana potions!", 'warning');
    }
    updateUI();
}

window.onload = function() {
    setupTabs();
    initEventListeners();
    renderUpgrades();
    renderSkills();
    renderShop();
    renderDungeons();
    renderQuests();
    
    applyEquipmentEffects();
    
    game.lastUpdate = Date.now();
    
    const savedGame = localStorage.getItem('fantasyRPGSave');
    if (savedGame) {
        loadGame();
    }
    
    showNotification("Welcome to Fantasy Quest: The Incremental Adventure! Mine gold, battle monsters, and become a legend!", "info");
};
updateUI();