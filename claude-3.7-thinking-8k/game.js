// Game state
const game = {
    // Resources
    gold: 0,
    mana: { current: 10, max: 10 },
    manaRegenRate: 0.2, // Mana regenerates over time
    lastUpdate: Date.now(),
    xp: { current: 0, max: 100 },
    level: 1,
    
    // Player stats
    player: {
        health: { current: 50, max: 50 },
        attack: 5,
        defense: 3, 
        healthRegen: 0.1, // Health regenerates slightly over time
        critChance: 5, // 5% chance to land a critical hit
        critMultiplier: 1.5, // Critical hits do 50% more damage
        magic: 3,
        equipment: {
            weapon: { name: "Wooden Sword", attack: 1, cost: 0 },
            armor: { name: "Cloth Robes", defense: 1, cost: 0 },
            accessory: null
        }
    },
    
    // Enemy data
    enemy: {
        name: "Slime",
        level: 1,
        health: { current: 20, max: 20 },
        isDefeated: false,
        attack: 3,
        defense: 1,
        gold: 5,
        xp: 10,
        image: "https://i.imgur.com/NM9Qz6W.png"
    },
    
    // Inventory
    inventory: {
        healthPotions: 0,
        manaPotions: 0,
        materials: {},
        equippableItems: []
    },
    
    // Game progression
    currentArea: "forest",
    areas: {
        forest: {
            name: "Forest of Beginnings",
            levelRange: [1, 5],
            enemies: [
                { name: "Slime", health: 20, attack: 3, defense: 1, gold: 5, xp: 10, image: "https://i.imgur.com/NM9Qz6W.png" },
                { name: "Wolf", health: 30, attack: 5, defense: 2, gold: 8, xp: 15, image: "https://i.imgur.com/SITeG9a.png" }
            ]
        },
        caves: {
            name: "Goblin Caves",
            levelRange: [3, 8],
            enemies: [
                { name: "Goblin", health: 40, attack: 6, defense: 3, gold: 12, xp: 20, image: "https://i.imgur.com/4PkKkgB.png" },
                { name: "Bat", health: 25, attack: 4, defense: 1, gold: 7, xp: 15, image: "https://i.imgur.com/LEHW6ac.png" },
                { name: "Goblin Chief", health: 80, attack: 10, defense: 5, gold: 50, xp: 60, image: "https://i.imgur.com/zIhGNTg.png", isBoss: true }
            ],
            unlockLevel: 3
        },
        graveyard: {
            name: "Haunted Graveyard",
            levelRange: [5, 10],
            visited: false,
            enemies: [
                { name: "Skeleton", health: 50, attack: 8, defense: 3, gold: 15, xp: 25, image: "https://i.imgur.com/eveWnEf.png" },
                { name: "Ghost", health: 40, attack: 10, defense: 2, gold: 18, xp: 30, image: "https://i.imgur.com/BTm2Qvk.png" }
            ],
            unlockLevel: 5
        }
    },
    
    // Arena mode
    arena: {
        enabled: false,
        currentWave: 0,
        maxWave: 0,
        waveTimer: 30,
        waveTimeRemaining: 30,
        waveRewards: { gold: 0, xp: 0 },
        difficulty: 1
    },
    
    // Quests
    quests: {
        slimeExtermination: {
            title: "Slime Extermination",
            description: "Defeat 10 slimes",
            target: { name: "Slime", count: 10 },
            progress: 0,
            completed: false,
            rewards: { gold: 50, xp: 100 }
        },
        goblinRaid: {
            title: "Goblin Camp Raid",
            description: "Defeat the Goblin Chief",
            target: { name: "Goblin Chief", count: 1 },
            progress: 0,
            completed: false,
            rewards: { gold: 100, xp: 200, item: "Magic Ring" },
            unlockLevel: 3
        },
        skeletonHunter: {
            title: "Skeleton Hunter",
            description: "Defeat 15 skeletons in the Haunted Graveyard",
            target: { name: "Skeleton", count: 15 },
            progress: 0,
            completed: false,
            rewards: { gold: 150, xp: 300 },
            unlockLevel: 5
        },
        treasureHunter: {
            title: "Treasure Hunter",
            description: "Collect 200 gold from defeated enemies",
            target: { gold: 200 },
            progress: 0,
            completed: false,
            rewards: { gold: 100, xp: 150, item: "Treasure Hunter's Amulet" },
            unlockLevel: 1
        }
    },
    
    // Character classes
    classes: {
        warrior: {
            name: "Warrior",
            description: "Masters of weapon combat with high health and defense",
            statBonus: { health: 20, attack: 2, defense: 2 },
            abilities: ["Cleave", "Taunt"]
        },
        mage: {
            name: "Mage",
            description: "Masters of arcane magic with high mana and magic power",
            statBonus: { health: -10, mana: 20, magic: 4 },
            abilities: ["Frost Nova", "Arcane Missiles"]
        },
        rogue: {
            name: "Rogue",
            description: "Defeat the Goblin Chief",
            target: { name: "Goblin Chief", count: 1 },
            progress: 0,
            abilities: ["Stealth", "Backstab"]
        }
    },
    
    // Shop items
    shop: {
        // Weapons
        ironSword: { name: "Iron Sword", type: "weapon", attack: 7, cost: 50, description: "A sturdy iron sword" },
        steelSword: { name: "Steel Sword", type: "weapon", attack: 12, cost: 200, description: "A sharp steel blade" },
        enchantedSword: { name: "Enchanted Sword", type: "weapon", attack: 18, magic: 3, cost: 500, description: "A sword infused with magical energy" },
        
        // Armor
        leatherArmor: { name: "Leather Armor", type: "armor", defense: 5, cost: 50, description: "Basic protection made of leather" },
        plateArmor: { name: "Plate Armor", type: "armor", defense: 12, cost: 200, description: "Sturdy metal plates offering excellent protection" },
        enchantedArmor: { name: "Enchanted Robes", type: "armor", defense: 8, magic: 5, cost: 400, description: "Magical robes that enhance spellcasting" },
        
        // Consumables
        healthPotion: { name: "Health Potion", type: "consumable", health: 20, cost: 10, description: "Restores 20 health" },
        greaterHealthPotion: { name: "Greater Health Potion", type: "consumable", health: 50, cost: 30, description: "Restores 50 health" },
        manaPotion: { name: "Mana Potion", type: "consumable", mana: 15, cost: 15, description: "Restores 15 mana" },
        greaterManaPotion: { name: "Greater Mana Potion", type: "consumable", mana: 40, cost: 40, description: "Restores 40 mana" },
        
        // Accessories
        luckyAmulet: { name: "Lucky Amulet", type: "accessory", critChance: 5, cost: 150, description: "Increases critical hit chance by 5%" },
        silverRing: { name: "Silver Ring", type: "accessory", magic: 3, cost: 100, description: "Enhances magical abilities" },
        vitalityPendant: { name: "Vitality Pendant", type: "accessory", healthRegen: 0.2, cost: 200, description: "Increases health regeneration" },
        
        // Special items
        treasureHuntersAmulet: { name: "Treasure Hunter's Amulet", type: "accessory", goldBonus: 0.15, cost: 300, description: "Increases gold found by 15%" }
    },
    
    // Skills and abilities
    skills: {
        healthPotion: { name: "Health Potion", type: "consumable", health: 20, cost: 10 },
        greaterHealthPotion: { name: "Greater Health Potion", type: "consumable", health: 50, cost: 30 },
        greaterManaPotion: { name: "Greater Mana Potion", type: "consumable", mana: 40, cost: 40 }
    },
    
    // Game settings
    settings: {
        autoBattle: false,
        keepAutoBattle: false
    },
    
    // Game statistics
    stats: {
        monstersDefeated: 0,
        criticalHits: 0,
        damageDealt: 0,
        damageTaken: 0,
        goldEarned: 0,
        potionsUsed: 0
    },
};

