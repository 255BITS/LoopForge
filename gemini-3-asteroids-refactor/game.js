import { createEnemy } from './enemies/Factory.js';
import { Player } from './entities/Player.js';
import { Bullet, createBullet } from './entities/Bullet.js';
import { Particle } from './effects/Particle.js';
import { FloatingText } from './effects/FloatingText.js';
import { LightningBolt } from './effects/LightningBolt.js';
import { Vortex } from './effects/Vortex.js';
import { RailBeam } from './effects/RailBeam.js';
import { StarField } from './effects/StarField.js';
import { audioCtx, sfx, bgm } from './systems/Audio.js';
import { GameUI } from './ui/GameUI.js';
import { Input } from './systems/Input.js';
import { UpgradePool } from './upgrades/UpgradePool.js';
import { Spawner } from './systems/Spawner.js';
import { CollisionSystem } from './physics/CollisionSystem.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameState = 'START'; // START, PLAYING, LEVEL_UP, GAMEOVER
let lastTime = 0;
let score = 0;
let level = 1;
let xp = 0;
let xpToNextLevel = 50;
let combo = 0;
let comboTimer = 0;
let ultCharge = 0;
let isOverdrive = false;
let enemyTimeScale = 1.0;
let freezeTimer = 0;
let screenShake = 0;
let hitStop = 0;
let highScore = localStorage.getItem('survivor_highscore') || 0;
let floatingTexts = [];
let rerolls = 3;
let globalPulse = 1.0;
const spawner = new Spawner();
const collisionSystem = new CollisionSystem();
let starField;

// Interface
const ui = new GameUI();

// Entities
let player;
let boss = null;
let bullets = [];
let enemies = [];
let particles = [];
let gems = [];
let vortexes = [];
let beams = []; // Railgun beams

ui.bindStart(startGame);

// Callbacks for the Collision System to interact with Game Loop state
const collisionCallbacks = {
    onGameOver: triggerGameOver,
    onLevelUp: levelUp
};

Input.init(canvas);

window.addEventListener('resize', resize);

Input.onAction((action) => {
    if(action === 'PAUSE') togglePause();
    if(action === 'OVERDRIVE' && gameState === 'PLAYING' && ultCharge >= 100 && !isOverdrive) {
        isOverdrive = true;
        sfx.overdrive();
        screenShake = 20;
        createExplosion(player.x, player.y, '#fff', 20);
        // Overdrive Blast: Clear bullets and push enemies
        bullets = bullets.filter(b => b.team === 'player');
        enemies.forEach(e => {
            const d = Math.hypot(e.x - player.x, e.y - player.y);
            if(d < 400) {
                const a = Math.atan2(e.y - player.y, e.x - player.x);
                e.x += Math.cos(a) * 150; e.y += Math.sin(a) * 150;
                e.hp -= 50; e.hitFlash = 10;
            }
        });
    }
});

bgm.onBeat = (t, b) => {
    if (b % 4 === 0) sfx.playTone(100, 'square', 0.1, 0.4, t);
    if (b % 4 === 0 && gameState === 'PLAYING') {
        globalPulse = 1.2; 
    }
    if (b % 4 === 2) sfx.playTone(6000, 'sawtooth', 0.05, 0.05, t);
    if ([0,3,6,10].includes(b % 16)) sfx.playTone(55 + (level%3)*10, 'sawtooth', 0.15, 0.15, t);
};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    starField = new StarField(30);
}
resize();

function startGame() {
    player = new Player(canvas.width / 2, canvas.height / 2);
    bullets = [];
    enemies = [];
    gems = [];
    particles = [];
    vortexes = [];
    beams = [];
    floatingTexts = [];
    score = 0;
    level = 1;
    xp = 0;
    xpToNextLevel = 50;
    ultCharge = 0;
    isOverdrive = false;
    freezeTimer = 0;
    rerolls = 3;
    boss = null;
    combo = 0;
    comboTimer = 0;
    gameState = 'PLAYING';
    
    ui.startGame(); // UI State reset
    lastTime = performance.now();
    spawner.reset();
    bgm.start();
    requestAnimationFrame(loop);
}

function triggerGameOver() {
    createExplosion(player.x, player.y, '#0ff');
    screenShake = 20;
    gameState = 'GAMEOVER';
    bgm.stop();
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('survivor_highscore', highScore);
    }
    ui.showGameOver();
}

function levelUp() {
    sfx.levelup();
    gameState = 'LEVEL_UP';
    xp -= xpToNextLevel;
    level++;
    xpToNextLevel = Math.floor(xpToNextLevel * 1.2);
    
    gems.forEach(g => g.magnetized = true); // Vacuum effect!
    screenShake = 15;

    // Level Up Shockwave - Wipes weak enemies for a power moment
    enemies.forEach(e => {
        if (e.type !== 'boss') { e.hp = 0; createExplosion(e.x, e.y, '#fff', 4); }
    });
    
    for(let i=0;i<60;i++) particles.push(new Particle(player.x, player.y, `hsl(${Math.random()*360},100%,50%)`));
    
    const showMenu = () => {
        const choices = UpgradePool.getChoices(3);
        
        ui.showUpgradeMenu(choices, rerolls, (choice) => {
            choice.apply(player);
            gameState = 'PLAYING';
            lastTime = performance.now();
            requestAnimationFrame(loop);
        }, () => {
            rerolls--;
            showMenu();
        });
    };
    
    showMenu();
}

