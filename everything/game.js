// Fantasy Incremental RPG Game Logic
function playSound(soundId) {
  const sound = document.getElementById(soundId);
  if(sound) {
    sound.currentTime = 0;
    sound.play();
  }
}

// Player and enemy initial stats
let player = {
  hp: 100,
  maxHp: 100,
  attack: 10,
  xp: 0,
  level: 1,
  loot: [],
  gold: 0,
  mana: 100,
  maxMana: 100,
  potions: 1
};

const BASE_ENEMY_HP = 50;
const BASE_ENEMY_ATTACK = 5;
let enemy = {  
  hp: BASE_ENEMY_HP,
  maxHp: BASE_ENEMY_HP,
  attack: BASE_ENEMY_ATTACK,
  level: 1
};

// Game systems
let autoAttackInterval = null;
let manaRegenInterval = null;

// Persistent game state
function saveGame() {
  localStorage.setItem('fantasyRPG', JSON.stringify({
    player: player,
    enemy: enemy
  }));
}

function loadGame() {
  const saved = localStorage.getItem('fantasyRPG');
  if (saved) {
    const data = JSON.parse(saved);
    player = data.player;
    enemy = data.enemy;
  }
}

// Utility functions
function updateStats() {
  const xpPercentage = Math.min((player.xp / (player.level * 20)) * 100, 100);
  const nextLevelXP = player.level * 20;

  // Update health bars
  document.getElementById("player-hp").style.width = `${(player.hp/player.maxHp)*100}%`;
  document.getElementById("enemy-hp").style.width = `${(enemy.hp/enemy.maxHp)*100}%`;
  
  // Update text stats and currencies
  document.getElementById("player-text").innerHTML = `Level ${player.level} | ⚔${player.attack} | ❤️${player.maxHp}`;
  document.getElementById("enemy-text").innerHTML = `Level ${enemy.level} | ⚔${enemy.attack}`;
  document.getElementById("gold").textContent = `🪙 ${player.gold}`;
  document.getElementById("mana").textContent = `🔮 ${player.mana}/${player.maxMana}`;
  // Update potion count display
  if(document.getElementById("potions")) {
    document.getElementById("potions").textContent = `🧪 ${player.potions}`;
  }

  document.getElementById("xp-label").textContent = `Level ${player.level} - ${player.xp}/${nextLevelXP} XP`;
  document.getElementById('auto-attack').textContent = `🤖 Auto Attack (${autoAttackInterval ? 'ON' : 'OFF'})`;

  document.getElementById('xp-progress').style.width = `${xpPercentage}%`;
  document.getElementById("mana-progress").style.width = `${(player.mana/player.maxMana)*100}%`;
  
  const minSpecial = Math.floor(player.attack * 1.5);
  const maxSpecial = player.attack * 2;
  document.getElementById('special').textContent = `💥 Special Attack (${minSpecial}-${maxSpecial})`;
}

function logBattle(message, className = '') {
  const battleLog = document.getElementById("battle-log");
  const p = document.createElement("p");
  p.innerHTML = message;
  if(className) p.className = className;
  battleLog.appendChild(p);
  while (battleLog.children.length > 50) battleLog.removeChild(battleLog.firstChild);
  battleLog.scrollTop = battleLog.scrollHeight;
}

function generateLoot() {
  const lootTable = [
    {name: "Ancient Sword", rarity: 'common', attack: 2, sellValue: 5},
    {name: "Mystic Wand", rarity: 'uncommon', attack: 3, sellValue: 10}, 
    {name: "Dragon Shield", rarity: 'rare', hp: 20, sellValue: 20},
    {name: "Elixir of Life", rarity: 'epic', hp: 30, attack: 1, sellValue: 40},
    {name: "Ring of Shadows", rarity: 'legendary', hp: 10, attack: 5, sellValue: 100}
  ];
  
  const lootItem = lootTable[Math.floor(Math.random() * lootTable.length)];
  player.loot.push(lootItem);
  player.gold += lootItem.sellValue / 2; // Gain half the sell value immediately
  
  // 10% chance to drop a bonus mystical item with an extra flourish
  if (Math.random() < 0.10) {
    const bonusLoot = {name: "Mystic Rune", rarity: 'legendary', hp: 0, attack: 0, sellValue: 150};
    player.loot.push(bonusLoot);
    logBattle(`A spectral voice whispers... You receive a <span class="loot-legendary">${bonusLoot.name}</span> of unfathomable power!`, 'loot-message');
  }

  updateInventoryDisplay();
  logBattle(`Acquired <span class="loot-${lootItem.rarity}">${lootItem.name}</span> (+${lootItem.attack || 0}⚔ +${lootItem.hp || 0}❤️)`, 'loot-message');
}

