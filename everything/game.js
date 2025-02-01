// The ultimate dark fantasy incremental RPG experience is now born!
// Integrated thematic combat, exploration events, and mystical duels that shape your destiny.
// Embracing gothic aesthetics with vibrant animations, epic loot, and evolving gameplay mechanics.
// New: Every choice drives emergent complexity, from cursed relics to enchanted shrines—prepare for a mystical journey.
// Fantasy Incremental RPG Game Logic
// Updated: Full interactivity with incremental progression, dynamic animations, and immersive gothic aesthetics.
// New Addition: Interactive Tutorial Mode added to guide new players through mysterious encounters. Every incremental decision now lights the path to your gothic fate!
// Enhanced UI Adjustments: 
// · Resized main container to fit within the viewport, eliminating excessive vertical space.
// · Removed inner scrollbars for a cleaner, more immersive experience.

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
  playSound('loot-sfx');
  animateFloatingLoot();
}

// New function to animate screen transitions when switching between game modes
function animateScreenTransition(screenId) {
  const screen = document.getElementById(screenId + "-screen");
  if (screen) {
    screen.classList.add("fade-in");
    setTimeout(() => {
      screen.classList.remove("fade-in");
    }, 2000);
  }
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
  let baseDamage = Math.floor(Math.random() * player.attack) + 1;
  let isCrit = false;
  let damage = baseDamage;
  if (Math.random() < 0.1) {
    damage = baseDamage * 2;
    isCrit = true;
  }
  enemy.hp = Math.max(enemy.hp - damage, 0);
  if(isCrit) {
    logBattle(`Critical Hit! You strike the enemy for ${damage} damage.`, 'crit');
    const enemyElem = document.querySelector(".enemy");
    if(enemyElem) {
      enemyElem.classList.add('shake');
      setTimeout(() => { enemyElem.classList.remove('shake'); }, 500);
    }
  } else {
    logBattle(`You strike the enemy for ${damage} damage.`);
  }
  playSound('attack-sfx');
  if (enemy.hp <= 0) {
    logBattle("Enemy defeated!");
    animateEnemyDefeat();
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
      animateCelebration();
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
  // Add a burst of magical sparkle animation to the enemy on special hit
  const enemyElem = document.querySelector(".enemy");
  if(enemyElem) {
    enemyElem.classList.add('magical-sparkle');
    setTimeout(() => { enemyElem.classList.remove('magical-sparkle'); }, 1000);
  }
  
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
      animateCelebration();
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
 
      // Determine target screen based on data-screen attribute
      const targetScreen = btn.getAttribute("data-screen") + "-screen";
      document.getElementById(targetScreen).style.display = "block";
      // Trigger a fade-in animation for the newly displayed screen
      animateScreenTransition(btn.getAttribute("data-screen"));
 
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

// New function to animate celebration during level up
function animateCelebration() {
  const container = document.getElementById("game-container");
  if (container) {
    container.classList.add("magical-sparkle");
    setTimeout(() => {
      container.classList.remove("magical-sparkle");
    }, 1500);
  }
}

// New function to animate enemy defeat with a fade-out effect
function animateEnemyDefeat() {
  const enemyElem = document.querySelector(".enemy");
  if (enemyElem) {
    enemyElem.classList.add("fade-out");
    setTimeout(() => {
      enemyElem.classList.remove("fade-out");
    }, 500);
  }
}

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
    animatePotionDrink();
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
console.log("Game fully loaded! Enjoy your gothic adventure!");

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
  } else if (chance < 0.85) {
    logBattle("The eerie winds whisper secrets as the weather turns volatile...", "lore");
    changeWeather();
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
  updateStats();
});

// New function: Visit Shrine – a mystical resting place where ancient energies restore your spirit.
function visitShrine() {
  logBattle("You step into the ancient shrine and feel the warm glow of forgotten gods. Your spirit is rejuvenated!", "lore");
  // Grant bonus XP and restore mana with a slight weakening of the enemy
  player.xp += 15;
  player.mana = Math.min(player.mana + 20, player.maxMana);
  if (enemy.hp > 0) {
    enemy.hp = Math.max(enemy.hp - 10, 0);
    logBattle("The shrine's blessing weakens your enemy by 10 damage!");
  }
  animateCelebration();
  updateStats();
}

