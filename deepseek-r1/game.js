const fantasyNames = ["Aetheris", "Valenthia", "Drak'thul", "Lunara", "Feywind", "Thunderforge", "Morgath", "Syndrael"];

// Enhanced fantasy RPG core with magic and combat systems
class GameManager {
  constructor() {
    this.clickMultiplier = 1;
    this.gold = 0;
    this.magicCrystals = 0;
    this.heroes = [];
    this.enemies = [];
    this.upgrades = {
      autoClicker: 0,
      // New progression curve for party size
      partySize: 1
    };
    this.spells = {
      fireball: {level: 1, cooldown: 0, maxCooldown: 3},
      heal: 0,
      summon: 0
    };

    this.init();
  }

  prestigeLevel = 0;
  lastTick = Date.now();
  
  // Initialize game systems
  init() {
    setInterval(() => this.saveGame(), 30000);
    try {
      this.loadGame();
    } catch(e) { console.error('Failed to load save:', e) }

    if(this.heroes.length === 0 || this.heroes.some(h => !h.class)) this.setupBaseHeroes();
    this.gameLoop();
    this.quests = this.generateNewQuests();
    this.achievements = new Set(['First Steps']);
  }

  getActiveParty() {
    return this.heroes.slice(0, this.upgrades.partySize);
  }

  setupBaseHeroes() {
    const classes = ['Warrior', 'Mage', 'Rogue', 'Cleric'];
    this.heroes = classes.map((cls, i) => new Hero({
      id: i+1,
      name: fantasyNames[Math.floor(Math.random() * fantasyNames.length)] + " the " + cls,
      abilities: this.getHeroAbilities(cls),
      class: cls,
      level: 1,
      baseAttack: 10,
      attackSpeed: 1.0,
      exp: 0,
      maxHealth: 100,
      health: 100
    }));
  }
  

  generateRandomHero() {
    const classes = ['Paladin', 'Archer', 'Necromancer', 'Druid', 'Bard', 'Alchemist'];
    const selectedClass = classes[Math.floor(Math.random() * classes.length)];
    return new Hero({
      id: this.heroes.length + 1,
      name: `${selectedClass} ${fantasyNames[Math.floor(Math.random() * fantasyNames.length)]}`,
      class: selectedClass,
      abilities: this.getHeroAbilities(selectedClass),
      level: Math.floor(Math.random() * 3) + 1,
      baseAttack: 12,
      maxHealth: 100,
      abilities: this.getHeroAbilities(selectedClass),
      exp: 0,
      attackSpeed: 0.9,
      health: 100
    });
  }
  
  getHeroAbilities(className) {
    const abilities = {
      Warrior: [{ name: 'Shield Bash', cooldown: 0, effect: 'Stun' }],
      Mage: [{ name: 'Arcane Missiles', cooldown: 0, effect: 'Triple Attack' }],
      Cleric: [{ name: 'Divine Light', cooldown: 0, effect: 'Party Heal' }],
      Rogue: [{ name: 'Poison Dagger', cooldown: 0, effect: 'DoT' }],
      Bard: [{ name: 'Inspire', cooldown: 0, effect: 'Speed Boost' }],
      Druid: [{ name: 'Entangle', cooldown: 0, effect: 'Root' }],
      Paladin: [{ name: 'Holy Strike', cooldown: 3, effect: 'Heal Party' }],
      Archer: [{ name: 'Snipe', cooldown: 2, effect: 'Critical Hit' }],
      Necromancer: [{ name: 'Summon Skeleton', cooldown: 5, effect: 'Add Minion' }],
      Alchemist: [{ name: 'Poison Flask', cooldown: 4, effect: 'Area Damage' }]
    };
    return abilities[className] || [];
  }
  
  generateNewQuests() {
    return [
      { type: 'hunt', target: 'Goblin', count: 0, required: 5, reward: 50, completed: false },
      { type: 'collect', target: 'Gold', count: 0, required: 100, reward: 25, completed: false },
      { type: 'defeat', target: 'Elite', count: 0, required: 3, reward: 100, completed: false }
    ];
  }
  