function loop(timestamp) {
    if (gameState !== 'PLAYING') return;

    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (hitStop > 0) {
        hitStop--;
        requestAnimationFrame(loop);
        return;
    }

    // Time Scale Logic
    enemyTimeScale = isOverdrive ? 0.3 : 1.0;
    globalPulse += (1.0 - globalPulse) * 0.1;
    if (freezeTimer > 0) {
        freezeTimer--;
        enemyTimeScale = 0;
    }

    ctx.fillStyle = 'rgba(15, 15, 25, 0.25)'; // Longer trails for neon vibe
    if (freezeTimer > 0) ctx.fillStyle = 'rgba(0, 50, 55, 0.25)';
    if (isOverdrive) {
        ctx.fillStyle = 'rgba(40, 0, 10, 0.5)'; // Red tint but allow trails
    }
    
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (screenShake > 0) {
        ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }

    // Draw Stars
    if(starField) {
        starField.update(player, canvas.width, canvas.height);
        starField.draw(ctx);
    }

    // Grid
    const pulse = (0.05 + Math.sin(timestamp * 0.004) * 0.03) * globalPulse;
    // Parallax Grid
    const gx = (player.x * 0.2) % 50;
    const gy = (player.y * 0.2) % 50;
    ctx.strokeStyle = `rgba(0, 255, 255, ${Math.min(1, pulse * 2)})`;
    ctx.lineWidth = globalPulse;
    ctx.beginPath();
    // Draw slightly extra to cover wrap gaps visually if needed, though plain grid is fine
    for(let x=-gx; x<canvas.width; x+=50) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
    for(let y=-gy; y<canvas.height; y+=50) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
    ctx.stroke();

    // Spawn Logic
    spawner.update({
        level,
        enemies,
        player,
        width: canvas.width,
        height: canvas.height,
        isOverdrive,
        floatingTexts,
        onBossSpawn: (b) => boss = b
    });

    if (isOverdrive) {
        ultCharge -= 0.3;
        if (ultCharge <= 0) {
            ultCharge = 0;
            isOverdrive = false;
        }
        if (Math.random() < 0.3) {
             const angle = Math.random() * Math.PI * 2;
             particles.push(new Particle(player.x + Math.cos(angle)*20, player.y + Math.sin(angle)*20, '#fff'));
        }
    }

    ui.updateOverdrive(ultCharge, isOverdrive);

    // Updates
    if(comboTimer > 0) comboTimer--;
    else combo = 0;
    
    // Context Construction for Sub-System Updates
    const gameContext = {
        // State Primitives (Passed as values, but needed for some logic)
        level,
        isOverdrive,
        combo,
        xp,
        xpToNextLevel,

        // State Mutators (For systems to modify Game Loop state)
        addScore: (val) => score += val,
        addCombo: () => {
            combo++;
            comboTimer = 150;
        },
        addUlt: (val) => {
            if (!isOverdrive) ultCharge = Math.min(100, ultCharge + val);
        },
        addXp: (val) => {
            xp += val;
            if(xp >= xpToNextLevel) collisionCallbacks.onLevelUp();
        },
        setFreeze: (time) => freezeTimer = time,
        addShake: (val) => screenShake = Math.max(screenShake, val),
        triggerHitStop: (val) => hitStop = val,
        
        player,
        bullets,
        enemies,
        gems,
        vortexes,
        floatingTexts,
        beams,
        particles,
        width: canvas.width, 
        height: canvas.height,
        enemyTimeScale,
        timeScale: enemyTimeScale,
        keys: Input.keys,
        input: Input.mouse,
        isOverdrive,
        combo,
        sfx,
        addParticle: (p) => particles.push(p),
        addBullet: (b) => bullets.push(b),
        addBeam: (b) => beams.push(b),
        setScreenShake: (val) => { screenShake = Math.max(screenShake, val); },
        createExplosion: createExplosion,
        spawnMinion: (x,y) => {
            const m = createEnemy(level, canvas.width, canvas.height, false, 'speeder');
            m.x = x; m.y = y;
            enemies.push(m);
        },
        spawnEnemy: (type, x, y) => {
            const m = createEnemy(level, canvas.width, canvas.height, false, type);
            m.x = x; m.y = y;
            enemies.push(m);
        },
        onBossKilled: () => boss = null,
        callbacks: collisionCallbacks
    };

    player.update(dt, gameContext);
    bullets.forEach(b => b.update(gameContext));
    enemies.forEach(e => e.update(gameContext));
    gems.forEach(g => g.update(player));
    vortexes.forEach((v, i) => {
        v.update(enemies);
        if(v.life <= 0) vortexes.splice(i, 1);
    });
    particles.forEach((p, i) => {
        p.update();
        if (p.life <= 0) particles.splice(i, 1);
    });
    beams.forEach((b, i) => {
        b.update();
        if(b.life <= 0) beams.splice(i, 1);
    });
    floatingTexts.forEach((t, i) => {
        t.update();
        if (t.life <= 0) floatingTexts.splice(i, 1);
    });
    
    // Delegate Collision Logic
    collisionSystem.update(gameContext);
    
    // Permanent neon glow for entities
    // ctx.globalCompositeOperation = 'lighter';
    
    vortexes.forEach(v => v.draw(ctx));
    gems.forEach(g => g.draw(ctx));
    beams.forEach(b => b.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    player.draw(ctx);
    bullets.forEach(b => b.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    floatingTexts.forEach(t => t.draw(ctx));

    ctx.restore(); // End shake

    // HUD
    ui.updateScore(level, score, combo);
    ui.updateBoss(boss);

    requestAnimationFrame(loop);
}

function togglePause() {
    if (gameState === 'PLAYING') gameState = 'PAUSED';
    else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        lastTime = performance.now();
        requestAnimationFrame(loop);
    }
}

function createExplosion(x, y, color, count = 10) {
    for(let i=0; i<count; i++) {
        particles.push(new Particle(x, y, color));
    }
}