let gameTickInterval;
let autoBattleInterval; // Store the interval for auto battle

document.addEventListener('DOMContentLoaded', () => {
    // Load game if available
    loadGame();
    
    // Start game ticking (for passive generation and cooldowns)
    gameTickInterval = setInterval(gameTick, TICK_INTERVAL);
    
    // Initialize the UI elements
    updateUI();
    setupEventListeners();
    updateShopDisplay();
});

const TICK_INTERVAL = 100; // Update every 100ms for smoother animations

// Game tick function - handles passive regeneration and timers
function gameTick() {
    const now = Date.now();
    const delta = (now - game.lastUpdate) / 1000; // Convert to seconds
    
    // Passive mana regeneration
    regenerateMana(delta);
    
    // Passive health regeneration (only when not in battle)
    if (game.enemy.health.current <= 0) {
        regenerateHealth(delta);
    }
    
    // Update arena timer if enabled
    if (game.arena.enabled && game.arena.waveTimeRemaining > 0) {
        game.arena.waveTimeRemaining -= delta;
        updateArenaUI();
    }
    
    // Update time
    game.lastUpdate = now;
    
    // Update UI frequently
    updateUI();
}

// Handle experience bar animation
function updateExperienceBar() {
    const experienceBar = document.getElementById('experience-bar');
    if (experienceBar) {
        const percentage = (game.xp.current / game.xp.max) * 100;
        experienceBar.style.width = `${percentage}%`;
        
        // Pulse animation when near level up
        if (percentage > 90) {
            experienceBar.classList.add('pulse-animation');
        } else {
            experienceBar.classList.remove('pulse-animation');
        }
    }
}

// Update the UI to reflect game state
function updateUI() {
    // Update resource numbers
    updateResources();
    
    // Update bars and visual elements
    updateVisualElements();
    
    document.getElementById('gold').textContent = formatNumber(game.gold);
    document.getElementById('mana').textContent = `${Math.floor(game.mana.current)}/${game.mana.max}`;
    document.getElementById('experience').textContent = `${Math.floor(game.xp.current)}/${game.xp.max}`;
    document.getElementById('level').textContent = game.level;
    
    // Update player stats
    document.getElementById('health').textContent = `${game.player.health.current}/${game.player.health.max}`;
    document.getElementById('health-bar').style.width = `${(game.player.health.current / game.player.health.max) * 100}%`;
    document.getElementById('attack').textContent = calculateTotalAttack();
    document.getElementById('defense').textContent = calculateTotalDefense();
    document.getElementById('magic').textContent = game.player.magic;
    document.getElementById('crit-chance').textContent = `${game.player.critChance}%`;
    
    // Update equipment
    if (game.player.equipment.weapon) {
        document.getElementById('weapon-slot').textContent = `Weapon: ${game.player.equipment.weapon.name} (+${game.player.equipment.weapon.attack} Atk)`;
    } else {
        document.getElementById('weapon-slot').textContent = `🗡️ Weapon: None`;
    }
    if (game.player.equipment.armor) {
        document.getElementById('armor-slot').textContent = `Armor: ${game.player.equipment.armor.name} (+${game.player.equipment.armor.defense} Def)`;
    }
    if (game.player.equipment.accessory) {
        document.getElementById('accessory-slot').textContent = `Accessory: ${game.player.equipment.accessory.name}`;
    } else {
        document.getElementById('accessory-slot').textContent = `💍 Accessory: None`;
    }
    
    // Update enemy info (only if there is an active enemy)
    updateEnemyUI();
    
    // Update quest progress for visible quests
    updateQuestDisplay();
    
    // Update inventory counts
    updateInventoryUI();
    
    // Update buttons state
    updateButtonStates();
    
    // Update shop
    updateShopDisplay();
    
    // Update area buttons
    updateAreaButtons();
    
    // Update game statistics
    updateStatistics();
    
    // Experience bar animation
    updateExperienceBar();
}

function updateQuestDisplay() {
    // Get all quest progress elements and update them
    const questElements = {
        'slime-quest-progress': game.quests.slimeExtermination,
        'goblin-quest-progress': game.quests.goblinRaid,
        'skeleton-quest-progress': game.quests.skeletonHunter,
        'treasure-quest-progress': game.quests.treasureHunter
    };
    
    for (const [elementId, quest] of Object.entries(questElements)) {
        const element = document.getElementById(elementId);
        if (element && quest) {
            if (quest.target.count) {
                element.textContent = `${quest.progress}/${quest.target.count}`;
            } else if (quest.target.gold) {
                element.textContent = `${quest.progress}/${quest.target.gold}`;
            }
        }
    }
}

function updateResources() {
    document.getElementById('gold').textContent = formatNumber(game.gold);
    document.getElementById('mana').textContent = `${Math.floor(game.mana.current)}/${game.mana.max}`;
    document.getElementById('experience').textContent = `${Math.floor(game.xp.current)}/${game.xp.max}`;
    document.getElementById('level').textContent = game.level;
}

function updateVisualElements() {
    // Health bar
    document.getElementById('health-bar').style.width = `${(game.player.health.current / game.player.health.max) * 100}%`;
    
    // Experience bar
    const expPercentage = (game.xp.current / game.xp.max) * 100;
    if (document.getElementById('exp-bar')) {
        document.getElementById('exp-bar').style.width = `${expPercentage}%`;
    }
}