function applyLootBonuses(item) {
  if (item.attack) player.attack += item.attack;
  if (item.hp) player.maxHp += item.hp;
  
  updateInventoryDisplay();
  updateStats();
  logBattle(`Equipped <span class="loot-${item.rarity}">${item.name}</span> granting +${item.attack || 0}⚔ and +${item.hp || 0}❤️!`, 'loot-message');
}

function resetEnemy() {
  // Dynamic enemy scaling based on player progression
  const levelScale = Math.pow(1.1, player.level);
  enemy.level = Math.floor(player.level * 0.9 + 1);
  enemy.maxHp = BASE_ENEMY_HP + (enemy.level * 15 * levelScale);
  enemy.hp = enemy.maxHp;
  enemy.attack = BASE_ENEMY_ATTACK + (enemy.level * 2 * levelScale);
  player.mana = Math.min(player.mana + 10, player.maxMana);
  
  // Randomize enemy icon for variety
  const enemyIcons = ["👹", "🐉", "👾", "🤖"];
  const enemyElem = document.querySelector(".enemy");
  if(enemyElem) {
    enemyElem.textContent = enemyIcons[Math.floor(Math.random() * enemyIcons.length)];
  } else {
    console.warn("Enemy element not found in DOM!");
  }

  updateStats();
  logBattle("A shadowy figure emerges from the darkness!");
}

function playerAttack() {
  let damage = Math.floor(Math.random() * player.attack) + 1;
  if (Math.random() < 0.1) damage *= 2; // 10% crit chance
  enemy.hp = Math.max(enemy.hp - damage, 0);
  logBattle(`You strike the enemy for ${damage} damage.`);
  playSound('attack-sfx');
  if (enemy.hp <= 0) {
    logBattle("Enemy defeated!");
    player.xp += enemy.level * 5;
    player.gold += enemy.level * 2;
    generateLoot();
    
    if (player.xp >= player.level * 20) {
      player.xp -= player.level * 20;
      player.level++;
      player.maxHp += 20;
      player.attack += 3;
      player.maxMana += 10;
      player.hp = player.maxHp;
      logBattle("You leveled up! Your soul surges with gothic power!");
    }
    resetEnemy();
  } else {
    enemyAttack();
    document.querySelector(".enemy").classList.add('enemy-hit');
  }
  updateStats();
}

function enemyAttack() {
  let damage = Math.floor(Math.random() * enemy.attack) + 1;
  player.hp -= damage;
  
  // Log and update even if this blow is fatal.
  logBattle(`Enemy counterattacks for ${damage} damage!`, 'enemy-attack');
  playSound('enemy-sfx');
  updateStats();
  
  if (player.hp <= 0) {
    handlePlayerDeath();
    return;
  }
  
  document.querySelector(".character").classList.add('player-hit');
  setTimeout(() => {
    document.querySelector(".character").classList.remove('player-hit');
  }, 500);
}

function specialAttack() {
  if (player.mana < 30) {
    logBattle("Not enough mana for special attack!");
    return;
  }
  
  const minDamage = Math.floor(player.attack * 1.5);
  const maxDamage = player.attack * 2;
  const damage = Math.floor(Math.random() * (maxDamage - minDamage)) + minDamage;
  player.mana -= 30;
  
  logBattle(`You unleash a special attack for ${damage} damage!`);
  enemy.hp -= damage;
  
  if (enemy.hp <= 0) {
    logBattle("Enemy defeated by your special assault!");
    player.xp += enemy.level * 5;
    generateLoot();
    
    if (player.xp >= player.level * 20) {
      player.xp -= player.level * 20;
      player.level++;
      player.maxHp += 20;
      player.attack += 3;
      player.maxMana += 10;
      player.hp = player.maxHp;
      logBattle("You ascended beyond mortal limits! Your gothic essence empowers you!");
    }
    resetEnemy();
  } else {
    enemyAttack();
  }
}