// New function: Secret Challenge - face a hidden, spectral horde for a high-risk bonus event.
function secretChallenge() {
  logBattle("You face the ultimate secret challenge! A horde of spectral foes emerges from the abyss.", "special");
  const container = document.getElementById("game-container");
  if (container) {
    container.classList.add('shake');
    setTimeout(() => {
      container.classList.remove('shake');
    }, 500);
  }
  let damage = Math.floor(Math.random() * 15) + 5;
  player.hp = Math.max(player.hp - damage, 0);
  logBattle(`The spectral horde assaults you for ${damage} damage!`);
  updateStats();
  if (player.hp <= 0) {
    handlePlayerDeath();
  }
}

document.getElementById("secret-challenge").addEventListener("click", function(){
  if(player.hp > 0) {
    secretChallenge();
  }
});

document.addEventListener("keydown", function(e) {
  // Ignore key presses when focus is on an input or textarea
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

  switch(e.key.toLowerCase()) {
    case 'b':
      if (document.getElementById("boss-encounter") && !document.getElementById("boss-encounter").disabled) {
        document.getElementById("boss-encounter").click();
      }
      break;
    // Existing key bindings...
  }
});

// New function: animateBackground adds a subtle pulse effect to the game container on startup.
function animateBackground() {
  const container = document.getElementById("game-container");
  if (container) {
    container.classList.add("pulse");
    setTimeout(() => {
      container.classList.remove("pulse");
    }, 1000);
  }
}

// Call animateBackground on game load
document.addEventListener("DOMContentLoaded", function() {
  animateBackground();
});

document.getElementById("enchanted-realm").addEventListener("click", function() {
  if (player.hp > 0) {
    enterEnchantedRealm();
  }
});

// New function to animate a magical sparkle effect on a given element
function animateSparkle(element) {
  if (element) {
    element.classList.add('magical-sparkle');
    setTimeout(() => {
      element.classList.remove('magical-sparkle');
    }, 1000);
  }
}

// NEW FUNCTION: Simulate dynamic weather changes for an immersive experience
function changeWeather() {
  const overlay = document.getElementById("weather-overlay");
  if (overlay) {
    const colors = ["rgba(0,0,0,0.6)", "rgba(30,30,30,0.6)", "rgba(50,50,50,0.6)"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    overlay.style.backgroundColor = color;
    logBattle("The weather shifts ominously, draping the realm in a spectral mist.", "lore");
  }
}

// New function: Mystical Duel - a high-risk, high-reward combat encounter
function mysticalDuel() {
  logBattle("You step forward to engage in a mystical duel!", "special");
  let duelOutcome = Math.random();
  if(duelOutcome < 0.5) {
    logBattle("Victory! The duel fills you with arcane power and rare blessings!", "loot-epic");
    player.xp += 10;
    // Bonus loot drop in duels
    generateLoot();
    animateSparkle(document.querySelector(".character"));
  } else {
    logBattle("Defeat... The duel leaves you wounded by dark magic.", "enemy-attack");
    player.hp = Math.max(1, player.hp - 20);
  }
  updateStats();
}

// Bind the Mystical Duel functionality on DOM load
document.addEventListener("DOMContentLoaded", function() {
  const mysticalDuelBtn = document.getElementById("mystical-duel");
  if(mysticalDuelBtn) {
    mysticalDuelBtn.addEventListener("click", function() {
      if(player.hp > 0) {
        mysticalDuel();
      }
    });
  }
});

// New function to animate potion drinking effect
function animatePotionDrink() {
  const character = document.querySelector(".character");
  if (character) {
    character.classList.add("potion-drink");
    setTimeout(() => {
      character.classList.remove("potion-drink");
    }, 1000);
  }
}

// New function to animate a floating effect on the loot container to accentuate the enchanted aura of acquired items.
function animateFloatingLoot() {
  const lootContainer = document.getElementById("loot");
  if(lootContainer) {
    lootContainer.classList.add("floating-loot");
    setTimeout(() => {
      lootContainer.classList.remove("floating-loot");
    }, 1000);
  }
}

// NEW FUNCTION: Animate UI click to provide immediate visual feedback on button interactions.
function animateUIClick(buttonElem) {
  if (buttonElem) {
    buttonElem.classList.add("button-click");
    setTimeout(() => {
      buttonElem.classList.remove("button-click");
    }, 200);
  }
}

// Attach a global event listener to animate button clicks for all buttons
document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      animateUIClick(btn);
    });
  });
});