function updateEnemyUI() {
    if (game.enemy) {
        document.getElementById('enemy-name').textContent = `${game.enemy.name} (Lvl ${game.enemy.level})`;
        document.getElementById('enemy-health').textContent = `${Math.max(0, Math.floor(game.enemy.health.current))}/${game.enemy.health.max}`;
        document.getElementById('enemy-health-bar').style.width = `${(game.enemy.health.current / game.enemy.health.max) * 100}%`;
        document.getElementById('enemy-level').textContent = game.enemy.level;
        document.getElementById('enemy-image').src = game.enemy.image;
        
        // Show/hide defeated overlay
        const enemyDefeatedOverlay = document.getElementById('enemy-defeated-overlay');
        if (enemyDefeatedOverlay) {
            enemyDefeatedOverlay.style.display = game.enemy.health.current <= 0 ? 'flex' : 'none';
        }
    }
}

function updateButtonStates() {
    // Update buttons state
    document.getElementById('heal-skill').disabled = game.mana.current < 5;
    document.getElementById('fireball-skill').disabled = game.mana.current < 8;
    document.getElementById('use-health-potion').disabled = game.inventory.healthPotions <= 0;
    document.getElementById('use-mana-potion').disabled = game.inventory.manaPotions <= 0;
}

function updateStatistics() {
    const statsElements = {
        'monsters-defeated': game.stats.monstersDefeated,
        'critical-hits': game.stats.criticalHits,
        'gold-earned': formatNumber(game.stats.goldEarned),
        'potions-used': game.stats.potionsUsed
    };
    
    Object.entries(statsElements).forEach(([id, value]) => {
        if (document.getElementById(id)) document.getElementById(id).textContent = value;
    });
}

function updateInventoryUI() {
    const healthCount = document.getElementById('health-potion-count');
    const manaCount = document.getElementById('mana-potion-count');
    if (healthCount) healthCount.textContent = game.inventory.healthPotions;
    if (manaCount) manaCount.textContent = game.inventory.manaPotions;
}

// Format numbers for UI display
function formatNumber(num) {
    if (isNaN(num)) return "0"; // Safety check
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    } else {
        return Math.floor(num);
    }
}

// Update shop display
function updateShopDisplay() {
    // Update equipment buttons
    const shopEquipment = [
        { type: 'weapon', id: 'buy-iron-sword', name: 'Iron Sword', cost: 50 },
        { type: 'weapon', id: 'buy-steel-sword', name: 'Steel Sword', cost: 200 },
        { type: 'weapon', id: 'buy-enchanted-sword', name: 'Enchanted Sword', cost: 500 },
    ];
    
    updateShopEquipment('armor', 'buy-leather-armor', 'Leather Armor', 50);
    updateShopEquipment('accessory', 'buy-silver-ring', 'Silver Ring', 100);
    
    // Update consumable buttons
    document.getElementById('buy-health-potion').disabled = game.gold < 10;
    document.getElementById('buy-mana-potion').disabled = game.gold < 15;
    
    // Check for and update additional shop items
    for (const item of shopEquipment) {
        const button = document.getElementById(item.id);
        if (button) updateShopEquipment(item.type, item.id, item.name, item.cost);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Battle buttons
    document.getElementById('attack-button').addEventListener('click', () => attack());
    document.getElementById('auto-battle').addEventListener('click', toggleAutoBattle);
    
    document.getElementById('heal-skill').addEventListener('click', () => useSkill('heal'));
    document.getElementById('heal-skill').addEventListener('mouseover', () => showTooltip('Heal: Restore health equal to 15 + (Magic × 3)'));
    document.getElementById('heal-skill').addEventListener('mouseout', () => hideTooltip());
    document.getElementById('fireball-skill').addEventListener('click', () => useSkill('fireball'));
    
    // Buy equipment buttons
    document.getElementById('buy-iron-sword').addEventListener('click', () => buyItem('ironSword'));
    document.getElementById('buy-leather-armor').addEventListener('click', () => buyItem('leatherArmor'));
    
    // Potion buttons
    document.getElementById('use-health-potion').addEventListener('click', () => useHealthPotion());
    document.getElementById('use-mana-potion').addEventListener('click', () => useManaPotion());
    
    // Shop buttons for consumables and accessory
    document.getElementById('buy-health-potion').addEventListener('click', () => buyItem('healthPotion'));
    document.getElementById('buy-mana-potion').addEventListener('click', () => buyItem('manaPotion'));
    document.getElementById('buy-silver-ring').addEventListener('click', () => buyItem('silverRing'));
    
    // Area travel buttons
    document.getElementById('travel-forest').addEventListener('click', () => travelToArea('forest'));
    document.getElementById('travel-caves').addEventListener('click', () => travelToArea('caves'));
    document.getElementById('travel-graveyard').addEventListener('click', () => travelToArea('graveyard'));
    
    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
        });
    });
    
    // Save game button
    document.getElementById('save-game').addEventListener('click', () => {
        saveGame();
        showNotification('Game saved successfully!');
    });
    
    // Reset game button
    document.getElementById('reset-game').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
            localStorage.removeItem('fantasyQuestSave');
            location.reload();
        }
    });
    
    // Arena mode button if it exists
    if (document.getElementById('start-arena')) {
        document.getElementById('start-arena').addEventListener('click', startArenaMode);
    }
    
    // Add event listeners for tooltips on all elements with data-tooltip attribute
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseover', function(e) {
            showTooltip(this.getAttribute('data-tooltip'), e.pageX, e.pageY);
        });
        
        element.addEventListener('mouseout', function() {
            hideTooltip();
        });
    });
}

// Function to update shop equipment buttons
function updateShopEquipment(type, buttonId, itemName, cost) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    const isEquipped = game.player.equipment[type] && game.player.equipment[type].name === itemName;
    const canAfford = game.gold >= cost;
    
    if (isEquipped) {
        button.textContent = "Equipped";
        button.disabled = true;
    } else {
        button.textContent = `Buy (${cost} gold)`;
        button.disabled = !canAfford;
    }
}

// Show tooltip for skill/item descriptions
function showTooltip(text, x, y) {
    let tooltip = document.getElementById('tooltip');
    
    // Create tooltip if it doesn't exist
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        tooltip.className = 'tooltip';
        document.body.appendChild(tooltip);
    }
    
    tooltip.innerHTML = text;
    tooltip.style.display = 'block';
    
    // Position near cursor if coordinates provided
    if (x && y) {
        tooltip.style.left = `${x + 15}px`;
        tooltip.style.top = `${y + 15}px`;
    }
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

// Regenerate mana over time
function regenerateMana(deltaSeconds) {
    game.mana.current = Math.min(game.mana.max, game.mana.current + game.manaRegenRate * deltaSeconds);
    updateUI();
}