document.getElementById("attack").addEventListener("click", function() {
  if (player.hp > 0) {
    playerAttack();
  }
});

document.getElementById("heal").addEventListener("click", function() {
  if (player.hp > 0) {
    healPlayer();
    enemyAttack();
  }
});

document.getElementById("special").addEventListener("click", function() {
  if (player.hp > 0) {
    specialAttack();
  }
});

document.addEventListener("DOMContentLoaded", function() {
  updateStats();
  loadGame();
  updateInventoryDisplay();
  logBattle("Welcome to the Fantasy Incremental RPG!");
  
  // Setup navigation for screens
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      // Hide all screens
      document.getElementById("combat-screen").style.display = "none";
      document.getElementById("inventory-screen").style.display = "none";
      document.getElementById("skills-screen").style.display = "none";

      // Show selected screen based on data-screen attribute
      const targetScreen = btn.getAttribute("data-screen") + "-screen";
      document.getElementById(targetScreen).style.display = "block";

      // Update active button styling
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // By default, display the combat screen on load
  document.getElementById("combat-screen").style.display = "block";
  
  // Attach Buy Potion button event listener
  const buyPotionBtn = document.getElementById("buy-potion");
  if(buyPotionBtn) {
    buyPotionBtn.addEventListener("click", function() {
      if (player.hp > 0) {
        buyPotion();
        enemyAttack();
      }
    });
  }

  // Start mana regeneration
  manaRegenInterval = setInterval(() => {
    if (player.mana < player.maxMana) {
      player.mana = Math.min(player.mana + 1, player.maxMana);
      updateStats();
    }
  }, 1000);
});

function healPlayer() {
  if (player.hp < player.maxHp) {
    if (player.mana < 20) {
      logBattle("Not enough mana to heal!");
      return;
    }
    let healAmount = Math.floor(player.maxHp * 0.3);
    player.hp = Math.min(player.hp + healAmount, player.maxHp);
    player.mana -= 20;
    logBattle(`You cast a healing spell and restore ${healAmount} HP.`);
    playSound('heal-sfx');
    updateStats();
  } else {
    logBattle("Your health is already full.");
  }
}

function drinkPotion() {
  if (player.potions > 0) {
    const healAmount = Math.floor(player.maxHp * 0.5);
    player.hp = Math.min(player.hp + healAmount, player.maxHp);
    player.potions--;
    logBattle(`You drink a healing potion and restore ${healAmount} HP!`);
    playSound('heal-sfx');
    updateStats();
  } else {
    logBattle("No healing potions left!");
  }
}

function buyPotion() {
  if (player.gold >= 50) {
    player.gold -= 50;
    player.potions++;
    logBattle("You purchased a healing potion!");
    updateStats();
  } else {
    logBattle("Not enough gold to buy a potion!");
  }
}

// New function to restart the game
function restartGame() {
  // Reset player state
  player = {
    hp: 100,
    maxHp: 100,
    attack: 10,
    xp: 0,
    level: 1,
    loot: [],
    gold: 0,
    mana: 100,
    maxMana: 100,
    potions: 1
  };

  // Reset enemy state
  enemy = {
    hp: 50,
    maxHp: 50,
    attack: 5,
    level: 1
  };

  // Clear the battle log and loot display
  document.getElementById("battle-log").innerHTML = "";
  updateInventoryDisplay();

  // Re-enable buttons if they were disabled
  document.getElementById("attack").disabled = false;
  document.getElementById("heal").disabled = false;
  document.getElementById("special").disabled = false;
  document.getElementById("restart").disabled = false;
  if (autoAttackInterval) toggleAutoAttack();

  updateStats();
  logBattle("The game has been restarted. Prepare for your gothic adventure!");
}

