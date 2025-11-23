export class GameUI {
    constructor() {
        this.scoreEl = document.getElementById('score');
        this.startBtn = document.getElementById('start-btn');
        this.upgradeMenu = document.getElementById('upgrade-menu');
        this.optionsContainer = document.getElementById('options');
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

    showGameOver() {
        this.overdriveUI.classList.add('hidden');
        this.startBtn.innerText = 'Game Over - Retry';
        this.startBtn.classList.remove('hidden');
        this.instructions.classList.remove('hidden');
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
        this.optionsContainer.innerHTML = '';
        
        options.forEach(choice => {
            const div = document.createElement('div');
            div.className = 'upgrade-option';
            div.innerHTML = `<strong>${choice.name}</strong><br>${choice.desc}`;
            div.onclick = () => {
                this.hideUpgradeMenu();
                onSelect(choice);
            };
            this.optionsContainer.appendChild(div);
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
            this.optionsContainer.appendChild(btn);
        }

        this.upgradeMenu.classList.remove('hidden');
    }

    hideUpgradeMenu() {
        this.upgradeMenu.classList.add('hidden');
    }
}