// Regenerate health over time (when not in battle)
function regenerateHealth(deltaSeconds) {
    if (game.player.health.current < game.player.health.max) {
        game.player.health.current = Math.min(
            game.player.health.max, 
            game.player.health.current + (game.player.healthRegen * deltaSeconds)
        );
        updateUI();
    }
}

// Show notification message
function showNotification(message, type = 'success', duration = 3000) {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    
    // For now, also use the battle log
    addLogEntry(message, type === 'success' ? 'reward' : 'error');
}

// Calculate total attack with equipment
function calculateTotalAttack() {
    let totalAttack = game.player.attack;
    if (game.player.equipment.weapon) {
        totalAttack += game.player.equipment.weapon.attack;
    }
    return totalAttack;
}

// Calculate total defense with equipment
function calculateTotalDefense() {
    let totalDefense = game.player.defense;  
    if (game.player.equipment.armor) {
        const armorDefense = game.player.equipment.armor.defense;
        
        if (isNaN(armorDefense)) {
            console.error("Defense value is NaN:", game.player.equipment.armor);
            // Fix the broken equipment data
            game.player.equipment.armor = { name: "Cloth Robes", defense: 1, cost: 0 };
            addLogEntry("Your armor was damaged and has been replaced with basic gear.", "error");
            game.player.equipment.armor.defense = 0;
        }
        totalDefense += game.player.equipment.armor.defense;
    }
    return totalDefense;
}