// Auto-attack system
function toggleAutoAttack() {
  if (!autoAttackInterval) {
    autoAttackInterval = setInterval(() => {
      if (player.hp > 0 && enemy.hp > 0) {
        playerAttack();
      }
    }, 1000);
  } else {
    clearInterval(autoAttackInterval);
    autoAttackInterval = null;
  }
  updateStats(); // updateStats will now set the proper text: 🤖 Auto Attack (ON/OFF)
}

document.getElementById("auto-attack").addEventListener("click", toggleAutoAttack);

// Inventory management
function updateInventoryDisplay() {
  const lootContainer = document.getElementById("loot");
  lootContainer.innerHTML = player.loot.length > 0 
    ? player.loot.map((item, index) => `
      <div class="loot-item loot-${item.rarity}" data-index="${index}">
        ${item.name}<br>
        <small>+${item.attack || 0}⚔ +${item.hp || 0}❤️</small>
        <div class="item-actions">
          <button onclick="equipItem(${index})">Equip</button>
          <button onclick="sellItem(${index})">Sell (${item.sellValue})</button>
        </div>
      </div>
    `).join("")
    : "No loot yet, try exploring!";
}

function equipItem(index) {
  const item = player.loot[index];
  applyLootBonuses(item);
}

function sellItem(index) {
  player.gold += player.loot[index].sellValue;
  player.loot.splice(index, 1);
  updateInventoryDisplay();
  updateStats();
}

window.equipItem = equipItem;
window.sellItem = sellItem;
window.drinkPotion = drinkPotion;
window.buyPotion = buyPotion;

// New function to sell all loot at once
function sellAllLoot() {
  if (player.loot.length === 0) {
    logBattle("No loot to sell!");
    return;
  }
  let totalValue = player.loot.reduce((sum, item) => sum + item.sellValue, 0);
  player.gold += totalValue;
  logBattle(`Sold all loot for ${totalValue} gold!`);
  player.loot = [];
  updateInventoryDisplay();
  updateStats();
}

// Attach Sell All Loot functionality once DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  // Append the Sell All button to the inventory screen if it exists
  const inventoryScreen = document.getElementById("inventory-screen");
  if (inventoryScreen) {
    let sellAllBtn = document.createElement("button");
    sellAllBtn.id = "sell-all";
    sellAllBtn.textContent = "Sell All Loot";
    sellAllBtn.addEventListener("click", sellAllLoot);
    inventoryScreen.appendChild(sellAllBtn);
  }
});

function handlePlayerDeath() {
  logBattle("<strong class='game-over'>YOU HAVE DIED</strong>");
  Array.from(document.getElementsByTagName('button')).forEach(btn => {
    if(btn.id !== 'restart') btn.disabled = true;
  });
  if (autoAttackInterval) toggleAutoAttack();
}

// Attach restart functionality once DOM is loaded
document.getElementById("restart").addEventListener("click", function(){
  restartGame();
});
document.getElementById("drink-potion").addEventListener("click", function() {
  if(player.hp > 0) {
    drinkPotion();
    enemyAttack();
  }
});

// Add toggle music functionality
document.getElementById("toggle-music").addEventListener("click", function() {
  const music = document.getElementById("bg-music");
  if (music.paused) {
    music.play();
    logBattle("Music turned ON");
  } else {
    music.pause();
    logBattle("Music turned OFF");
  }
});

// Function to upgrade spell (dummy upgrade: restores full mana)
function upgradeSpell() {
  if (player.gold >= 50) {
    player.gold -= 50;
    player.mana = player.maxMana;
    logBattle("Your spells have been upgraded, mana fully restored!");
    updateStats();
  } else {
    logBattle("Not enough gold to upgrade your spells!");
  }
}

// Function to upgrade attack power by improving your weapon
function upgradeAttack() {
  if (player.gold >= 100) {
    player.gold -= 100;
    player.attack += 5;
    logBattle("Your weapon has been upgraded! Attack increased by 5!");
    updateStats();
  } else {
    logBattle("Not enough gold to upgrade your weapon!");
  }
}

// Attach upgradeSpell and upgradeAttack functionality to skills screen buttons
document.getElementById("upgrade-spell").addEventListener("click", upgradeSpell);
document.getElementById("upgrade-attack").addEventListener("click", upgradeAttack);