// New function: Enter Enchanted Realm - a mystical journey through unknown wonders
function enterEnchantedRealm() {
  logBattle("You step into the Enchanted Realm where mystical lights dance and fate rewrites itself!", "special");
  player.xp += 20;
  player.gold += 50;
  animateCelebration();
  updateStats();
}

// Auto-save every 15 seconds to help preserve progress
setInterval(saveGame, 15000);

// Allow players to dismiss the animation overlay via clicking the overlay or the close button.
document.addEventListener("DOMContentLoaded", function() {
  const animOverlay = document.getElementById("animation-overlay");
  if (animOverlay) {
    animOverlay.addEventListener("click", function() {
      this.style.display = "none";
      logBattle("The gothic sky clears as the overlay is dismissed.", "lore");
    });
  }

  // New: Add explicit close button functionality for the overlay.
  const closeBtn = document.getElementById("close-overlay");
  if (closeBtn) {
    closeBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      const overlay = document.getElementById("animation-overlay");
      if (overlay) {
        overlay.style.display = "none";
        logBattle("Overlay dismissed via close button.", "lore");
      }
    });
  }
});

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
    case 'm':
      if (document.getElementById("mystical-duel") && !document.getElementById("mystical-duel").disabled) {
        document.getElementById("mystical-duel").click();
      }
      break;
    case 'n':
      if (document.getElementById("enchanted-realm") && !document.getElementById("enchanted-realm").disabled) {
        document.getElementById("enchanted-realm").click();
      }
      break;
    case 't':
      // Activate Interactive Tutorial Mode
      interactiveTutorial();
      break;
    case 'l':
      if (document.getElementById("show-lore") && !document.getElementById("show-lore").disabled) {
        document.getElementById("show-lore").click();
      } else {
        showLore();
      }
      break;
  }
});

// New function: Reveal Hidden Lore for the intrepid explorer
function showLore() {
  logBattle("Hidden Lore: In the depths of forgotten crypts lie the secrets of ancient powers...", "lore");
  animateSparkle(document.querySelector(".character"));
}

// NEW FUNCTION: Interactive Tutorial Mode to guide new players through the game's basics.
function interactiveTutorial() {
  const tutorialOverlay = document.getElementById("tutorial-overlay");
  if (tutorialOverlay) {
    tutorialOverlay.textContent = "Tutorial: Use [A] to Attack, [H] to Heal, [S] for Special, [E] to Explore, [C] for Secret Challenge, [M] for Mystical Duel, and [N] for Enchanted Realm. Click anywhere to dismiss.";
    tutorialOverlay.style.display = "flex";
    tutorialOverlay.classList.add("show-tutorial");
    // Dismiss tutorial on click
    tutorialOverlay.addEventListener("click", function handler() {
      tutorialOverlay.classList.remove("show-tutorial");
      setTimeout(() => {
        tutorialOverlay.style.display = "none";
      }, 500);
      tutorialOverlay.removeEventListener("click", handler);
    });
    logBattle("Interactive Tutorial Activated! Follow the hints to master your gothic destiny.", "lore");
  }
}

// New function: Boss Encounter - face a colossal boss for epic rewards
function bossEncounter() {
  logBattle("A colossal foe emerges from the abyss! The darkness incarnate approaches!", "special");
  let bossHP = Math.floor(player.level * 100);
  let bossAttack = Math.floor(player.level * 15);
  let outcome = Math.random();
  if (outcome < 0.3) {
    logBattle("Victory! You defeat the boss in a battle of legends!", "loot-legendary");
    player.xp += bossAttack;
    player.gold += bossAttack * 2;
    generateLoot();
    animateCelebration();
  } else {
    let damage = Math.floor(bossAttack / 2);
    player.hp = Math.max(0, player.hp - damage);
    logBattle(`The boss strikes fiercely! You suffer ${damage} damage.`, "enemy-attack");
    if (player.hp === 0) {
      handlePlayerDeath();
    }
  }
  updateStats();
}

document.getElementById("boss-encounter").addEventListener("click", function() {
  if (player.hp > 0) {
    bossEncounter();
  }
});

// New function to adjust game container height based on window size for improved UX
function adjustGameContainer() {
  const container = document.getElementById("game-container");
  if (container) {
    container.style.height = (window.innerHeight * 0.95) + "px";
  }
}

// Ensure the game container is adjusted on load and when the window is resized
window.addEventListener("load", adjustGameContainer);
window.addEventListener("resize", adjustGameContainer);
document.addEventListener("DOMContentLoaded", adjustGameContainer);