// Add log entry to battle log
function addLogEntry(message, type = '') {
    const log = document.getElementById('battle-log');
    if (!log) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

// Clear the battle log
function clearBattleLog() {
    const log = document.getElementById('battle-log');
    log.innerHTML = '';
}

// Show floating damage text effect
function showDamageEffect(target, amount, type = 'damage', critical = false) {
    // Create floating text element
    const floatingText = document.createElement('div');
    floatingText.className = `floating-text ${type} ${critical ? 'critical' : ''}`;
    floatingText.textContent = type === 'damage' ? `-${amount}` : type === 'heal' ? `+${amount}` : `+${amount}`;
    
    // Add to enemy container
    const targetContainer = document.getElementById(`${target}-container`);
    if (targetContainer) {
        targetContainer.appendChild(floatingText);
        setTimeout(() => floatingText.remove(), 1500);
    }
}

// Attack the enemy
function attack() {
    if (game.enemy.health.current <= 0) {
        spawnEnemy();
        // Don't continue with the attack if we just spawned an enemy
        if (!game.settings.autoBattle) {
            return;
        } else {
            // Auto-battle needs a small delay to allow UI to update before attack
            setTimeout(() => attack(), 100);
            return;
        }
    }
    
    // Calculate player damage with critical hit chance
    const isCritical = Math.random() * 100 < game.player.critChance;
    let baseDamage = Math.max(1, calculateTotalAttack() - game.enemy.defense);
    
    // Apply magic bonus to damage
    if (game.player.magic > 0) {
        baseDamage += Math.floor(game.player.magic / 2);
    }
    
    // Check for accessories that boost damage
    if (game.player.equipment.accessory && game.player.equipment.accessory.magic) {
        baseDamage += Math.floor(game.player.equipment.accessory.magic / 2);
    }
    
    // Calculate final damage
    let playerDamage = baseDamage;
    if (isCritical) {
        playerDamage = Math.floor(baseDamage * game.player.critMultiplier);
        addLogEntry(`CRITICAL HIT! You hit ${game.enemy.name} for ${playerDamage} damage!`, 'critical');
        game.stats.criticalHits++;
    } else {
        addLogEntry(`You hit ${game.enemy.name} for ${playerDamage} damage!`, 'player-action');
    }
    
    // Show visual damage effect
    showDamageEffect('enemy', playerDamage, 'damage', isCritical);
    
    // Update statistics
    game.stats.damageDealt += playerDamage;
    
    // Apply damage to enemy - make sure it doesn't go below 0
    if (isNaN(game.enemy.health.current)) game.enemy.health.current = game.enemy.health.max;
    game.enemy.health.current = Math.max(0, game.enemy.health.current - playerDamage);
    
    // Check if enemy is defeated
    if (game.enemy.health.current <= 0) {
        defeatEnemy();
        // Continue auto battle - spawn new enemy automatically
        if (game.settings.autoBattle) setTimeout(spawnEnemy, 1000);
        return;
    }
    
    // Enemy attacks player
    let enemyDamage = Math.max(1, game.enemy.attack - calculateTotalDefense());
    
    // Chance for enemy to miss
    if (Math.random() < 0.1) {
        addLogEntry(`${game.enemy.name} attacks but misses!`, 'enemy-action');
        enemyDamage = 0;
    } else {
        addLogEntry(`${game.enemy.name} hits you for ${enemyDamage} damage!`, 'enemy-action');
        showDamageEffect('player', enemyDamage, 'damage');
    }
    
    game.stats.damageTaken += enemyDamage;
    
    // Apply damage to player
    game.player.health.current = Math.max(0, game.player.health.current - enemyDamage);
    
    // Check if player is defeated
    if (game.player.health.current <= 0) {
        defeat();
        return;
    }
    
    // Recover a small amount of mana on successful attack
    game.mana.current = Math.min(game.mana.max, game.mana.current + 1);
    updateUI();
    
    // Auto use potion if health is low and auto battle is on
    if (game.settings.autoBattle && game.player.health.current < game.player.health.max * 0.3) {
        if (game.inventory.healthPotions > 0) setTimeout(useHealthPotion, 100);
        else if (game.mana.current >= 5) useSkill('heal');
    }
    
    // Continue auto battle
    if (game.settings.autoBattle && game.enemy.health.current > 0 && game.player.health.current > 0) {
        setTimeout(attack, 500);
    }
}

function updateAreaButtons() {
    // Update each area button based on player level and current area
    const areas = ['forest', 'caves', 'graveyard'];
    
    // Make sure elements exist before trying to update them
    areas.forEach(area => {
        const button = document.getElementById(`travel-${area}`);
        if (button) {
            const areaData = game.areas[area];
            const isUnlocked = !areaData.unlockLevel || game.level >= areaData.unlockLevel;
            const isCurrentArea = area === game.currentArea;
            
            button.textContent = isCurrentArea ? "Currently Here" : "Travel Here";
            button.disabled = isCurrentArea || !isUnlocked;
            button.classList.toggle('active', isCurrentArea);
        }
    });
}

// Toggle auto battle
function toggleAutoBattle() {
    if (game.player.health.current <= 0) {
        addLogEntry("You can't start auto-battle while defeated.", 'error');
        return;
    }
    
    game.settings.autoBattle = !game.settings.autoBattle;
    document.getElementById('auto-battle').textContent = `Auto Battle: ${game.settings.autoBattle ? 'ON' : 'OFF'}`;
    document.getElementById('auto-battle').classList.toggle('active', game.settings.autoBattle);
    
    if (game.settings.autoBattle) {
        // If enemy is alive, attack. If not, spawn a new one
        if (game.enemy.health.current > 0 && game.enemy.health.current <= game.enemy.health.max) {
            attack();
        } else {
            spawnEnemy();
            setTimeout(attack, 500);
        }
    }
}

// Handle enemy defeat
function defeatEnemy() {
    if (!game.enemy) return; // Safety check
    game.enemy.isDefeated = true;
    game.stats.monstersDefeated++;
    
    // Show defeat message
    addLogEntry(`You defeated the ${game.enemy.name}!`, 'reward');
    
    // Calculate gold and XP with any bonuses
    let goldReward = game.enemy.gold;
    let xpReward = game.enemy.xp;
    
    // Handle arena mode
    if (game.arena.enabled) {
        handleArenaProgress();
    }
    
    // Update gold
    game.gold += goldReward;
    game.stats.goldEarned += goldReward;
    
    // Show reward message
    addLogEntry(`You gained ${goldReward} gold and ${xpReward} XP.`, 'reward');
    
    // Update quest progress for all applicable quests
    updateQuestProgress();
        
    // Chance for rare equipment drop from bosses
    if (game.enemy.isBoss && Math.random() < 0.3) {
        const possibleDrops = ['luckyAmulet', 'steelSword', 'plateArmor'];
        const randomDrop = possibleDrops[Math.floor(Math.random() * possibleDrops.length)];
        
        // Add to inventory or auto-equip
        if (randomDrop) {
            buyItem(randomDrop, true); // true indicates it's a drop, not a purchase
            const itemName = game.shop[randomDrop] ? game.shop[randomDrop].name : randomDrop;
            addLogEntry(`The ${game.enemy.name} dropped a rare item: ${itemName}!`, 'reward');
        }
    }
    
    // Random chance for potion drop (based on enemy dropChance or boss status)
    if (Math.random() < game.enemy.dropChance || game.enemy.isBoss) {
        if (Math.random() < 0.6 || game.inventory.healthPotions < 2) {
            game.inventory.healthPotions++;
            addLogEntry(`The ${game.enemy.name} dropped a Health Potion!`, 'reward');
            
            // Add animation effect for item pickup
            const itemPickup = document.createElement('div');
            itemPickup.className = 'item-pickup health-potion';
            document.getElementById('enemy-container').appendChild(itemPickup);
            setTimeout(() => itemPickup.remove(), 1000);
        } else {
            game.inventory.manaPotions++;
            addLogEntry(`The ${game.enemy.name} dropped a Mana Potion!`, 'reward');
        }
    }
    
    // Update inventory display
    updateInventoryUI();
    
    // Award experience
    addExperience(game.enemy.xp);
}

// Handle player defeat
function defeat() {
    game.player.health.current = Math.floor(game.player.health.max / 2);
    game.mana.current = Math.floor(game.mana.max / 2);
    
    // Play defeat animation/effect
    document.getElementById('player-container')?.classList.add('defeated');
    setTimeout(() => document.getElementById('player-container')?.classList.remove('defeated'), 1000);
    
    addLogEntry(`You wake up feeling weakened but alive.`, 'player-action');
    
    // Turn off auto battle
    game.settings.autoBattle = false;
    document.getElementById('auto-battle').textContent = `Auto Battle: OFF`;
    document.getElementById('auto-battle').classList.remove('active');
    
    // Spawn new enemy
    setTimeout(spawnEnemy, 1000);
}

// Spawn a new enemy
function spawnEnemy() {
    // Don't spawn if in arena mode and timer is expired
    if (game.arena.enabled && game.arena.waveTimeRemaining <= 0) {
        return false;
    }
    
    const area = game.areas[game.currentArea];
    const enemies = area.enemies;
    
    // For arena mode, we might want to prioritize stronger enemies
    let randomIndex = Math.floor(Math.random() * enemies.length);
    if (game.arena.enabled && game.arena.currentWave > 3) {
        // Bias toward stronger enemies in later arena waves
        randomIndex = Math.min(randomIndex + Math.floor(game.arena.currentWave / 3), enemies.length - 1);
    }
    
    const enemyTemplate = enemies[randomIndex];
    
    // Scale enemy based on player level
    const levelDiff = Math.min(5, Math.max(0, game.level - area.levelRange[0]));
    let enemyLevel = enemyTemplate.isBoss ? area.levelRange[1] : area.levelRange[0] + Math.floor(Math.random() * levelDiff);
    
    // In arena mode, scale enemy level with wave number
    if (game.arena.enabled) {
        enemyLevel = Math.max(enemyLevel, game.level - 1 + Math.floor(game.arena.currentWave / 2));
    }
    
    // Apply random variation to enemy stats (±10%)
    const variationMultiplier = 0.9 + Math.random() * 0.2;
    
    // Calculate health and other stats based on level scaling
    const healthMultiplier = 1 + (enemyLevel - 1) * 0.15;
    const statMultiplier = 1 + (enemyLevel - 1) * 0.12;
    
    game.enemy = {
        isDefeated: false,
        name: enemyTemplate.name,
        level: enemyLevel,
        health: {
            current: Math.floor(enemyTemplate.health * healthMultiplier * variationMultiplier),
            max: Math.floor(enemyTemplate.health * healthMultiplier * variationMultiplier)
        },
        attack: Math.floor(enemyTemplate.attack * statMultiplier * variationMultiplier),
        defense: Math.floor(enemyTemplate.defense * statMultiplier * variationMultiplier),
        gold: Math.floor(enemyTemplate.gold * statMultiplier * variationMultiplier),
        dropChance: enemyTemplate.isBoss ? 0.75 : 0.25,
        xp: Math.floor(enemyTemplate.xp * statMultiplier * variationMultiplier),
        image: enemyTemplate.image,
        isBoss: enemyTemplate.isBoss || false
    };
    
    // Apply randomized modifiers for more variety
    updateEnemyModifiers();
    
    // Different message based on encounter type
    if (game.enemy.isBoss) {
        addLogEntry(`⚠️ BOSS ENCOUNTER: A powerful ${game.enemy.name} (Level ${game.enemy.level}) appears!`, 'boss');
    } else {
        addLogEntry(`A ${game.enemy.name} (Level ${game.enemy.level}) appears!`, 'encounter');
    }
    
    // Update all UI elements for the new enemy
    updateUI();
    
    // Auto battle if enabled
    if (game.settings.autoBattle) {
        // Short delay for UI to update
        setTimeout(attack, 250);
    }
    
    return true; // Successfully spawned
}

// Create more interesting enemy modifiers
function updateEnemyModifiers() {
    // Chance for enemy to have a special modifier
    if (Math.random() < 0.25) {
        const modifiers = [
            { name: "Fierce", attackBonus: 0.3, defenseBonus: 0, healthBonus: 0, goldBonus: 0.2 },
            { name: "Giant", attackBonus: 0.1, defenseBonus: 0.2, healthBonus: 0.5, goldBonus: 0.3 }, 
            { name: "Enraged", attackBonus: 0.5, defenseBonus: -0.1, healthBonus: 0.2, goldBonus: 0.2 }, 
            { name: "Ghostly", attackBonus: 0.3, defenseBonus: 0.3, healthBonus: -0.1, goldBonus: 0.4 },
            { name: "Armored", attackBonus: -0.1, defenseBonus: 0.7, healthBonus: 0.3, goldBonus: 0.3 },
            { name: "Veteran", attackBonus: 0.2, defenseBonus: 0.2, healthBonus: 0.2, goldBonus: 0.4 },
            { name: "Elite", attackBonus: 0.3, defenseBonus: 0.3, healthBonus: 0.3, goldBonus: 0.5 },
            { name: "Ancient", attackBonus: 0.2, defenseBonus: 0.4, healthBonus: 0.4, goldBonus: 0.6 }
        ];
        
        const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        
        // Apply modifier effects
        game.enemy.name = `${modifier.name} ${game.enemy.name}`;
        game.enemy.health.max = Math.floor(game.enemy.health.max * (1 + modifier.healthBonus));
        game.enemy.health.current = game.enemy.health.max;
        game.enemy.attack = Math.floor(game.enemy.attack * (1 + modifier.attackBonus));
        game.enemy.defense = Math.floor(game.enemy.defense * (1 + modifier.defenseBonus));
        game.enemy.gold = Math.floor(game.enemy.gold * (1 + modifier.goldBonus));
        game.enemy.xp = Math.floor(game.enemy.xp * (1 + modifier.goldBonus)); // XP bonus same as gold
    }
}

// Enhanced level up system with visual feedback
function addExperience(amount) {
    const oldLevel = game.level;
    game.xp.current += amount;
    
    let leveledUp = false;
    
    // Check for level up
    while (game.xp.current >= game.xp.max) {
        game.xp.current -= game.xp.max;
        game.level++;
        game.xp.max = Math.floor(game.xp.max * 1.5);
        
        // Increase stats
        game.player.health.max += 10;
        game.player.health.current = game.player.health.max;
        game.player.attack += 1 + Math.floor(game.level / 5);
        game.player.defense += 1 + Math.floor(game.level / 10);
        game.player.magic += 1 + Math.floor(game.level / 8);
        game.mana.max += 5;
        game.mana.current = game.mana.max;
        game.player.critChance += 0.2; // Small increase each level
        // Check for unlocking new content
        checkForUnlocks(game.level);
        
        // Add level up animation effect
        if (document.getElementById('level-up-effect')) {
            document.getElementById('level-up-effect').classList.add('active');
            setTimeout(() => document.getElementById('level-up-effect').classList.remove('active'), 2000);
        }
        
        // Bonus for level milestones
        if (game.level % 5 === 0) {
            game.player.critChance += 1;
            game.player.healthRegen += 0.1;
            addLogEntry(`Level ${game.level} milestone reached! Critical hit chance increased!`, 'reward');
        }
        
        addLogEntry(`Congratulations! You reached level ${game.level}!`, 'reward');
        addLogEntry(`Your stats have increased!`, 'reward');
        leveledUp = true;
    }
    
    // Visual feedback for level up
    if (leveledUp) {
        document.getElementById('level').classList.add('level-up');
        setTimeout(() => document.getElementById('level').classList.remove('level-up'), 1000);
    }
    
    updateUI();
}

// Use a skill
function useSkill(skillName) {
    if (!game.enemy || game.enemy.health.current <= 0) {
        spawnEnemy(); 
        return;
    }
    
    // Ensure enemy health is valid
    if (isNaN(game.enemy.health.current)) {
        console.error("Enemy health is NaN, resetting to max health");
        game.enemy.health.current = game.enemy.health.max;
    }
    else if (game.enemy.health.current < 0) {
        game.enemy.health.current = 0;
    }
    
    switch (skillName) {
        case 'heal':
            if (game.mana.current >= 5) {
                // Enhanced heal calculation with magic bonuses
                let healAmount = 15 + game.player.magic * 3;
                
                game.player.health.current = Math.min(game.player.health.max, game.player.health.current + healAmount);
                game.stats.potionsUsed++;
                game.mana.current -= 5;
                
                // Show healing effect
                addLogEntry(`You cast Heal and recover ${healAmount} health!`, 'player-action');
                showDamageEffect('player', healAmount, 'heal');
                
                // Update stats display
                updateUI();
                // Enemy still gets to attack
                const enemyDamage = Math.max(1, game.enemy.attack - calculateTotalDefense());
                if (enemyDamage > 0) {
                    game.player.health.current = Math.max(0, game.player.health.current - enemyDamage);
                    addLogEntry(`${game.enemy.name} hits you for ${enemyDamage} damage!`, 'enemy-action');
                    showDamageEffect('player', enemyDamage, 'damage');
                }
            } else {
                addLogEntry(`Not enough mana to cast Heal!`, 'error');
            }
            break;
            
        case 'fireball':
            if (game.mana.current >= 8) {
                let fireballDamage = 10 + game.player.magic * 3;
                
                if (game.player.equipment.accessory && game.player.equipment.accessory.magic && !isNaN(game.player.equipment.accessory.magic)) {
                    fireballDamage += game.player.equipment.accessory.magic * 2;
                }
                
                game.enemy.health.current = Math.max(0, game.enemy.health.current - fireballDamage);
                game.mana.current -= 8;
                
                // Update stats
                game.stats.damageDealt += fireballDamage;
                showDamageEffect('enemy', fireballDamage, 'magic');
                
                addLogEntry(`You cast Fireball and deal ${fireballDamage} damage!`, 'player-action');
                
                // Check if enemy is defeated
                if (game.enemy.health.current <= 0) {
                    defeatEnemy();
                    updateUI();
                    return;
                }
                
                // Enemy still gets to attack
                const enemyDamage = Math.max(1, Math.floor(game.enemy.attack * 0.7) - calculateTotalDefense());
                game.player.health.current = Math.max(0, game.player.health.current - enemyDamage);
                addLogEntry(`${game.enemy.name} counterattacks for ${enemyDamage} damage!`, 'enemy-action');
                showDamageEffect('player', enemyDamage, 'damage');
            } else {
                addLogEntry(`Not enough mana to cast Fireball!`, 'error');
            }
            break;
    }
    
    if (game.player.health.current <= 0) {
        defeat();
        return;
    }
    
    updateUI();
}

// Use a health potion
function useHealthPotion() {
    if (game.inventory.healthPotions > 0) {
        const healAmount = 20;
        const previousHealth = game.player.health.current;
        const newHealth = Math.min(game.player.health.max, previousHealth + healAmount);
        game.player.health.current = newHealth;
        game.inventory.healthPotions--;
        game.stats.potionsUsed++;
        
        showDamageEffect('player', healAmount, 'heal');
        addLogEntry(`You drink a Health Potion and recover ${healAmount} health!`, 'player-action');
        updateInventoryUI();
        updateUI();
    }
}

// Use a mana potion
function useManaPotion() {
    if (game.inventory.manaPotions > 0) {
        const manaAmount = 15;
        game.stats.potionsUsed++;
        game.mana.current = Math.min(game.mana.max, game.mana.current + manaAmount);
        game.inventory.manaPotions--;
        
        showDamageEffect('player', manaAmount, 'mana');
        addLogEntry(`You drink a Mana Potion and recover ${manaAmount} mana!`, 'player-action');
        updateUI();
    }
}

// Buy an item from the shop
function buyItem(itemId, isFreeDrop = false) {
    const item = game.shop[itemId];
    
    if (!item) {
        console.error("Item not found in shop:", itemId);
        return;
    }
    
    let isEquipped = false;
    
    if (!isFreeDrop) {
        if (game.gold < item.cost) {
            return addLogEntry(`Not enough gold to buy ${item.name}!`, 'error');
        }
        game.gold -= item.cost;
    }
    
    switch (item.type) {
        case 'weapon': 
            game.player.equipment.weapon = item;
            addLogEntry(`You purchased ${item.name}!`, 'reward');
            isEquipped = true;
            break;
            
        case 'armor':
            game.player.equipment.armor = item;
            addLogEntry(`You purchased ${item.name}!`, 'reward');
            isEquipped = true;
            break;
            
        case 'accessory':
            game.player.equipment.accessory = item;
            addLogEntry(`You purchased ${item.name}!`, 'reward');
            break;
            
        case 'consumable':
            if (item.health) {
                game.inventory.healthPotions++;
                addLogEntry(`You purchased a Health Potion!`, 'reward');
            } else if (item.mana) {
                game.inventory.manaPotions++; 
                addLogEntry(`You purchased a Mana Potion!`, 'reward');
            }
            updateInventoryUI();
            break;
            
        case 'special':
            if (item.effect) {
                addLogEntry(`You used the ${item.name} and gained its power!`, 'reward');
            }
            break;
    }
    
    if (isEquipped) {
        const equipEffect = document.getElementById('equip-effect');
        if (equipEffect) {
            equipEffect.classList.add('active');
            setTimeout(() => equipEffect.classList.remove('active'), 1000);
        }
    }
    
    updateUI();
}

// Travel to a different area
function travelToArea(areaId) {
    const area = game.areas[areaId]; 
    if (!area) { 
        return;
    }
    
    if (area.unlockLevel && game.level < area.unlockLevel) {
        addLogEntry(`You need to be level ${area.unlockLevel} to travel to ${area.name}!`, 'enemy-action');
        return; 
    }
    
    game.currentArea = areaId;
    
    if (!area.visited) {
        const explorationBonus = 20 + 10 * area.unlockLevel;
        game.gold += explorationBonus; 
        addLogEntry(`You explore ${area.name} for the first time! Found ${explorationBonus} gold.`, 'reward');
        area.visited = true;
    } else {
        addLogEntry(`You travel to ${area.name}.`, 'player-action');
    }
    
    document.querySelectorAll('.area-travel-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `travel-${areaId}`);
    });
    
    if (!game.settings.keepAutoBattle) { 
        game.settings.autoBattle = false;
    }
    document.getElementById('auto-battle').textContent = "Auto Battle: OFF";
    document.getElementById('auto-battle').classList.remove('active');
    
    spawnEnemy();
}