  getRandomEnemyType() {
    return ['Goblin', 'Orc', 'Troll', 'Demon'][Math.floor(Math.random()*4)];
  }

  gameLoop() {
    setInterval(() => {
      const timeDelta = (Date.now() - this.lastTick) / 1000;
      this.lastTick = Date.now();
      this.generateResources();
      this.handleCombat(timeDelta);
      this.render();
      this.updateQuests();
      this.updateSpellCooldowns(timeDelta);
    }, 1000); // Slowed game loop for better performance
  }

  generateResources() {
    this.gold += (1 + this.upgrades.autoClicker) * this.clickMultiplier;
    this.magicCrystals += this.heroes.reduce((sum, hero) => sum + hero.level, 0) * (1 + this.prestigeLevel * 0.1);
    this.magicCrystals = Math.min(this.magicCrystals, 1000); // Prevent overflow
  }
  handleCombat(timeDelta) {
    const activeHeroes = this.getActiveParty();
    
    // Spawn enemies with scaling difficulty
    if(this.enemies.length < Math.min(5, 2 + this.upgrades.partySize)) {
      const heroLevels = activeHeroes.filter(h => h.health > 0).map(h => h.level);
      const baseLevel = heroLevels.length > 0 ? Math.ceil(Math.max(...heroLevels) * (1.2 - (this.prestigeLevel * 0.05))) : 1;
      if(this.enemies.length < 5) this.enemies.push(new Enemy({ 
        level: Math.floor(Math.random() * baseLevel * 1.5) + 1,
        isElite: Math.random() < 0.1 + (this.prestigeLevel * 0.02),
        type: this.getRandomEnemyType()
      }));
    }

    // Hero attacks
    this.getActiveParty().forEach(hero => {
      if(hero.health > 0 && this.enemies.length > 0) {
        const speedMultiplier = this.getActiveParty().some(h => h.class === 'Bard') ? 1.2 : 1;
        hero.attackCooldown -= timeDelta * hero.attackSpeed * speedMultiplier;
        
        if(this.enemies.length === 0) return;
        if(hero.attackCooldown <= 0 && this.enemies.some(e => e.health > 0)) {
          const target = this.enemies.find(e => e.health > 0);
          if(target) {
            const damage = hero.attackEnemy(target);
            if(damage > 0) {
              this.createDamageEffect(target, damage);
              if(target.health <= 0) this.handleEnemyDeath(target);
            }
            hero.attackCooldown = 1;
          }
        } else {
          hero.attackCooldown = Math.min(hero.attackCooldown, 1);
        }
      }
      
      this.enemies = this.enemies.filter(e => e.health > 0);
    });

    // Enemy attacks (target random alive hero)
    this.enemies.slice().forEach(enemy => {
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - timeDelta);
      const aliveHeroes = this.getActiveParty().filter(h => h.health > 0);
      if(aliveHeroes.length === 0 || enemy.attackCooldown > 0) return;
      
      const target = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
      const damage = enemy.attackHero(target);
      enemy.attackCooldown = 2; // Enemies attack every 2 seconds
      if(damage > 0) {
        this.createDamageEffect(target, damage);
        if(target.health <= 0) this.checkHeroDeathAchievements();
        if(target.health <= 0 && !this.achievements.has('First Casualty')) {
          this.createDeathEffect(target);
        }
      }
    });
  }

  checkHeroDeathAchievements() {
    if(!this.achievements.has('First Casualty')) {
      this.achievements.add('First Casualty');
      this.showNotification('Achievement Unlocked: First Casualty!');
    }
  }
  
  updateQuests() {
    this.quests.forEach(quest => {
      if(!quest.completed) {
        switch(quest.type) {
          case 'hunt':
            quest.count = this.enemies.filter(e => e.type === quest.target && e.health <= 0).length;
            break;
          case 'collect':
            quest.count = this.gold;
            break;
          case 'defeat':
            quest.count = this.enemies.filter(e => e.isElite && e.health <= 0).length;
            break;
        }
        quest.completed = quest.count >= quest.required;
        if (quest.completed) {
          if (quest.type === 'collect') {
            this.gold += quest.reward;
          } else {
            this.magicCrystals += quest.reward;
          } 
          this.showNotification(`Quest Completed: ${quest.type} ${quest.target}! +${quest.reward}${quest.type === 'collect' ? 'g' : 'c'}`);
        }
      }
    }); 

    // Generate new quests when all are completed
    if (this.quests.every(q => q.completed)) {
      this.quests = this.generateNewQuests();
    }
  }

  handleEnemyDeath(enemy) {
    this.gold += enemy.goldDrop;
    this.magicCrystals += enemy.crystalDrop + (enemy.isElite ? 5 : 0);
    this.magicCrystals = Math.min(this.magicCrystals, 1000);
    
    // Distribute EXP to living party members
    this.getActiveParty().filter(h => h.health > 0).forEach(hero => {
      hero.gainExp(enemy.level * 5 * (1 + this.prestigeLevel * 0.2));
      if(hero.exp >= hero.getExpRequired()) 
        hero.levelUp();
    });
    
    this.checkAchievements();
  }

  buyUpgrade(upgradeType) {
    const costs = {
      autoClicker: 50 * Math.pow(1.5, this.upgrades.autoClicker),
      partySize: 100 * Math.pow(2, this.upgrades.partySize)
    };    

    if(upgradeType === 'partySize' && this.upgrades.partySize >= 6) {
      this.showNotification('Max party size reached!', 'warning');
      return;
    }

    const prestigeBonus = Math.floor(this.prestigeLevel * 0.5);
    const newPartySize = this.upgrades.partySize + 1 + prestigeBonus;

    if(this.gold >= costs[upgradeType]) {
      this.gold -= costs[upgradeType]; 
      const prestigeBonus = Math.floor(this.prestigeLevel * 0.5);
      this.upgrades[upgradeType] += 1 + prestigeBonus;
      if(upgradeType === 'partySize' && this.upgrades.partySize > this.heroes.length)
        this.setupAdditionalHeroes();
      this.render();
    }
  }
  
  manualAttack() {
    if(this.enemies.length > 0) {
      const baseDamage = 10 * this.clickMultiplier;
      this.enemies[0].takeDamage(baseDamage * (1 + this.prestigeLevel * 0.1));
    }
  }

  castSpell(spellType) {
    const costs = { 
      fireball: 10 + (this.spells.fireball.level * 5), 
      heal: 20, 
      summon: 50 
    };
    
    if(spellType === 'fireball' && this.spells.fireball.cooldown > 0) return;
    
    if(this.magicCrystals >= costs[spellType]) {
      this.magicCrystals -= costs[spellType];
      
      if(spellType === 'fireball' && this.spells.fireball.cooldown <= 0) {
        this.spells.fireball.cooldown = this.spells.fireball.maxCooldown;
      }
      this.spells[spellType]++;
      
      if(spellType === 'heal') {
        this.getActiveParty().forEach(hero => {
          if(hero.health <= 0) {
            hero.health = hero.maxHealth * 0.3;
            hero.level = Math.max(1, hero.level - 1); // Level penalty on revive
            hero.exp *= 0.8; // Keep 80% of EXP
            this.createReviveEffect(hero);
            this.checkAchievements();
            this.achievements.add('Phoenix Blessing');
          } else if(hero.health > 0) {
            hero.health = Math.min(hero.health + 20, hero.maxHealth);
          } 
        });
      } else if(spellType === 'fireball') {
        this.enemies.slice().forEach(enemy => {
          enemy.health -= 15 + (this.spells.fireball.level * 5);
          if(enemy.health <= 0) this.handleEnemyDeath(enemy);
        });
        this.enemies = this.enemies.filter(e => e.health > 0);
      } else if(spellType === 'summon') {
        const summonDamage = 25 * this.spells.summon * (1 + this.prestigeLevel * 0.1);
        this.enemies.forEach(e => e.health -= summonDamage);
      }
      this.checkAchievements();
      this.render();
    }
  }

  checkAchievements() {
    if(this.heroes.some(h => h.level >= 10) && !this.achievements.has('Veteran')) {
      this.achievements.add('Veteran');
      this.clickMultiplier *= 1.5;
      this.showNotification('Achievement Unlocked: Veteran!');
    }
  }

  prestige() {
    if(this.heroes.some(h => h.level >= 20) && window.confirm("Ascend to gain permanent bonuses but reset progress?")) {
      this.prestigeLevel++;
      const keepHeroes = this.heroes.map(h => ({...h.getSaveData(), level: 1, health: h.maxHealth}));
      this.gold = 0;
      this.magicCrystals = 0;
      this.upgrades.autoClicker = 0;
      this.upgrades.partySize = 1;
      this.heroes = keepHeroes.map(data => new Hero(data));
      this.enemies = [];
      this.showNotification(`Ascended! Prestige Level ${this.prestigeLevel}`);
      this.render();
    }
  }

  updateSpellCooldowns(timeDelta) {
    if(this.spells.fireball.cooldown > 0)
      this.spells.fireball.cooldown = Math.max(0, this.spells.fireball.cooldown - timeDelta);
  }

  render() {
    // Update resources
    document.getElementById('gold').textContent = Math.floor(this.gold);
    document.getElementById('crystals').textContent = Math.floor(this.magicCrystals);
    document.getElementById('auto-clicker-count').textContent = this.upgrades.autoClicker;
    document.getElementById('party-size').textContent = this.upgrades.partySize;
    document.getElementById('heal-cost').textContent = 20 + (this.spells.heal * 5);

    // Update upgrade costs
    document.getElementById('partyCost').textContent = Math.floor(100 * Math.pow(2, this.upgrades.partySize));
    document.getElementById('autoClickerCost').textContent = Math.floor(50 * Math.pow(1.5, this.upgrades.autoClicker));
    
    // Update quest display
    const questContainer = document.getElementById('quests');
    questContainer.innerHTML = this.quests.map(q => this.renderQuest(q)).join('');
    
    // Render heroes
    const heroContainer = document.getElementById('heroes');
    heroContainer.innerHTML = this.heroes.slice(0, this.upgrades.partySize)
      .map(hero => hero.render()).join('');
    
    // Update hero status colors
    document.querySelectorAll('.hero').forEach((elem, i) => {
      const hero = this.heroes[i];
      if(hero && i < this.upgrades.partySize) {
        elem.style.opacity = hero.health > 0 ? 1 : 0.5;
        elem.style.border = hero.health <= 0 ? '2px solid darkred' : `2px solid ${hero.class === 'Warrior' ? 'goldenrod' : 'green'}`;
        const healthBar = elem.querySelector('.health-bar');
        if(healthBar) healthBar.style.width = `${(hero.health/hero.maxHealth)*100}%`;
        elem.querySelector('.health-text').textContent = `${Math.ceil(hero.health)}/${Math.ceil(hero.maxHealth)} (Lv${hero.level})`;
      }
    });
    
    // Update spell displays
    document.getElementById('fireball-cost').textContent = 10 + (this.spells.fireball.level * 5);
    document.getElementById('summon-cost').textContent = 50 * (this.spells.summon + 1);

    // Render enemies
    const enemyContainer = document.getElementById('enemies');    
    enemyContainer.innerHTML = this.enemies.slice(0, 5).map(enemy => enemy.render(this.lastTick)).join('');
    
    // Update fireball cooldown
    if(this.spells.fireball.cooldown > 0) {
      this.spells.fireball.cooldown -= 0.25;
      const cooldownElem = document.getElementById('fireball-cooldown');
      if(cooldownElem) cooldownElem.style.width = `${(1 - (this.spells.fireball.cooldown / this.spells.fireball.maxCooldown)) * 100}%`;
    }
    
    // Show placeholder when no enemies
    if(this.enemies.length === 0 && !document.querySelector('.enemy-placeholder')) {
      enemyContainer.innerHTML = '<div class="enemy-placeholder">No enemies present</div>';
    }
    
    // Dragon summon effect
    const dragon = document.querySelector('.dragon-animation') || {classList: {add:()=>{}, remove:()=>{}}};

    // Add temporary class for summon animation
    if(this.spells.summon > 0 && !dragon.classList.contains('dragon-summon')) {
      dragon.classList.add('dragon-summon');
      setTimeout(() => dragon.classList.remove('dragon-summon'), 2000);
    }
    
    dragon.style.display = this.spells.summon > 0 ? 'block' : 'none';
    
    // Update prestige display
    document.getElementById('prestige-counter').textContent = this.prestigeLevel;
  }
  
  renderQuest(quest) {
    return `
      <div class="quest ${quest.completed ? 'completed' : ''}">
        <h4>${quest.type}: ${quest.target}</h4>
        <progress value="${quest.count}" max="${quest.required}"></progress>
        <p>${Math.min(quest.count, quest.required)}/${quest.required} (Reward: ${quest.reward}${quest.type === 'collect' ? 'g' : 'c'})</p>
      </div>
    `;
  }
  
  saveGame() {
    const saveData = {
      gold: this.gold,
      magicCrystals: this.magicCrystals,
      upgrades: {
        ...this.upgrades,
        // Prevent party size exceeding hero roster
        partySize: Math.min(this.upgrades.partySize, this.heroes.length)
      },
      heroes: this.heroes.slice(0, this.upgrades.partySize).map(hero => hero.getSaveData()),
      spells: this.spells,
      prestigeLevel: this.prestigeLevel,
      quests: this.quests
    };
    localStorage.setItem('fantasyIncrementalSave', JSON.stringify(saveData));
  }

  loadGame() {
    const saveData = JSON.parse(localStorage.getItem('fantasyIncrementalSave'));
    if(saveData) {
      this.gold = saveData.gold ?? 0;
      this.magicCrystals = saveData.magicCrystals ?? 0;
      this.setupAdditionalHeroes();
      this.magicCrystals = Math.min(saveData.magicCrystals, 1000);
      this.spells = {
        fireball: {level: saveData.spells.fireball.level || 1, cooldown: 0, maxCooldown: 3},
        heal: saveData.spells?.heal || 0,
        summon: saveData.spells?.summon || 0
      };
      this.quests = saveData.quests || this.generateNewQuests();
      
      // Load heroes first, then calculate party size based on valid heroes
      this.heroes = (saveData.heroes || [])
        .filter(data => data != null)
        .map(data => new Hero(data));
      this.upgrades = {
        ...this.upgrades,
        ...saveData.upgrades,
        partySize: Math.min(saveData.upgrades.partySize, this.heroes.length)
      };
    }
  }

  setupAdditionalHeroes() {
    const newHeroesNeeded = this.upgrades.partySize - this.heroes.length;
    if(newHeroesNeeded > 0) {
      // Ensure we don't exceed max party size of 6
      const actualNewHeroes = Math.min(newHeroesNeeded, 6 - this.heroes.length);
      if(actualNewHeroes <= 0) {
        this.upgrades.partySize = Math.min(this.upgrades.partySize, 6);
        return;
      }
      
      for(let i = 0; i < newHeroesNeeded; i++) {
        this.heroes.push(this.generateRandomHero());
      }
    }
  }

  showNotification(text, type='info') {
    const floatText = document.createElement('div');
    floatText.className = `notification ${type}`;
    floatText.textContent = text;
    document.getElementById('notifications').appendChild(floatText);
    setTimeout(() => floatText.remove(), 3000);
  }
}