// New function: Explore area to add variety and fun random events
function explore() {
  let chance = Math.random();
  if (chance < 0.3) {
    logBattle("You wander through eerie corridors... The silence is almost deafening.");
  } else if (chance < 0.5) {
    let goldFound = Math.floor(Math.random() * 20) + 10;
    player.gold += goldFound;
    logBattle(`Fortune smiles upon you! You uncover a hidden stash and gain ${goldFound} gold.`);
  } else if (chance < 0.7) {
    logBattle("You stumble upon an ancient relic imbued with forgotten power!");
    generateLoot();
  } else {
    logBattle("Ambushed during exploration! A hidden enemy lunges at you from the shadows!");
    enemyAttack();
  }
  updateStats();
}

// Bind the explore functionality to the Explore button
document.getElementById("explore").addEventListener("click", function(){
  if (player.hp > 0) {
    explore();
  }
});

// Bind the Visit Shrine functionality to the Shrine button
document.getElementById("shrine").addEventListener("click", function(){
  if (player.hp > 0) {
    visitShrine();
  }
});

// New function: Visit Shrine for mystical blessings and rewards
function visitShrine() {
  let chance = Math.random();
  if(chance < 0.5) {
    // Blessing: restore a portion of player's health (up to half max HP)
    let bonus = Math.floor(player.maxHp * 0.5);
    player.hp = Math.min(player.hp + bonus, player.maxHp);
    logBattle("The ancient shrine bathes you in healing light, restoring " + bonus + " HP!");
    playSound('heal-sfx');
  } else {
    // Gift: reward player with bonus gold
    let goldBonus = Math.floor(Math.random() * 30) + 10;
    player.gold += goldBonus;
    logBattle("The shrine's mysterious aura rewards you with " + goldBonus + " gold!");
  }
  updateStats();
}
window.visitShrine = visitShrine;

// Auto-save every 15 seconds to help preserve progress
setInterval(saveGame, 15000);

// Hotkey bindings for improved gameplay control
// Allows use of [A] Attack, [H] Heal, [S] Special, [E] Explore, [R] Restart, [C] Secret Challenge
document.addEventListener("keydown", function(e) {
  // Ignore key presses when focus is on an input or textarea
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

  switch(e.key.toLowerCase()) {
    case 'a':
      if (document.getElementById("attack") && !document.getElementById("attack").disabled) {
        document.getElementById("attack").click();
      }
      break;
    case 'h':
      if (document.getElementById("heal") && !document.getElementById("heal").disabled) {
        document.getElementById("heal").click();
      }
      break;
    case 's':
      if (document.getElementById("special") && !document.getElementById("special").disabled) {
        document.getElementById("special").click();
      }
      break;
    case 'e':
      if (document.getElementById("explore") && !document.getElementById("explore").disabled) {
        document.getElementById("explore").click();
      }
      break;
    case 'r':
      if (document.getElementById("restart") && !document.getElementById("restart").disabled) {
        document.getElementById("restart").click();
      }
      break;
    case 'c':
      if (document.getElementById("secret-challenge") && !document.getElementById("secret-challenge").disabled) {
        document.getElementById("secret-challenge").click();
      }
      break;
  }
});

// New Secret Challenge functionality to add extra fun and risk-reward mechanics
function secretChallenge() {
  logBattle("You dare challenge the unknown? The secret challenge begins...");
  if (Math.random() < 0.5) {
    logBattle("Fortune smiles upon you! You conquer the secret challenge and ascend in power!");
    player.xp = Math.max(0, player.xp - (player.level * 10));
    player.level++;
    player.maxHp += 50;
    player.attack += 10;
    player.gold += 100;
    logBattle("Bonus: +50 HP, +10 Attack, and 100 Gold!");
  } else {
    logBattle("The secret challenge overwhelms you! You suffer a brutal blow.");
    player.hp = Math.max(1, player.hp - 30);
  }
  updateStats();
}

document.getElementById("secret-challenge").addEventListener("click", function(){
  if(player.hp > 0) {
    secretChallenge();
  }
});