// Check for unlocks at current level
function checkForUnlocks(level) {
    for (const [areaId, area] of Object.entries(game.areas)) {
        if (area.unlockLevel === level) {
            addLogEntry(`You've unlocked a new area: ${area.name}!`, 'reward');
        }
    }
    
    for (const [questId, quest] of Object.entries(game.quests)) {
        if (quest.unlockLevel === level && !quest.unlocked) {
            quest.unlocked = true;
            addLogEntry(`New quest available: ${quest.title}!`, 'reward');
        }
    }
    
    if (level === 3) {
        addLogEntry("You've unlocked the ability to craft basic items!", 'reward');
    }
    else if (level === 10) {
        addLogEntry("You've unlocked the Power Strike ability!", 'reward');
    }
}

// Complete a quest
function completeQuest(questId) {
    const quest = game.quests[questId];
    if (!quest || quest.completed) return;
    
    quest.completed = true;
    
    game.gold += quest.rewards.gold;
    game.stats.goldEarned += quest.rewards.gold;
    addExperience(quest.rewards.xp);
    
    const questElement = document.querySelector(`.quest-item[data-quest="${questId}"]`);
    if (questElement) {
        questElement.classList.add('completed');
        setTimeout(() => {
            questElement.classList.add('completed-fade');
        }, 2000);
    }
    
    addLogEntry(`Quest Completed: ${quest.title}!`, 'reward');
    addLogEntry(`You received ${quest.rewards.gold} gold and ${quest.rewards.xp} XP.`, 'reward');
    
    if (quest.rewards.item) {
        const itemKey = Object.keys(game.shop).find(key => 
            game.shop[key].name === quest.rewards.item);
            
        const itemKeys = Object.keys(game.shop).filter(key => 
            game.shop[key].name === quest.rewards.item);
        
        if (itemKeys.length > 0) {
            buyItem(itemKeys[0], true);
        } else {
            addLogEntry(`You received ${quest.rewards.item}!`, 'reward');
        }
    }
    
    updateUI();
    updateQuestDisplay();
}