GameManager.prototype.createDamageEffect = function(target, damage) {
  const elem = document.createElement('div');
  elem.className = `damage-number ${target instanceof Hero ? 'player-damage' : 'enemy-damage'}`;
  elem.textContent = Math.round(damage);
  document.getElementById(target instanceof Hero ? 'heroes' : 'enemies').appendChild(elem);
};

GameManager.prototype.createReviveEffect = function(hero) {
  const elem = document.createElement('div');
  elem.className = 'revive-effect';
  elem.textContent = '✨ Revived!';
  document.getElementById('heroes').appendChild(elem);
};

class Hero {
  constructor({id, name, class: cls, level, baseAttack, attackSpeed, health, abilities}) {
    this.id = id;
    this.name = name || `Hero ${id}`;
    this.class = cls;
    this.level = level;
    this.baseAttack = baseAttack;
    this.attackSpeed = attackSpeed;
    this.abilities = abilities || [];
    this.health = health; 
    this.maxHealth = health;
    this.equipment = {};
    this.attackCooldown = 0;
  }

  get attack() {
    return this.baseAttack * this.level * (this.class === 'Warrior' ? 1.2 : 1) * (1 + Math.min(0.5, this.level * 0.02));
  }

  attackEnemy(enemy) {
    const critChance = this.class === 'Rogue' ? 0.25 : 0.1;
    const damage = this.attack * (Math.random() < critChance ? 2.2 : 1);
    enemy.takeDamage(damage);
    return damage;
}

