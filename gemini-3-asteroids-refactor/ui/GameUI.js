export class GameUI {
    constructor() {
        this.scoreEl = document.getElementById('score');
        this.startBtn = document.getElementById('start-btn');
        this.upgradeMenu = document.getElementById('upgrade-menu');
        this.instructions = document.getElementById('instructions');
        this.overdriveUI = document.getElementById('overdrive-ui');
        this.overdriveFill = document.getElementById('overdrive-bar-fill');
        this.bossHud = document.getElementById('boss-hud');
        this.bossHpBar = document.getElementById('boss-hp-bar');
    }

    bindStart(callback) {
        this.startBtn.addEventListener('click', callback);
    }

    startGame() {
        this.startBtn.classList.add('hidden');
        this.instructions.classList.add('hidden');
        this.overdriveUI.classList.remove('hidden');
        this.bossHud.classList.remove('active');
        this.scoreEl.innerText = `Level: 1 | Score: 0`;
    }

    showGameOver(score, level, player) {
        this.overdriveUI.classList.add('hidden');
        this.bossHud.classList.remove('active');
        this.instructions.classList.add('hidden');
        
        // Rank Calculation
        const ranks = ["SPACE DUST", "RECRUIT", "PILOT", "VETERAN", "ACE", "LEGEND", "DEMIGOD"];
        let rIdx = 0;
        if(score > 1000) rIdx = 1;
        if(score > 5000) rIdx = 2;
        if(score > 15000) rIdx = 3;
        if(score > 40000) rIdx = 4;
        if(score > 100000) rIdx = 5;
        if(score > 250000) rIdx = 6;

        // Generate Upgrade List
        let upgradesHtml = '';
        if(player && player.upgradeLevels) {
            const sorted = Object.entries(player.upgradeLevels).sort((a,b) => b[1]-a[1]);
            sorted.forEach(([name, lvl]) => {
                upgradesHtml += `<div style="background:#223; color:#8df; padding:4px 8px; margin:2px; border:1px solid #446; font-size:0.85em; display:inline-block;">${name} <span style="color:#fff; font-weight:bold;">Lvl ${lvl}</span></div>`;
            });
        }
        if(!upgradesHtml) upgradesHtml = '<div style="color:#666; font-style:italic;">No augmentations installed.</div>';

        this.upgradeMenu.innerHTML = `
            <h1 style="color:#f33; margin:0 0 10px 0; font-size:3em; text-shadow:0 0 20px #f00; letter-spacing:2px;">SYSTEM CRITICAL</h1>
            <div style="font-size:1.2em; color:#aaa; margin-bottom:20px;">SIGNAL LOST...</div>
            
            <div style="background:linear-gradient(90deg, rgba(0,0,0,0), rgba(255,0,0,0.1), rgba(0,0,0,0)); border-top:1px solid #f33; border-bottom:1px solid #f33; padding:15px; margin-bottom:20px;">
                <div style="font-size:2.5em; font-weight:800; color:#fff; text-shadow:0 0 10px #faa;">${score}</div>
                <div style="color:#f88; font-size:1.2em; letter-spacing:3px;">RANK: ${ranks[rIdx]}</div>
                <div style="font-size:0.9em; color:#ccc; margin-top:5px;">SECTOR DEPTH: LEVEL ${level}</div>
            </div>

            <div style="text-align:left; background:rgba(0,0,0,0.5); padding:15px; border:1px solid #333; border-radius:8px; margin-bottom:20px;">
                <div style="color:#888; font-size:0.8em; border-bottom:1px solid #444; margin-bottom:8px; padding-bottom:4px;">BLACK BOX DATA // MODULES:</div>
                <div style="display:flex; flex-wrap:wrap; gap:4px; max-height:150px; overflow-y:auto;">
                    ${upgradesHtml}
                </div>
            </div>

            <button id="retry-game-btn" style="background:#c00; color:#fff; border:none; padding:15px 50px; font-size:1.4em; font-family:'Courier New'; font-weight:900; cursor:pointer; box-shadow:0 0 20px #f00; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); transition:all 0.2s;">REBOOT SYSTEM</button>
        `;

        this.upgradeMenu.classList.remove('hidden');
        
        const btn = document.getElementById('retry-game-btn');
        btn.onmouseover = () => { btn.style.background = '#f00'; btn.style.transform = 'scale(1.05)'; };
        btn.onmouseout = () => { btn.style.background = '#c00'; btn.style.transform = 'scale(1)'; };
        btn.onclick = () => {
            this.upgradeMenu.classList.add('hidden');
            this.startBtn.click();
        };
    }

    updateScore(level, score, combo) {
        let text = `Level: ${level} | Score: ${score}`;
        if(combo > 0) text += ` | Combo: ${combo}`;
        this.scoreEl.innerText = text;
    }

    updateBoss(boss) {
        if(boss) {
            this.bossHud.classList.add('active');
            const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
            this.bossHpBar.style.width = `${pct}%`;
        } else {
            this.bossHud.classList.remove('active');
        }
    }

    updateOverdrive(charge, isActive) {
        this.overdriveFill.style.width = `${charge}%`;
        
        if (charge >= 100) this.overdriveUI.classList.add('ready');
        else this.overdriveUI.classList.remove('ready');

        if (isActive) {
            this.overdriveFill.style.boxShadow = `0 0 ${Math.random()*20 + 10}px #fff`;
            this.overdriveFill.style.background = '#fff';
        } else {
            this.overdriveFill.style.boxShadow = '0 0 10px #fff';
            this.overdriveFill.style.background = 'linear-gradient(90deg, #f0f, #0ff)';
        }
    }

    showUpgradeMenu(options, rerolls, onSelect, onReroll) {
        this.upgradeMenu.innerHTML = `<h2>Level Up!</h2><div style="font-size: 14px; margin-bottom: 10px;">Choose an upgrade:</div><div id="options" class="upgrade-container"></div>`;
        const container = document.getElementById('options');
        container.innerHTML = '';

        options.forEach(choice => {
            const div = document.createElement('div');
            div.className = 'upgrade-option';
            div.innerHTML = `<strong>${choice.name}</strong><br>${choice.desc}`;
            div.onclick = () => {
                this.hideUpgradeMenu();
                onSelect(choice);
            };
            container.appendChild(div);
        });

        if (rerolls > 0) {
            const btn = document.createElement('div');
            btn.className = 'upgrade-option reroll-btn';
            btn.innerHTML = `<strong>🎲 REROLL</strong><br>Remaining: ${rerolls}`;
            btn.style.borderColor = '#fa0';
            btn.style.color = '#fa0';
            btn.onclick = () => {
                onReroll();
            };
            container.appendChild(btn);
        }

        this.upgradeMenu.classList.remove('hidden');
    }

    hideUpgradeMenu() {
        this.upgradeMenu.classList.add('hidden');
    }
}