// Update quest progress based on enemy
function updateQuestProgress() {
    if (!game.enemy || !game.enemy.name) return;
    
    const enemyName = game.enemy.name.toLowerCase();
    
    Object.entries(game.quests).forEach(([questId, quest]) => {
        if (quest.completed) return;
        
        if (quest.target.name && enemyName.includes(quest.target.name.toLowerCase())) {
            quest.progress++;
            
            if (quest.progress >= quest.target.count) {
                completeQuest(questId);
            }
            else {
                const progressElement = document.getElementById(`${questId}-progress`);
                if (progressElement) {
                    progressElement.textContent = `${quest.progress}/${quest.target.count}`;
                }
            }
        }
        
        if (quest.target.gold && game.enemy.gold) {
            quest.progress += game.enemy.gold;
            
            if (quest.progress >= quest.target.gold) {
                completeQuest(questId);
            }
            else {
                const progressElement = document.getElementById(`${questId}-progress`);
                if (progressElement) {
                    progressElement.textContent = `${quest.progress}/${quest.target.gold}`;
                }
            }
        }
    });
    
    if (game.enemy.name.toLowerCase().includes('slime') && !game.quests.slimeExtermination.completed) {
        game.quests.slimeExtermination.progress++;
        
        if (game.quests.slimeExtermination.progress >= game.quests.slimeExtermination.target.count) {
            completeQuest('slimeExtermination');
        }
        
        updateQuestDisplay();
    }
}