  getSaveData() {
    return {
      id: this.id,
      name: this.name,
      class: this.class,
      level: this.level,
      baseAttack: this.baseAttack,
      abilities: this.abilities,
      attackSpeed: this.attackSpeed,
      health: this.health,
      maxHealth: this.maxHealth
    };
  }
  
  get partyBonus() {
    const classes = new Set(this.getActiveParty().map(h => h.class));
    if(classes.size === 4) return 0.3;
    return 0;
  }

  render() {
    return /*html*/`
      <div class="hero ${this.class.toLowerCase()}">
        <h3>Level ${this.level} ${this.class}</h3>
        <div class="health-bar-container">
          <div class="health-bar" style="height: 100%; background: #6bff6b; border-radius: 5px; transition: width 0.3s"></div>
        </div>
        <p class="health-text">${Math.floor(this.health)}/${this.maxHealth} (Lv${this.level})</p>
        ${this.abilities.map(a => `<small class="ability">${a.name}</small>`).join('')}
        <p>ATK: ${this.baseAttack * this.level}</p>
        <div class="attack-speed-container" style="width: 100px; height: 5px; background: #444;">
          <div class="attack-speed-bar" style="height: 100%; background: #4b0082; width: ${this.attackCooldown * 100}%"></div>
        </div>
        <small>${this.attackSpeed.toFixed(1)}/s</small>
      </div>
    `;
  }

