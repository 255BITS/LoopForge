(() => {
  'use strict';

  // -------------------------
  // Utilities
  // -------------------------
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const rand = (a, b) => Math.random() * (b - a) + a;
  const format = (n) => {
    if (!isFinite(n)) return '∞';
    if (Math.abs(n) < 1) return n.toFixed(2);
    const units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    let u = 0;
    while (Math.abs(n) >= 1000 && u < units.length - 1) { n /= 1000; u++; }
    return `${n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0)}${units[u]}`;
  };
  const byId = (id) => /** @type {HTMLElement} */(document.getElementById(id));

  // -------------------------
  // DOM
  // -------------------------
  const dom = {
    saveIndicator: byId('save-indicator'),

    // Stats
    lvl: byId('stat-level'),
    gold: byId('stat-gold'),
    stage: byId('stat-stage'),
    click: byId('stat-click'),
    dps: byId('stat-dps'),
    crit: byId('stat-crit'),
    mult: byId('stat-mult'),
    xpBar: /** @type {HTMLElement} */ (byId('xp-bar')),

    // Enemy / fight
    enemyArea: byId('enemy-area'),
    enemyVideo: /** @type {HTMLVideoElement} */ (byId('enemy-video')),
    enemyName: byId('enemy-name'),
    enemyBadge: byId('enemy-badge'),
    hpBar: /** @type {HTMLElement} */ (byId('hp-bar')),
    hpText: byId('hp-text'),
    attackBtn: /** @type {HTMLButtonElement} */ (byId('attack-btn')),

    // Tabs
    tabHeaders: Array.from(document.querySelectorAll('.tab-header')),
    tabBodies: Array.from(document.querySelectorAll('.tab-body')),
    shopList: byId('shop-list'),
    tmplShopItem: /** @type {HTMLTemplateElement} */ (document.getElementById('shop-item-template')),

    // Aspects
    aspectsUnspent: byId('aspects-unspent'),
    allocFire: byId('alloc-fire'),
    allocFrost: byId('alloc-frost'),
    allocShadow: byId('alloc-shadow'),
    respecBtn: /** @type {HTMLButtonElement} */ (byId('respec-btn')),

    // Settings
    autosaveToggle: /** @type {HTMLInputElement} */ (byId('autosave-toggle')),
    muteToggle: /** @type {HTMLInputElement} */ (byId('mute-toggle')),
    floatersToggle: /** @type {HTMLInputElement} */ (byId('floaters-toggle')),
    saveBtn: /** @type {HTMLButtonElement} */ (byId('save-btn')),
    loadBtn: /** @type {HTMLButtonElement} */ (byId('load-btn')),
    resetBtn: /** @type {HTMLButtonElement} */ (byId('reset-btn')),
  };

  // -------------------------
  // Game Data
  // -------------------------
  const UPGRADE_DEFS = [
    {
      id: 'click1',
      emoji: '🪵',
      name: 'Wooden Stick',
      desc: '+1 click damage each.',
      baseCost: 10, costMult: 1.15,
      onBuy: (g) => { g.player.baseClick += 1; },
    },
    {
      id: 'dps1',
      emoji: '🧒',
      name: 'Hire Squire',
      desc: '+0.5 idle DPS each.',
      baseCost: 25, costMult: 1.17,
      onBuy: (g) => { g.player.baseDps += 0.5; },
    },
    {
      id: 'click2',
      emoji: '🗡️',
      name: 'Steel Sword',
      desc: '+10 click damage each.',
      baseCost: 250, costMult: 1.18,
      onBuy: (g) => { g.player.baseClick += 10; },
    },
    {
      id: 'crit',
      emoji: '🍀',
      name: 'Lucky Charm',
      desc: '+2% crit chance (max 75%).',
      baseCost: 500, costMult: 1.25,
      onBuy: (g) => { g.player.critChance = Math.min(0.75, g.player.critChance + 0.02); },
    },
    {
      id: 'mult1',
      emoji: '⚒️',
      name: 'Forge Blade',
      desc: '+25% global damage multiplier.',
      baseCost: 750, costMult: 1.35,
      onBuy: (g) => { g.player.globalMult *= 1.25; },
    },
    {
      id: 'dps2',
      emoji: '👥',
      name: 'Guild Hirelings',
      desc: '+5 idle DPS each.',
      baseCost: 2000, costMult: 1.22,
      onBuy: (g) => { g.player.baseDps += 5; },
    },
  ];

  const DEFAULT_STATE = {
    version: 1,
    player: {
      level: 1,
      xp: 0,
      xpToNext: 20,
      gold: 0,
      baseClick: 1,
      baseDps: 0,
      globalMult: 1,
      critChance: 0.00,    // 0..0.75
      critMultBase: 2.0,   // affected by Shadow attunement
    },
    progress: {
      zone: 1, // maps to video power level
      wave: 1, // 1..10, boss at 10
      bossesDefeated: 0,
    },
    enemy: {
      name: 'Wandering Slime',
      maxHp: 10,
      hp: 10,
      isBoss: false,
    },
    shop: {
      counts: {}, // id -> amount
    },
    aspects: {
      unspent: 0,
      alloc: { fire: 0, frost: 0, shadow: 0 },
    },
    settings: {
      autosave: true,
      muted: true,
      floaters: true,
    },
    meta: {
      lastSaveMs: 0,
    }
  };

  /** @type {typeof DEFAULT_STATE} */
  let state = structuredClone(DEFAULT_STATE);

  // -------------------------
  // Persistence
  // -------------------------
  const SAVE_KEY = 'runebloom.save.v1';
  function safeParse(json, fallback) {
    try {
      const v = JSON.parse(json);
      return v ?? fallback;
    } catch {
      return fallback;
    }
  }
  function deepMerge(target, source) {
    for (const k of Object.keys(source)) {
      const sv = source[k];
      const tv = target[k];
      if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
        if (!tv || typeof tv !== 'object') target[k] = Array.isArray(sv) ? [] : {};
        deepMerge(target[k], sv);
      } else {
        if (typeof tv === 'number' && typeof sv === 'number' && !isFinite(sv)) continue;
        target[k] = sv;
      }
    }
    return target;
  }
  function load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const parsed = safeParse(raw, null);
    if (!parsed || typeof parsed !== 'object') return;
    // Merge with defaults to fill any missing fields safely
    state = deepMerge(structuredClone(DEFAULT_STATE), parsed);
    sanitizeState();
  }
  function save() {
    try {
      dom.saveIndicator.classList.add('saving');
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      state.meta.lastSaveMs = Date.now();
      dom.saveIndicator.classList.remove('saving');
      dom.saveIndicator.classList.add('ok');
      setTimeout(() => dom.saveIndicator.classList.remove('ok'), 400);
    } catch {
      // ignore
    }
  }
  const debounced = (fn, ms) => {
    let t = 0;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };
  const saveSoon = debounced(save, 300);

  // -------------------------
  // Enemy / Stage helpers
  // -------------------------
  function currentStage() {
    const { zone, wave } = state.progress;
    return (zone - 1) * 10 + wave;
  }
  function stageHp(stage, isBoss) {
    const base = 25 * Math.pow(1.2, stage - 1);
    return Math.ceil(base * (isBoss ? 4 : 1));
  }
  function stageGold(stage) {
    const base = 5 * Math.pow(1.15, stage);
    return Math.floor(base * rand(0.95, 1.05));
  }
  function stageXp(stage) {
    const base = 3 * Math.pow(1.12, stage);
    return Math.floor(base * rand(0.95, 1.05));
  }

  const ENEMY_NAMES = [
    'Wandering Slime','Cave Bat','Murk Sprout','Stone Beetle','Gloom Rat',
    'Briar Imp','Moss Boar','Ash Wisp','Dusk Viper','Ridge Wolf'
  ];
  const BOSS_NAMES = [
    'Slime Sovereign','The Echo Bat','Elder Sprout','Carapace King','Rat Baron',
    'Briar Matron','Forest Tusker','Ash Revenant','Viper Queen','Lone Howler'
  ];

  function rollName(isBoss) {
    const list = isBoss ? BOSS_NAMES : ENEMY_NAMES;
    return list[(currentStage() - 1) % list.length];
  }

  function zoneToPowerVideo(zone) {
    // Map zone → 0..10, clamp
    return clamp(zone - 1, 0, 10);
  }

  function setEnemyVideoForZone(zone) {
    const power = zoneToPowerVideo(zone);
    const src = `assets/enemy-${power}.mp4`;
    const v = dom.enemyVideo;
    const onerr = () => {
      // Fallback to enemy-0 if missing
      v.removeEventListener('error', onerr);
      v.src = 'assets/enemy-0.mp4';
      v.load();
      v.play().catch(() => {});
    };
    v.removeEventListener('error', onerr);
    v.addEventListener('error', onerr, { once: true });
    v.src = src;
    v.muted = !!state.settings.muted;
    v.load();
    v.play().catch(() => {});
  }

  function spawnEnemy() {
    const stg = currentStage();
    const isBoss = state.progress.wave === 10;
    const maxHp = stageHp(stg, isBoss);
    const name = rollName(isBoss);
    state.enemy = { name, maxHp, hp: maxHp, isBoss };
    setEnemyVideoForZone(state.progress.zone);
  }

  function nextWave() {
    if (state.progress.wave < 10) {
      state.progress.wave++;
    } else {
      // defeated boss
      state.progress.wave = 1;
      state.progress.zone++;
    }
    spawnEnemy();
    render();
  }

  // -------------------------
  // Player math
  // -------------------------
  function attuneMultipliers() {
    const a = state.aspects.alloc;
    return {
      click: 1 + 0.05 * a.fire,
      dps: 1 + 0.05 * a.frost,
      critMultBonus: 1 + 0.05 * a.shadow,
    };
  }
  function effectiveClick() {
    const a = attuneMultipliers();
    return state.player.baseClick * state.player.globalMult * a.click;
  }
  function effectiveDps() {
    const a = attuneMultipliers();
    return state.player.baseDps * state.player.globalMult * a.dps;
  }
  function effectiveCritMult() {
    const a = attuneMultipliers();
    return state.player.critMultBase * a.critMultBonus;
  }

  function gainGold(n) {
    state.player.gold = Math.max(0, state.player.gold + n);
  }
  function gainXp(n) {
    state.player.xp += n;
    while (state.player.xp >= state.player.xpToNext) {
      state.player.xp -= state.player.xpToNext;
      state.player.level++;
      // simple level curve
      state.player.xpToNext = Math.ceil(state.player.xpToNext * 1.25 + 5);
    }
  }

  function applyDamage(amount) {
    if (!isFinite(amount) || amount <= 0) return;
    const e = state.enemy;
    e.hp = Math.max(0, e.hp - amount);
    if (e.hp <= 0) {
      const stg = currentStage();
      const g = stageGold(stg);
      const xp = stageXp(stg);
      gainGold(g);
      gainXp(xp);
      if (e.isBoss) {
        state.progress.bossesDefeated++;
        state.aspects.unspent++;
      }
      nextWave();
    }
  }

  // -------------------------
  // Combat interactions
  // -------------------------
  function strike() {
    const dmgBase = effectiveClick();
    const crit = Math.random() < state.player.critChance;
    const mult = crit ? effectiveCritMult() : 1;
    const dmg = dmgBase * mult;
    applyDamage(dmg);
    if (state.settings.floaters) spawnFloater(dmg, crit);
  }

  function idleTick(dt) {
    const dps = effectiveDps();
    applyDamage(dps * dt);
  }

  // Damage floaters
  function spawnFloater(value, crit) {
    const area = dom.enemyArea;
    const el = document.createElement('div');
    el.className = 'floater' + (crit ? ' crit' : '');
    el.textContent = crit ? `✧ ${format(value)}!` : `${format(value)}`;
    // position middle-bottom randomization
    const rect = area.getBoundingClientRect();
    const x = rect.width * (0.4 + Math.random() * 0.2);
    const y = rect.height * (0.5 + Math.random() * 0.2);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    area.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  // -------------------------
  // Shop / Upgrades
  // -------------------------
  function upgradeCount(id) {
    return state.shop.counts[id] || 0;
  }
  function upgradeCost(def) {
    const c = upgradeCount(def.id);
    return Math.ceil(def.baseCost * Math.pow(def.costMult, c));
  }
  function canAfford(cost) {
    return state.player.gold >= cost;
  }
  function buyUpgrade(def) {
    const cost = upgradeCost(def);
    if (!canAfford(cost)) return false;
    gainGold(-cost);
    state.shop.counts[def.id] = upgradeCount(def.id) + 1;
    try { def.onBuy(state); } catch {}
    render(); saveSoon();
    return true;
  }
  function renderShop() {
    const root = dom.shopList;
    root.innerHTML = '';
    for (const def of UPGRADE_DEFS) {
      const node = /** @type {HTMLElement} */ (dom.tmplShopItem.content.cloneNode(true));
      const el = /** @type {HTMLElement} */ (node.firstElementChild);
      el.querySelector('.emoji').textContent = def.emoji;
      el.querySelector('.name').textContent = def.name;
      el.querySelector('.desc').textContent = def.desc;
      const costEl = /** @type {HTMLElement} */ (el.querySelector('.cost'));
      const ownedEl = /** @type {HTMLElement} */ (el.querySelector('.owned'));
      const btn = /** @type {HTMLButtonElement} */ (el.querySelector('.buy'));
      const cost = upgradeCost(def);
      costEl.textContent = `${format(cost)} gold`;
      ownedEl.textContent = `x${upgradeCount(def.id)}`;
      btn.disabled = !canAfford(cost);
      btn.addEventListener('click', () => buyUpgrade(def), { once: true });
      root.appendChild(el);
    }
  }

  // -------------------------
  // Aspects (Attunements)
  // -------------------------
  function allocate(which, delta) {
    const a = state.aspects.alloc;
    if (!(which in a)) return;
    if (delta > 0 && state.aspects.unspent >= delta) {
      a[which] += delta;
      state.aspects.unspent -= delta;
    } else if (delta < 0 && a[which] >= Math.abs(delta)) {
      a[which] += delta;
      state.aspects.unspent -= delta; // delta is negative, so subtracting negative = add back
    }
    // fix potential negative due to race
    state.aspects.unspent = Math.max(0, state.aspects.unspent);
    a.fire = Math.max(0, a.fire|0);
    a.frost = Math.max(0, a.frost|0);
    a.shadow = Math.max(0, a.shadow|0);
    render();
    saveSoon();
  }
  function respec() {
    const a = state.aspects.alloc;
    state.aspects.unspent += (a.fire|0) + (a.frost|0) + (a.shadow|0);
    a.fire = a.frost = a.shadow = 0;
    render(); saveSoon();
  }

  // -------------------------
  // Render
  // -------------------------
  function renderStats() {
    dom.lvl.textContent = `${state.player.level}`;
    dom.gold.textContent = format(state.player.gold);
    dom.stage.textContent = `${state.progress.zone}-${state.progress.wave}`;
    dom.click.textContent = format(effectiveClick());
    dom.dps.textContent = format(effectiveDps());
    dom.mult.textContent = `×${state.player.globalMult.toFixed(2)}`;
    dom.crit.textContent = `${Math.round(state.player.critChance * 100)}% ×${effectiveCritMult().toFixed(2)}`;
    // XP bar
    const xpPct = clamp(state.player.xp / state.player.xpToNext, 0, 1) * 100;
    dom.xpBar.style.width = `${xpPct}%`;
  }

  function renderEnemy() {
    const e = state.enemy;
    dom.enemyName.textContent = e.name;
    dom.enemyBadge.textContent = `Lv.${currentStage()}`;
    const hpPct = clamp(e.hp / e.maxHp, 0, 1) * 100;
    dom.hpBar.style.width = `${hpPct}%`;
    dom.hpText.textContent = `${format(e.hp)} / ${format(e.maxHp)}`;
    dom.attackBtn.disabled = e.hp <= 0;
  }

  function renderAspects() {
    dom.aspectsUnspent.textContent = `${state.aspects.unspent}`;
    dom.allocFire.textContent = `${state.aspects.alloc.fire}`;
    dom.allocFrost.textContent = `${state.aspects.alloc.frost}`;
    dom.allocShadow.textContent = `${state.aspects.alloc.shadow}`;
  }

  function render() {
    renderStats();
    renderEnemy();
    renderShop();
    renderAspects();
  }

  // -------------------------
  // Tabs
  // -------------------------
  function setupTabs() {
    for (const btn of dom.tabHeaders) {
      btn.addEventListener('click', () => {
        for (const b of dom.tabHeaders) b.classList.toggle('active', b === btn);
        for (const body of dom.tabBodies) body.classList.remove('active');
        const id = `tab-${btn.dataset.tab}`;
        document.getElementById(id)?.classList.add('active');
      });
    }
  }

  // -------------------------
  // Settings bindings
  // -------------------------
  function setupSettings() {
    dom.autosaveToggle.checked = !!state.settings.autosave;
    dom.muteToggle.checked = !!state.settings.muted;
    dom.floatersToggle.checked = !!state.settings.floaters;

    dom.autosaveToggle.addEventListener('change', () => {
      state.settings.autosave = !!dom.autosaveToggle.checked; saveSoon();
    });
    dom.muteToggle.addEventListener('change', () => {
      state.settings.muted = !!dom.muteToggle.checked;
      dom.enemyVideo.muted = state.settings.muted;
      saveSoon();
    });
    dom.floatersToggle.addEventListener('change', () => {
      state.settings.floaters = !!dom.floatersToggle.checked; saveSoon();
    });

    dom.saveBtn.addEventListener('click', save);
    dom.loadBtn.addEventListener('click', () => { load(); render(); });
    dom.resetBtn.addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        state = structuredClone(DEFAULT_STATE);
        spawnEnemy();
        render();
        save();
      }
    });
  }

  // -------------------------
  // Events
  // -------------------------
  function setupEvents() {
    dom.attackBtn.addEventListener('click', () => strike());

    // Keyboard: Space to strike
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); strike(); }
    });

    // Aspect allocation buttons
    document.getElementById('tab-aspects')?.addEventListener('click', (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (!(target instanceof HTMLElement)) return;
      const which = target.getAttribute('data-alloc');
      const deltaStr = target.getAttribute('data-delta');
      if (which && deltaStr) {
        const delta = parseInt(deltaStr, 10);
        if (!Number.isNaN(delta)) allocate(which, delta);
      }
    });
    dom.respecBtn.addEventListener('click', respec);

    window.addEventListener('beforeunload', () => { if (state.settings.autosave) save(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && state.settings.autosave) save(); });
  }

  // -------------------------
  // Main loop
  // -------------------------
  let last = performance.now();
  function loop(now) {
    const dt = clamp((now - last) / 1000, 0, 0.5); // cap delta to avoid huge jumps
    last = now;
    idleTick(dt);
    renderEnemy(); // cheap refresh each frame
    if (state.settings.autosave && now - state.meta.lastSaveMs > 5000) save();
    requestAnimationFrame(loop);
  }

  // -------------------------
  // Data validation
  // -------------------------
  function sanitizeState() {
    const s = state;
    if (!s || typeof s !== 'object') return;
    s.player.level = Math.max(1, s.player.level|0);
    s.player.xp = Math.max(0, Number(s.player.xp)||0);
    s.player.xpToNext = Math.max(5, Number(s.player.xpToNext)||20);
    s.player.gold = Math.max(0, Number(s.player.gold)||0);
    s.player.baseClick = Math.max(0, Number(s.player.baseClick)||1);
    s.player.baseDps = Math.max(0, Number(s.player.baseDps)||0);
    s.player.globalMult = clamp(Number(s.player.globalMult)||1, 0.01, 1e6);
    s.player.critChance = clamp(Number(s.player.critChance)||0, 0, 0.75);
    s.player.critMultBase = clamp(Number(s.player.critMultBase)||2.0, 1.5, 100);

    s.progress.zone = Math.max(1, s.progress.zone|0);
    s.progress.wave = clamp(s.progress.wave|0, 1, 10);
    s.progress.bossesDefeated = Math.max(0, s.progress.bossesDefeated|0);

    if (!s.shop.counts || typeof s.shop.counts !== 'object') s.shop.counts = {};
    if (!s.aspects.alloc) s.aspects.alloc = { fire: 0, frost: 0, shadow: 0 };
    s.aspects.unspent = Math.max(0, s.aspects.unspent|0);
    for (const k of ['fire','frost','shadow']) s.aspects.alloc[k] = Math.max(0, s.aspects.alloc[k]|0);

    if (!s.enemy || typeof s.enemy !== 'object') {
      s.enemy = { name: 'Wandering Slime', maxHp: 10, hp: 10, isBoss: false };
    } else {
      s.enemy.maxHp = Math.max(1, Number(s.enemy.maxHp)||10);
      s.enemy.hp = clamp(Number(s.enemy.hp)||s.enemy.maxHp, 0, s.enemy.maxHp);
      s.enemy.isBoss = !!s.enemy.isBoss;
      s.enemy.name = String(s.enemy.name||'Wandering Slime');
    }
    if (!s.settings) s.settings = structuredClone(DEFAULT_STATE.settings);
  }

  // -------------------------
  // Bootstrap
  // -------------------------
  function init() {
    setupTabs();
    setupSettings();
    setupEvents();
    load();
    sanitizeState();
    spawnEnemy();
    render();
    requestAnimationFrame(loop);
  }

  // Kickoff after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