// Save game
function saveGame() {
    try {
        const saveData = JSON.stringify(game);
        localStorage.setItem('fantasyQuestSave', saveData);
        addLogEntry('Game saved successfully!', 'reward');
    } catch (error) {
        console.error('Error saving game:', error);
        addLogEntry('Failed to save game.', 'error');
    }
}

// Load game
function loadGame() {
    try {
        const saveData = localStorage.getItem('fantasyQuestSave');
        if (saveData) {
            let savedGame;
            try {
                savedGame = JSON.parse(saveData);
            } catch (e) {
                console.error('Error parsing saved game data:', e);
                return;
            }
            
            Object.assign(game, savedGame);
            spawnEnemy();
            
            addLogEntry('Game loaded successfully!', 'reward');
            updateUI();
        }  
    } catch (error) {
        console.error('Error loading game:', error);
        addLogEntry('Failed to load saved game.', 'error');
    }
}

// Initialize the game
function init() {
    game.lastUpdate = Date.now();
    spawnEnemy();
    updateUI();
    setupTooltips();
    window.onerror = function(message, source, lineno, colno, error) {
        console.error("Game error:", message, "at", source, lineno, colno);
        addLogEntry(`Game error: ${message}. Please report this bug!`, 'error');
    };
    addLogEntry("Welcome to Fantasy Quest! Defeat monsters, earn gold, and become legendary!", 'reward');
}

// Set up tooltips for items and skills
function setupTooltips() {
    document.getElementById('heal-skill').setAttribute('data-tooltip', 
        'Heal: Restore health equal to 15 + (Magic × 3). Costs 5 mana.');
    
    document.getElementById('fireball-skill').setAttribute('data-tooltip', 
        'Fireball: Deal damage equal to 10 + (Magic × 3). Costs 8 mana.');
    
    document.getElementById('weapon-slot').setAttribute('data-tooltip', 
        'Your equipped weapon determines your attack power');
    
    document.getElementById('armor-slot').setAttribute('data-tooltip', 
        'Your equipped armor determines your defense');
    
    document.getElementById('accessory-slot').setAttribute('data-tooltip', 
        'Accessories provide special bonuses to your character');
    
    document.getElementById('gold').setAttribute('data-tooltip', 
        'Gold can be spent in the shop to buy equipment and potions');
    
    document.getElementById('mana').setAttribute('data-tooltip', 
        'Mana is required to cast spells. Regenerates over time.');
    
    document.getElementById('experience').setAttribute('data-tooltip', 
        'Experience points are earned by defeating enemies. Collect enough to level up!');
}

// Arena Mode - a wave-based challenge system
function startArenaMode() {
    if (game.arena.enabled) return;
    
    game.arena.enabled = true;
    game.arena.currentWave = 1;
    game.arena.waveTimer = 30;
    game.arena.waveTimeRemaining = 30;
    game.arena.waveRewards = {
        gold: 50 * game.level,
        xp: 100 * game.level
    };
    
    clearBattleLog();
    addLogEntry("ARENA CHALLENGE STARTED!", 'boss');
    addLogEntry(`Wave 1/${game.arena.maxWave} - Defeat enemies for ${game.arena.waveTimer} seconds!`, 'reward');
    
    spawnEnemy();
    
    updateArenaUI();
}

// Update Arena mode UI
function updateArenaUI() {
    if (game.arena.enabled && document.getElementById('arena-timer')) {
        document.getElementById('arena-timer').textContent = Math.max(0, Math.floor(game.arena.waveTimeRemaining));
    }
}

// Handle Arena mode progress
function handleArenaProgress() {
    if (!game.arena.enabled) return;
    
    if (game.arena.waveTimeRemaining <= 0) {
        game.arena.currentWave++;
        
        game.gold += game.arena.waveRewards.gold;
        addExperience(game.arena.waveRewards.xp);
        
        addLogEntry(`Wave ${game.arena.currentWave-1} completed! +${game.arena.waveRewards.gold} gold, +${game.arena.waveRewards.xp} XP`, 'reward');
        
        game.arena.waveRewards.gold += 20 * game.level;
        game.arena.waveRewards.xp += 30 * game.level;
        
        game.arena.waveTimeRemaining = game.arena.waveTimer;
        
        if (game.arena.currentWave > game.arena.maxWave) {
            completeArena();
        } else {
            addLogEntry(`Wave ${game.arena.currentWave}/${game.arena.maxWave} - Starting now!`, 'boss');
        }
    }
    
    updateArenaUI();
}

// Complete the arena challenge
function completeArena() {
    addLogEntry(`ARENA CHALLENGE COMPLETED!`, 'boss');
    
    const bonusGold = 100 * game.level;
    const bonusXP = 200 * game.level;
    
    game.gold += bonusGold;
    addExperience(bonusXP);
    
    addLogEntry(`Arena Completion Reward: +${bonusGold} gold, +${bonusXP} XP`, 'reward');
    
    if (Math.random() < 0.5) {
        const specialItems = ['luckyAmulet', 'greaterHealthPotion', 'greaterManaPotion'];
        const randomItem = specialItems[Math.floor(Math.random() * specialItems.length)];
        buyItem(randomItem, true);
        addLogEntry(`Arena Champion Reward: You received a ${game.shop[randomItem].name}!`, 'reward');
    }
    
    game.arena.enabled = false;
    updateUI();
}

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('error', (e) => {
        console.error('Game error:', e.message);
    });
    setTimeout(init, 100);
}