  gainExp(amount) {
    this.exp += amount;
  }

  getExpRequired() {
    return 80 * Math.pow(1.4, this.level - 1);
  }

  levelUp() {
    this.level++;
    this.baseAttack += 2 + Math.floor(this.level / 5);
    this.maxHealth = 100 + (this.level * 15);
    this.health = this.maxHealth; // Full heal on level up
    this.exp = 0;
  }
}

class Enemy {
  constructor({ level, isElite, type }) {
    this.level = level;
    this.isElite = isElite;
    this.type = type;
    this.health = level * 30 * (this.isElite ? 2 : 1);
    this.goldDrop = level * 8;
    this.crystalDrop = level * (this.isElite ? 2 : 0.5);
    this.attackCooldown = 0;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  attackHero(hero) {
    const damage = this.level * 3;
    hero.health = Math.max(0, hero.health - damage);
    return damage;
  }

  render() {
    const pulse = this.isElite ? `style="animation: pulse ${Math.random()*0.5+0.5}s infinite; border-color: #ff5555"` : '';
    return `
      <div class="enemy ${this.isElite ? 'elite' : ''}" ${pulse}>
        <h3>${this.isElite ? '⭐ ' : ''}Level ${this.level} ${this.type} ${this.isElite ? 'Elite ' : ''}</h3>
        <p>Health: ${this.health}</p>
        <p>Drops: ${this.goldDrop}g + ${this.crystalDrop}c</p>
        <div class="attack-cooldown" style="width: 100px; height: 3px; background: #444;">
          <div class="cooldown-progress" style="width: ${(1 - this.attackCooldown/2)*100}%; height: 100%; background: red;"></div>
        </div>
      </div>
    `;
  }
}

// Initialize the game manager instance
window.gameManager = new GameManager();