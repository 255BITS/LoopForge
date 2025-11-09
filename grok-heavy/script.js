const enemyNames = ['Slime', 'Goblin', 'Skeleton', 'Orc', 'Wolf', 'Troll', 'Demon', 'Vampire', 'Giant', 'Lich', 'Zone Boss'];

let heroLevel = 1;
let gold = 0;
let xp = 0;
let xpToNext = 10;
let dps = 1;
let manualDamage = 10;
let enemyLevel = 0;
let enemyMaxHP = 10;
let enemyHP = 10;
let upgradeCost = 10;
let swordUpgradeCost = 20;
let manaUpgradeCost = 50;
let zone = 0;
let mana = 0;
let maxMana = 50;
let manaRegen = 5;
let spellCost = 20;
let spellDamage = 20;
const video = document.getElementById('enemy-video');
const logDiv = document.getElementById('log');

function updateUI() {
    const hpPercent = Math.max(0, (enemyHP / enemyMaxHP) * 100);
    document.getElementById('hp-fill').style.width = `${hpPercent}%`;

    const xpPercent = (xp / xpToNext) * 100;
    document.getElementById('xp-fill').style.width = `${xpPercent}%`;

    const manaPercent = (mana / maxMana) * 100;
    document.getElementById('mana-fill').style.width = `${manaPercent}%`;

    document.getElementById('hero-level').textContent = heroLevel;
    document.getElementById('gold').textContent = gold;
    document.getElementById('xp').textContent = xp;
    document.getElementById('xp-next').textContent = xpToNext;
    document.getElementById('dps').textContent = dps;
    document.getElementById('enemy-level').textContent = enemyLevel;
    document.getElementById('enemy-hp').textContent = `${Math.max(0, enemyHP)}/${enemyMaxHP}`;
    document.getElementById('dps-cost').textContent = upgradeCost;
    document.getElementById('sword-cost').textContent = swordUpgradeCost;
    document.getElementById('mana-cost').textContent = manaUpgradeCost;
    document.getElementById('zone').textContent = zone;
    document.getElementById('mana').textContent = Math.floor(mana);
    document.getElementById('max-mana').textContent = maxMana;

}
function log(message) {
    // No change, but line for diff context
    logDiv.innerHTML += `<p>${message}</p>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

function defeatEnemy() {
    const oldLevel = enemyLevel;
    const isBoss = oldLevel === 10;
    const rewardGold = (oldLevel + 1) * (zone + 1) * (isBoss ? 10 : 1);
    const rewardXP = (oldLevel + 1) * (zone + 1) * 2 * (isBoss ? 10 : 1);
    gold += rewardGold;
    xp += rewardXP;    
    log(`Vanquished the ${enemyNames[oldLevel]}${isBoss ? ' (Boss)' : ''}! Gained ${rewardGold} gold and ${rewardXP} XP.`);
    while (xp >= xpToNext) {
      heroLevel++;
      xp -= xpToNext;
      xpToNext = Math.floor(xpToNext * 1.5);
      manualDamage += 5;
      log(`Leveled up to ${heroLevel}! Manual damage increased to ${manualDamage}.`);
    }
    enemyLevel++;
    if (enemyLevel > 10) {  
      enemyLevel = 0;
      zone++;
      log(`You have ascended to Zone ${zone}! The challenges grow ever greater.`);
    }
    enemyMaxHP = Math.floor(10 * (enemyLevel + 1) * Math.pow(2, zone));
    enemyHP = enemyMaxHP;
    video.src = `assets/enemy-${enemyLevel}.mp4`;
    updateUI();
}

function attack(damage, isManual = false, isSpell = false) {
    if (isManual && !isSpell) {
        let crit = false;
        if (Math.random() < 0.1) {
            damage *= 2;
            crit = true;
        }
        log(`${crit ? 'Critical ' : ''}Attack! Dealt ${damage} damage to the ${enemyNames[enemyLevel]}.`);
    } else if (isSpell) {
        log(`You cast a powerful spell, dealing ${damage} damage to the ${enemyNames[enemyLevel]}.`);
    }
    enemyHP -= damage;
    if (enemyHP <= 0) {
        defeatEnemy();
    } else {
        updateUI();
    }
}
// Idle auto-attack every second
// No change, but context
function autoTick() {
  attack(dps);
  mana = Math.min(mana + manaRegen, maxMana);
  updateUI();
}
setInterval(autoTick, 1000);

// Manual attack button
document.getElementById('attack-btn').addEventListener('click', () => attack(manualDamage, true));

// Upgrade DPS button
document.getElementById('upgrade-dps').addEventListener('click', () => {
    if (gold >= upgradeCost) {
        gold -= upgradeCost;
        dps++;
        upgradeCost = Math.floor(upgradeCost * 1.5);
        log(`Upgraded DPS to ${dps}! Next upgrade costs ${upgradeCost}.`);
        updateUI();
    } else {
        log('Not enough gold!');
    }
});
// Upgrade Sword
document.getElementById('upgrade-sword').addEventListener('click', () => {
  if (gold >= swordUpgradeCost) {
    gold -= swordUpgradeCost;
    manualDamage += 5;
    swordUpgradeCost = Math.floor(swordUpgradeCost * 1.5);
    log(`Upgraded sword! Manual damage now ${manualDamage}. Next upgrade costs ${swordUpgradeCost}.`);
    updateUI();
  } else {
    log('Not enough gold!');
  }
});
// Cast Spell
document.getElementById('cast-spell').addEventListener('click', () => {
  if (mana >= spellCost) {
    mana -= spellCost;
    attack(spellDamage, false, true);
    updateUI();
  } else {
    log('Not enough mana!');
  }
});
// Upgrade Magic
document.getElementById('upgrade-mana').addEventListener('click', () => {
  if (gold >= manaUpgradeCost) {
    gold -= manaUpgradeCost;
    maxMana += 50;
    manaRegen += 5;
    spellDamage += 10;
    manaUpgradeCost = Math.floor(manaUpgradeCost * 1.5);
    log(`Upgraded magic! Max mana ${maxMana}, regen ${manaRegen}, spell damage ${spellDamage}. Next upgrade costs ${manaUpgradeCost}.`);
    updateUI();
  } else {
    log('Not enough gold!');
  }
});
// Save and load
function saveGame() {
    const saveData = { heroLevel, gold, xp, xpToNext, dps, manualDamage, enemyLevel, enemyMaxHP, enemyHP, upgradeCost, swordUpgradeCost, manaUpgradeCost, zone, mana, maxMana, manaRegen, spellDamage };
    localStorage.setItem('eldoriaSave', JSON.stringify(saveData));
    log('Game saved.');
}

function loadGame() {
    const saved = localStorage.getItem('eldoriaSave');
    if (saved) {
        const data = JSON.parse(saved);
        heroLevel = data.heroLevel || 1;
        gold = data.gold || 0;
        xp = data.xp || 0;
        xpToNext = data.xpToNext || 10;
        dps = data.dps || 1;
        manualDamage = data.manualDamage || 10;
        enemyLevel = data.enemyLevel || 0;
        enemyMaxHP = data.enemyMaxHP || 10;
        enemyHP = data.enemyHP || 10;
        upgradeCost = data.upgradeCost || 10;
        swordUpgradeCost = data.swordUpgradeCost || 20;
        manaUpgradeCost = data.manaUpgradeCost || 50;
        zone = data.zone || 0;
        mana = data.mana || 0;
        maxMana = data.maxMana || 50;
        manaRegen = data.manaRegen || 5;
        spellDamage = data.spellDamage || 20;
        video.src = `assets/enemy-${data.enemyLevel}.mp4`;
        updateUI();
        log('Game loaded.');
    } else {
        log('No save found.');
    }
}

document.getElementById('save-btn').addEventListener('click', saveGame);
document.getElementById('load-btn').addEventListener('click', loadGame);

// Initial setup 
video.src = `assets/enemy-${enemyLevel}.mp4`;
updateUI();
log('Welcome to Eldoria\'s Ascension! Defeat enemies, gain power, and ascend through zones.');
setInterval(saveGame, 30000); // Auto-save every 30s
