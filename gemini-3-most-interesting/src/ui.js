import { state } from './state.js';
import { COSTS, LEVEL_REQS, RECIPES, COLORS, DESCRIPTIONS } from './config.js';

export function updateUI() {
    if (state.gameOver) return;
    const nHp = state.nexus ? state.nexus.hp : 0;
    const maxHp = state.nexus ? state.nexus.maxHp : 1;
    const nLvl = state.nexus ? state.nexus.level : 1;
    const xp = state.nexus ? state.nexus.xp : 0;
    const xpNext = state.nexus ? state.nexus.xpToNext : 1;
    const dash = Math.floor(state.player.dashEnergy);
    
    // Helper for bars
    const makeBar = (pct, color, w='100px') => `<div style="display:inline-block; width:${w}; height:6px; background:#222; border-radius:3px; overflow:hidden; margin:0 5px; vertical-align:middle; border:1px solid #444;"><div style="width:${pct}%; height:100%; background:${color}; transition: width 0.2s;"></div></div>`;

    const wavePct = Math.floor(Math.min(100, Math.max(0, state.pollution)));
    const waveColor = wavePct > 80 ? '#ff2e63' : (wavePct > 50 ? '#ffd700' : '#4ecca3');

    const ui = document.getElementById('top-bar');
    
    const diversity = state.nexus ? state.nexus.recentItems.size : 0;
    const mult = diversity > 1 ? Math.pow(2.5, diversity - 1) : 1.0;
    const syn = `<span style="color:${diversity > 1 ? '#ffd700' :'#555'}; font-weight:bold; margin-left:10px; padding:2px 5px; border-radius:4px; text-shadow: 0 0 ${diversity > 1 ? '5px' : '0'} #ffd700;">★ SYNERGY ${mult.toFixed(1)}x</span>`;
    
    if (!document.getElementById('ui-stats-container')) {
        ui.innerHTML = `
        <div id="ui-stats-container" style="display:flex; width:100%; justify-content:space-between; align-items:center;">
            <div style="min-width:280px; display:flex; align-items:center;">
                <span style="color:#e94560; font-weight:bold; font-size:1.1rem; margin-right:5px;" id="ui-n-lvl">NEXUS</span>
                <div style="display:flex; flex-direction:column; gap:2px;">
                     <div id="ui-bar-hp" title="Nexus HP"></div>
                     <div id="ui-bar-xp" title="Nexus XP to Level Up"></div>
                </div>
                <span id="ui-n-syn"></span>
            </div>
            <div style="min-width:100px; text-align:center; background:rgba(0,0,0,0.4); padding:5px 20px; border-radius:4px; border-bottom:2px solid #4ecca3;"><span style="color:#4ecca3; font-weight:bold; font-size:1.4em; text-shadow:0 0 10px #4ecca3;" id="ui-currency">$0</span></div>
            <div style="min-width:200px; text-align:right; display:flex; flex-direction:column; align-items:flex-end;" id="ui-poll-container">
                 <div id="ui-poll" style="font-size:0.8rem; color:#ccc;">POLLUTION</div>
                 <div id="ui-dash" style="font-size:0.7rem;"></div>
            </div>
        </div>
        <div class="controls-panel" style="position:fixed; bottom:120px; left:20px; font-size:0.75rem; color:#ccc; pointer-events:none; text-align:left; background:rgba(11,12,16,0.9); padding:12px; border-radius:8px; border:1px solid #333; box-shadow:0 4px 10px rgba(0,0,0,0.5);">
            <div style="margin-bottom:8px; color:#e94560; text-transform:uppercase; font-weight:bold; border-bottom:1px solid #333; padding-bottom:4px;">Command & Control</div>
            <div style="display:grid; grid-template-columns: auto auto; gap: 5px 15px;">
                <div><b style="color:#fff">WASD</b> Move</div>
                <div><b style="color:#fff">SHIFT+MOUSE</b> Move</div>
                <div><b style="color:#fff">HOLD CLICK</b> Mine</div>
                <div><b style="color:#fff">SPACE</b> Dash</div>
                <div><b style="color:#66fcf1">L-CLK</b> Build/Int</div>
                <div><b style="color:#fff">R-CLK</b> Move/Cancel</div>
                <div><b style="color:#ff2e63">X</b> Recycle</div>
                <div><b style="color:#fff">R</b> Rotate</div>
                <div><b style="color:#fff">E</b> Boost</div>
            </div>
        </div>`;
    }

    document.getElementById('ui-n-lvl').innerText = `v${nLvl}.0`;
    document.getElementById('ui-bar-hp').innerHTML = makeBar(nHp/maxHp*100, '#e94560', '80px');
    document.getElementById('ui-bar-xp').innerHTML = makeBar(xp/xpNext*100, '#ffd700', '80px');
    document.getElementById('ui-n-syn').innerHTML = syn;
    document.getElementById('ui-currency').innerText = `$${Math.floor(state.currency).toLocaleString()}`;
    
    const pollHTML = `<span>THREAT</span> ${makeBar(wavePct, waveColor, '80px')}`;
    document.getElementById('ui-poll').innerHTML = pollHTML;
    document.getElementById('ui-dash').innerHTML = `<span style="color:${dash > 20 ? '#aaa' : '#522'}">ENERGY</span> ${makeBar(dash, '#00adb5', '60px')}`;

    const hotbar = document.getElementById('hotbar');
    
    if (hotbar.childElementCount === 0) {
        const buildings = ['belt', 'miner', 'turret', 'processor', 'wall', 'splitter', 'storage'];
        const keys = ['1','2','3','4','5','6','7'];
        let html = `<div id="hb-q" class="hotbar-slot" onclick="window.dispatchEvent(new KeyboardEvent('keydown', {'key':'q'}))"><span class="key">Q</span><span style="font-size:1.2rem;">➜</span></div>`;
        buildings.forEach((b, i) => {
             html += `<div id="hb-${b}" class="hotbar-slot" onclick="window.dispatchEvent(new KeyboardEvent('keydown', {'key':'${keys[i]}'}))">
                <span class="key">${keys[i]}</span>
                <span class="name-label" style="font-size:0.6rem; display:block; margin-top:2px;">${b.toUpperCase()}</span>
                <span class="cost" id="cost-${b}"></span>
            </div>`;
        });
        hotbar.innerHTML = html;
    }

    const buildings = ['belt', 'miner', 'turret', 'processor', 'wall', 'splitter', 'storage'];
    const qSlot = document.getElementById('hb-q');
    if (qSlot) qSlot.className = `hotbar-slot ${!state.player.buildType ? 'active' : ''}`;
    
    buildings.forEach((b) => {
        const slot = document.getElementById(`hb-${b}`);
        if (!slot) return;
        const cost = COSTS[b];
        const req = LEVEL_REQS[b] || 0;
        const isLocked = nLvl < req;
        const isActive = state.player.buildType === b;
        slot.className = `hotbar-slot ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`;
        
        slot.style.borderColor = isActive ? '#e94560' : '#333';
        // Clear native title to use custom tooltip or just rely on cleaner UI
        const costSpan = slot.querySelector('.cost');
        // Clarity: Explicitly show lock status or cost. Color code affordance.
        if (costSpan) costSpan.innerHTML = isLocked ? `<span style='color:#888'>🔒${req}</span>` : `$${cost}`;
        
        // Better affordance feedback
        const canAfford = state.currency >= cost;
        if (costSpan && !isLocked) costSpan.style.color = canAfford ? '#66fcf1' : '#ff2e63';
    });

    let objective = "Objective: Automate Ore to Nexus.";
    let highlightSlot = null;
    const objBox = document.getElementById('objective-box');
    // Ensure dataset is init
    if (!objBox.dataset.lastText) { objBox.dataset.lastText = ""; objBox.style.opacity = 0; }
    
    const sCount = state.structures.length;
    
    // Guided Experience / Clarity
    if (state.currency < COSTS.miner && sCount <= 1) objective = "1. MINE ORE: Click Red Ore manually.";
    else if (sCount < 2) { objective = "1. Select MINER [2]. Place on Red Ore."; highlightSlot = 'miner'; }
    else if (state.structures.filter(s => s.type === 'belt').length < 3) { objective = state.currency < COSTS.belt ? "TIP: Manual Mine (Click Ore) for cash!" : "2. Select BELT [1]. Drag from Miner -> Nexus."; highlightSlot = 'belt'; }
    else if (nLvl === 1 && state.nexus.xp < state.nexus.xpToNext) objective = "3. Feed Nexus items to gain XP. Automate more veins!";
    // Clarity: Explicit instruction on leveling up
    else if (state.nexus.xp >= state.nexus.xpToNext) objective = "<span style='color:#ffd700; text-shadow:0 0 5px #ffd700;'>⚡ NEXUS CHARGED ⚡ Click Nexus to Level Up!</span>";
    else if (nLvl === 2 && state.structures.filter(s => s.type === 'processor').length === 0) { objective = "4. UNLOCKED: Processor. Smelt Ore -> Alloy."; highlightSlot = 'processor'; }
    else if (nLvl === 2 && state.structures.filter(s => s.type === 'processor').length > 0) objective = "5. Automate Alloys -> Nexus. TIP: 'E' boosts speed.";
    else if (state.pollution > 50 && state.structures.filter(s => s.type === 'turret').length === 0) { objective = "WARNING: POLLUTION HIGH. Build Turrets [3]!"; highlightSlot = 'turret'; }
    else if (nLvl >= 2 && state.structures.filter(s => s.type === 'turret').length === 0) objective = "6. Defense: Feed AMMO or ORE to Turrets.";
    else if (nLvl === 3) objective = "7. SYNERGY: Feed different items simultaneously for EXPONENTIAL bonuses.";
    else objective = state.player.buildType ? (DESCRIPTIONS[state.player.buildType] || "Expand.") : "Tip: 'E' on hot machines flushes heat for 3x Speed.";
 
    if (objBox.dataset.lastText !== objective) {
        // Clarity: Animation reset to draw attention to new objective
        objBox.innerHTML = objective;
        objBox.dataset.lastText = objective;
        objBox.classList.remove('pulse-anim');
        objBox.style.opacity = 1;
        void objBox.offsetWidth; // Trigger reflow
        objBox.classList.add('pulse-anim');
    }
    document.getElementById('recipe-list').innerHTML = Object.entries(RECIPES).map(([k,v]) => `<div class="recipe-row"><div class="r-in"><span class="res-icon" style="background:${COLORS['item_'+k]}"></span>${k.toUpperCase()}</div><div class="arrow">&rarr;</div><div class="r-out"><span class="res-icon" style="background:${v.color}"></span>${v.out.toUpperCase()}</div></div>`).join('');

    // UX: Tutorial Highlighting
    const slots = document.querySelectorAll('.hotbar-slot');
    slots.forEach(el => el.classList.remove('tutorial-highlight'));
    if (highlightSlot) { const el = document.getElementById(`hb-${highlightSlot}`); if(el) el.classList.add('tutorial-highlight'); }
}

export function endGame() {
    state.gameOver = true;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('final-score').innerText = "Final Score: " + state.score;
}
