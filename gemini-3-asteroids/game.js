const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const startBtn = document.getElementById('start-btn');
const upgradeMenu = document.getElementById('upgrade-menu');
const optionsContainer = document.getElementById('options');
const instructions = document.getElementById('instructions');
const scoreEl = document.getElementById('score');
const overdriveUI = document.getElementById('overdrive-ui');
const overdriveFill = document.getElementById('overdrive-bar-fill');
const bossHud = document.getElementById('boss-hud');
const bossHpBar = document.getElementById('boss-hp-bar');

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
const stars = Array.from({length: 30}, () => ({x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, s: Math.random() * 2 + 0.5}));

// Inputs
const keys = { w: false, a: false, s: false, d: false, " ": false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };

// Entities
let player;
let boss = null;
let bullets = [];
let enemies = [];
let particles = [];
let gems = [];
let vortexes = [];
let beams = []; // Railgun beams

let mouseX = canvas.width/2;
let mouseY = canvas.height/2;

window.addEventListener('resize', resize);
window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' || e.key === 'p') togglePause();
    if((e.key === 'e' || e.key === 'E' || e.key === 'Shift') && gameState === 'PLAYING' && ultCharge >= 100 && !isOverdrive) {
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
    keys[e.key] = true;
});
window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
window.addEventListener('keyup', (e) => keys[e.key] = false);
startBtn.addEventListener('click', startGame);

// Audio System
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const sfx = {
    playTone: (freq, type, dur, vol=0.1, time=audioCtx.currentTime) => {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.start(time);
        osc.stop(time + dur);
    },
    shoot: () => sfx.playTone(300 + Math.random()*100, 'square', 0.1, 0.05),
    hit: () => sfx.playTone(100 + Math.random()*50, 'sawtooth', 0.1, 0.05),
    explode: () => {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator(); 
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'square'; // Crunchier explosions
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    },
    xp: () => sfx.playTone(800 + Math.random()*200, 'sine', 0.1, 0.03),
    powerup: () => {
        sfx.playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => sfx.playTone(1200, 'sine', 0.3, 0.1), 100);
    },
    levelup: () => [440,554,659,880].forEach((f,i)=>setTimeout(()=>sfx.playTone(f,'triangle',0.4,0.1),i*100)),
    overdrive: () => {
        sfx.playTone(200, 'sawtooth', 0.1, 0.2);
        [400, 600, 800, 1200].forEach((f,i) => setTimeout(() => sfx.playTone(f, 'square', 0.2, 0.1), i*50));
    }
};

const bgm = {
    isPlaying: false,
    nextNoteTime: 0,
    beat: 0,
    tempo: 135,
    schedule: () => {
        if (!bgm.isPlaying) return;
        const secondsPerBeat = 60.0 / bgm.tempo;
        const lookahead = 0.1;
        while (bgm.nextNoteTime < audioCtx.currentTime + lookahead) {
            bgm.playBeat(bgm.nextNoteTime, bgm.beat);
            bgm.nextNoteTime += secondsPerBeat / 4;
            bgm.beat = (bgm.beat + 1) % 16;
        }
        bgm.timerID = requestAnimationFrame(bgm.schedule);
    },
    playBeat: (t, b) => {
        if (b % 4 === 0) sfx.playTone(100, 'square', 0.1, 0.4, t); // Kick
        if (b % 4 === 0 && gameState === 'PLAYING') {
            globalPulse = 1.2; // Beat Pulse
        }
        if (b % 4 === 2) sfx.playTone(6000, 'sawtooth', 0.05, 0.05, t); // Hat
        if ([0,3,6,10].includes(b % 16)) sfx.playTone(55 + (level%3)*10, 'sawtooth', 0.15, 0.15, t); // Bass
    },
    start: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (bgm.isPlaying) return;
        bgm.isPlaying = true; bgm.nextNoteTime = audioCtx.currentTime; bgm.schedule();
    },
    stop: () => { bgm.isPlaying = false; cancelAnimationFrame(bgm.timerID); }
};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();

class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.vx = 0;
        this.vy = 0;
        this.radius = 15;
        this.color = '#0ff';
        this.friction = 0.92;
        this.accel = 1.2;
        
        // Stats
        this.hp = 100;
        this.maxHp = 100;
        this.fireRate = 400; // ms - Reduced start rate
        this.lastFire = 0;
        this.bulletSpeed = 9;
        this.damage = 15;
        this.bulletCount = 1;
        this.spread = 0.2;
        this.piercing = 0;
        this.dashCooldown = 0;
        this.dashTime = 0;
        this.blastRadius = 0;
        this.trail = [];
        this.orbitals = 0;
        this.orbitalAngle = 0;
        this.thunder = 0;
        this.regen = 0;
        this.regenTimer = 0;
        this.homing = 0;
        this.ricochet = 0;
        this.vortex = 0;
        this.nova = 0;
        this.novaTimer = 0;
        this.railgun = 0;
        this.railTimer = 0;
        this.cluster = 0;
        this.boomerang = 0;
        this.angle = 0;
        this.tesla = 0;
        this.teslaTimer = 0;
        this.saws = 0;
        this.sawAngle = 0;
    }

    update(dt) {
        // Physics Movement
        let dx = 0;
        let dy = 0;
        if (keys['w'] || keys['ArrowUp']) dy -= 1;
        if (keys['s'] || keys['ArrowDown']) dy += 1;
        if (keys['a'] || keys['ArrowLeft']) dx -= 1;
        if (keys['d'] || keys['ArrowRight']) dx += 1;

        // Apply force
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            const s = isOverdrive ? this.accel * 2 : this.accel;
            this.vx += (dx / len) * s;
            this.vy += (dy / len) * s;
            
            // Engine Trail
            if (Math.random() < 0.5) {
                const angle = Math.atan2(this.vy, this.vx);
                const bx = this.x - Math.cos(angle) * this.radius;
                const by = this.y - Math.sin(angle) * this.radius;
                particles.push(new Particle(bx + (Math.random()-0.5)*5, by + (Math.random()-0.5)*5, '#0aa'));
            }
        }

        // Friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.dashTime > 0) this.dashTime--;

        if (keys[' '] && this.dashCooldown <= 0) {
            this.dashTime = 15;
            this.dashCooldown = 90;
            // Dash in movement direction or looking direction
            const angle = (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) 
                        ? Math.atan2(this.vy, this.vx) 
                        : Math.atan2(dy, dx);
            
            this.vx = Math.cos(angle) * 12; // Burst speed
            this.vy = Math.sin(angle) * 12;
            
            createExplosion(this.x, this.y, '#fff', 12);
            screenShake = 5;
            
            // Magnet Dash: Pull gems when dashing to make it more useful
            gems.forEach(g => { if(Math.hypot(g.x-this.x, g.y-this.y) < 300) g.magnetized = true; });
            particles.push(new Particle(this.x, this.y, '#0ff'));
        }

        this.x += this.vx;
        this.y += this.vy;

        // Trail
        if (this.dashTime > 0)
        this.trail.push({x: this.x, y: this.y, alpha: 0.6});
        if (this.trail.length > 10) this.trail.shift();
        this.trail.forEach(t => t.alpha *= 0.9);

        // Bounds (Screen Wrap)
        const margin = this.radius;
        if (this.x < -margin) this.x = canvas.width + margin;
        else if (this.x > canvas.width + margin) this.x = -margin;
        if (this.y < -margin) this.y = canvas.height + margin;
        else if (this.y > canvas.height + margin) this.y = -margin;

        this.orbitalAngle += 0.05;
        this.sawAngle -= 0.15;

        // Rotation Logic (Auto Target)
        const nearest = this.getNearestEnemy();
        const targetAngle = nearest ? Math.atan2(nearest.y - this.y, nearest.x - this.x) : Math.atan2(mouseY - this.y, mouseX - this.x);

        let diff = targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle += diff * 0.3; // Snappier rotation

        // Nova Ability
        if (this.nova > 0) {
            this.novaTimer--;
            if (this.novaTimer <= 0) {
                this.novaTimer = Math.max(30, 150 - (this.nova * 10));
                const count = 12 + this.nova * 2;
                for(let i=0; i<count; i++) {
                    const a = this.orbitalAngle + (Math.PI*2/count)*i;
                    bullets.push(new Bullet(this.x, this.y, Math.cos(a)*5, Math.sin(a)*5, this.damage*0.5, 99, 'player'));
                }
            }
        }

        // Railgun Ability
        if (this.railgun > 0) {
            this.railTimer--;
            if (this.railTimer <= 0) {
                this.railTimer = Math.max(40, 180 - this.railgun * 20);
                // Fire railgun in looking direction
                // If no enemy is close, fire at random or towards mouse if desired, here we do random if empty
                let angle = this.angle;
                
                // Beam logic
                beams.push(new RailBeam(this.x, this.y, angle, this.damage * 3 + (this.railgun * 10)));
                sfx.shoot(); // Should have a heavier sound really
                screenShake = 8;
                
                // Push player back
                this.vx -= Math.cos(angle) * 5;
                this.vy -= Math.sin(angle) * 5;
            }
        }

        // Tesla Coil Passive
        if (this.tesla > 0) {
            this.teslaTimer--;
            if (this.teslaTimer <= 0) {
                this.teslaTimer = Math.max(10, 60 - this.tesla * 5);
                const nearest = this.getNearestEnemy();
                if (nearest && Math.hypot(nearest.x - this.x, nearest.y - this.y) < 250) {
                    nearest.hp -= this.damage * 0.8;
                    nearest.hitFlash = 10;
                    particles.push(new LightningBolt(this.x, this.y, nearest.x, nearest.y));
                    sfx.playTone(800 + Math.random() * 200, 'sawtooth', 0.1, 0.05);
                }
            }
        }

        // Regen
        if (this.regen > 0 && this.hp < this.maxHp) {
            this.regenTimer++;
            if (this.regenTimer > 60) {
                this.hp = Math.min(this.maxHp, this.hp + this.regen);
                this.regenTimer = 0;
            }
        }

        // Auto Fire
        let rate = this.fireRate;
        if (isOverdrive) rate = 40; // Machine gun mode in Overdrive
        rate /= (1 + Math.min(0.5, combo * 0.01)); // Combo increases fire rate up to 50%
        if (this.dashTime <= 0 && Date.now() - this.lastFire > rate && gameState !== 'LEVEL_UP') {
            this.shoot();
            this.lastFire = Date.now();
        }
    }

    getNearestEnemy() {
        let nearest = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            const d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (d < minDist) {
                minDist = d;
                nearest = enemy;
            }
        }
        return nearest;
    }

    shoot() {
        const angle = this.angle;
        
        // Shoot multiple bullets based on upgrade
        const startAngle = angle - (this.spread * (this.bulletCount - 1)) / 2;
        
        for (let i = 0; i < this.bulletCount; i++) {
            let spreadAmt = this.spread;
            // In Overdrive, we increase spread for chaos
            if (isOverdrive) spreadAmt = 0.4; 
            
            // Add slight randomness to spread for "Juice"
            const randomness = (Math.random() - 0.5) * (isOverdrive ? 0.2 : 0.05);
            const fireAngle = (this.bulletCount > 1 ? (angle - (spreadAmt * (this.bulletCount - 1)) / 2) + i * spreadAmt : angle) + randomness;
            const isRainbow = isOverdrive || combo > 20;
            
            // Muzzle flash
            const mx = this.x + Math.cos(fireAngle) * (this.radius + 10);
            const my = this.y + Math.sin(fireAngle) * (this.radius + 10);
            particles.push(new Particle(mx, my, isRainbow ? `hsl(${Date.now()%360},100%,50%)` : '#fff'));
            
            bullets.push(new Bullet(
                mx, 
                my, 
                Math.cos(fireAngle) * this.bulletSpeed, 
                Math.sin(fireAngle) * this.bulletSpeed,
                this.damage, 
                this.piercing,
                'player',
                this.homing,
                this.ricochet,
                this.boomerang,
                isRainbow
            ));
        }
        
        // Recoil & feedback
        screenShake = Math.max(screenShake, 2);
        sfx.shoot();
    }

    draw(ctx) {
        ctx.save();
        
        // Draw Trail
        this.trail.forEach(t => {
            ctx.globalAlpha = t.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(t.x, t.y, this.radius * 0.6, 0, Math.PI*2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        

        // Draw Triangle Ship
        ctx.beginPath(); 
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius * 0.7, -this.radius * 0.7);
        ctx.lineTo(-this.radius * 0.4, 0);
        ctx.lineTo(-this.radius * 0.7, this.radius * 0.7);
        ctx.closePath();
        
        ctx.strokeStyle = this.dashTime > 0 ? '#fff' : this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (this.dashCooldown > 0) {
            ctx.strokeStyle = '#555';
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 6, -Math.PI/2, (Math.PI*2 * (1 - this.dashCooldown/90)) - Math.PI/2); ctx.stroke();
        } else {
            ctx.strokeStyle = 'rgba(0,255,255,0.6)';
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 6, 0, Math.PI*2); ctx.stroke();
        }

        // Dash Cooldown Bar
        if (this.dashCooldown > 0) {
            ctx.fillStyle = '#444';
            ctx.fillRect(-15, 30, 30, 3);
            ctx.fillStyle = '#fff';
            ctx.fillRect(-15, 30, 30 * (1 - this.dashCooldown/90), 3);
        }

        // Orbitals
        if (this.orbitals > 0) {
            ctx.fillStyle = '#0ff';
            for(let i=0; i<this.orbitals; i++) {
                const ang = this.orbitalAngle + (i * (Math.PI*2/this.orbitals));
                ctx.beginPath(); ctx.arc(Math.cos(ang)*50, Math.sin(ang)*50, 6, 0, Math.PI*2); ctx.fill();
            }
        }
         
        // Saws
        if (this.saws > 0) {
            ctx.fillStyle = '#f00';
            const sawRadius = 70 + (this.saws * 10);
            for(let i=0; i<this.saws; i++) {
                const ang = this.sawAngle + (i * (Math.PI*2/this.saws));
                const sx = Math.cos(ang) * sawRadius;
                const sy = Math.sin(ang) * sawRadius;
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(this.sawAngle * 3); // Spin fast
                ctx.beginPath();
                // Draw saw shape
                for(let j=0; j<8; j++) {
                    const a = (Math.PI*2/8)*j;
                    ctx.lineTo(Math.cos(a)*12, Math.sin(a)*12);
                    ctx.lineTo(Math.cos(a+0.4)*6, Math.sin(a+0.4)*6);
                }
                ctx.fill();
                ctx.restore();
            }
        }

        // HP Bar
        ctx.fillStyle = 'red';
        ctx.fillRect(-20, 25, 40, 4);
        ctx.fillStyle = 'lime';
        ctx.fillRect(-20, 25, 40 * (this.hp / this.maxHp), 4);
        
        ctx.restore();
    }
}

class Enemy {
    constructor(isBoss = false) {
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) { this.x = Math.random() * canvas.width; this.y = -30; }
        else if (edge === 1) { this.x = canvas.width + 30; this.y = Math.random() * canvas.height; }
        else if (edge === 2) { this.x = Math.random() * canvas.width; this.y = canvas.height + 30; }
        else { this.x = -30; this.y = Math.random() * canvas.height; }

        // Enemy Types
        const r = Math.random();
        if (isBoss) {
            this.type = 'boss';
            this.radius = 60;
            this.hp = 500 + (level * 100);
            this.speed = 0.6;
            this.color = '#f00';
            this.attackTimer = 100;
        } else if (!isBoss && level > 4 && r < 0.1) { // Kamikaze
            this.type = 'kamikaze';
            this.radius = 14; this.hp = 10 + level*2; this.speed = 0; // custom update
            this.color = '#fa0';
        } else if (level > 2 && r < 0.15) { // Tank
            this.type = 'tank';
            this.radius = 25;
            this.hp = 80 + (level * 20);
            this.speed = 0.5 + (level * 0.05);
            this.color = '#e44';
        } else if (level > 3 && r < 0.25) { // Splitter
            this.type = 'splitter';
            this.radius = 30;
            this.hp = 60 + (level * 15);
            this.speed = 1.1;
            this.color = '#91f';
        } else if (level > 1 && r < 0.35) { // Speeder
            this.type = 'speeder';
            this.radius = 8;
            this.hp = 15 + (level * 5);
            this.speed = 3 + (level * 0.2);
            this.color = '#fd0';
        } else if (level > 3 && r < 0.45) { // Shooter
            this.type = 'shooter';
            this.radius = 15;
            this.hp = 30 + (level * 8);
            this.speed = 1 + (level * 0.05);
            this.color = '#f0f';
            this.reload = 60;
        } else if (level > 2 && r < 0.55) { // Summoner
            this.type = 'summoner';
            this.radius = 22;
            this.hp = 40 + (level * 10);
            this.speed = 0.8;
            this.color = '#90f';
            this.reload = 200;
        } else { // Basic
            this.type = 'basic';
            this.radius = 12 + Math.random() * 8;
            this.speed = 1.5 + Math.random() + (level * 0.1);
            this.hp = 25 + (level * 10);
            this.color = '#f55';
        }
        this.maxHp = this.hp;

        this.points = [];
        const sides = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const dist = this.radius * (0.8 + Math.random() * 0.4);
            this.points.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
        }
        this.angle = 0;
        this.spin = (Math.random() - 0.5) * 0.1;
        this.hitFlash = 0;
        this.spawnScale = 0;
    }

    update() {
        // Spawn animation
        if (this.spawnScale < 1) this.spawnScale = Math.min(1, this.spawnScale + 0.1);

        const es = enemyTimeScale;
        if (es === 0) return; // Frozen

        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        
        if (this.type === 'shooter') {
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            // Maintain distance
            if (dist > 250) {
                this.x += Math.cos(angle) * this.speed * es;
                this.y += Math.sin(angle) * this.speed * es;
            } else if (dist < 150) {
                this.x -= Math.cos(angle) * this.speed * es;
                this.y -= Math.sin(angle) * this.speed * es;
            }
            
            if (this.reload <= 0 && dist < 400) {
                bullets.push(new Bullet(this.x, this.y, Math.cos(angle)*4, Math.sin(angle)*4, 10, 0, 'enemy'));
                this.reload = 120;
            } else this.reload -= es;
        } else if (this.type === 'summoner') {
            this.x += Math.cos(angle) * this.speed * es;
            this.y += Math.sin(angle) * this.speed * es;
            if (this.reload <= 0) {
                this.reload = 200;
                for(let k=0; k<2; k++) {
                    const minion = new Enemy();
                    minion.x = this.x + (Math.random()-0.5)*40;
                    minion.y = this.y + (Math.random()-0.5)*40;
                    minion.speed = 4; minion.hp = 10; minion.radius = 8; minion.type = 'speeder'; minion.color = '#fd0';
                    minion.points.forEach(p => { p.x *= 0.5; p.y *= 0.5; });
                    enemies.push(minion);
                }
            } else this.reload -= es;
        } else if (this.type === 'boss') {
            // Boss moves and has special attack
            this.x += Math.cos(angle) * this.speed * es;
            this.y += Math.sin(angle) * this.speed * es;
            this.attackTimer -= es;
            if (this.attackTimer <= 0) {
                this.attackTimer = 180; // 3 sec cooldown
                for(let k=0; k<16; k++) { // Nova Blast
                    const a = this.angle + (Math.PI * 2 / 16) * k;
                    bullets.push(new Bullet(this.x, this.y, Math.cos(a)*5, Math.sin(a)*5, 12, 0, 'enemy'));
                }
                screenShake = 6;
            }
        } else if (this.type === 'kamikaze') {
            this.speed += 0.05 * es; // Accelerate
            if(this.speed > 9) this.speed = 9;
            this.x += Math.cos(angle) * this.speed * es;
            this.y += Math.sin(angle) * this.speed * es;
            // Screen shake if getting close
            if(Math.random()<0.1 && Math.hypot(player.x-this.x, player.y-this.y) < 150) screenShake = 2;
        } else {
            this.x += Math.cos(angle) * this.speed * es;
            this.y += Math.sin(angle) * this.speed * es;
        }
        
        // Soft Separation (prevent perfect stacking)
        if (enemies.length > 1) {
            // Check a random neighbor to save performance vs O(N^2)
            const neighbor = enemies[Math.floor(Math.random() * enemies.length)];
            if (neighbor !== this) {
                const dx = this.x - neighbor.x;
                const dy = this.y - neighbor.y;
                const dist = Math.hypot(dx, dy);
                if (dist < this.radius + neighbor.radius && dist > 0) {
                    this.x += (dx / dist) * 0.5 * es;
                    this.y += (dy / dist) * 0.5 * es;
                }
            }
        }

        this.angle += this.spin * es;
        if (this.hitFlash > 0) this.hitFlash--;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.spawnScale, this.spawnScale);
        ctx.rotate(this.angle);
        ctx.beginPath();
        this.points.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.strokeStyle = this.hitFlash > 0 ? '#fff' : this.color;
        ctx.stroke();

        // HP Bar for non-basic
        if (this.type !== 'basic' && this.hp < this.maxHp) {
            ctx.rotate(-this.angle);
            ctx.fillStyle = '#400';
            ctx.fillRect(-20, -this.radius - 10, 40, 4);
            ctx.fillStyle = '#f00';
            ctx.fillRect(-20, -this.radius - 10, 40 * Math.max(0, this.hp / this.maxHp), 4);
        }

        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, vx, vy, damage, piercing, team, homing = 0, ricochet = 0, boomerang = 0, rainbow = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.life = 100; // frames
        this.piercing = piercing;
        this.team = team;
        this.homing = homing;
        this.ricochet = ricochet;
        this.boomerang = boomerang;
        this.hitList = [];
        this.radius = 3;
        this.color = rainbow ? `hsl(${Math.random()*360},100%,60%)` : (team === 'enemy' ? '#f0f' : '#ff0');
        this.maxSpeed = Math.hypot(vx, vy);
    }

    update() {
        let ts = 1;
        if (this.team === 'enemy') ts = enemyTimeScale;
        if (ts === 0) return;

        if (this.homing > 0 && this.team === 'player') {
            let target = null;
            let minD = 400;
            for(let e of enemies) {
                const d = Math.hypot(e.x - this.x, e.y - this.y);
                if(d < minD) { minD = d; target = e; }
            }
            if(target) {
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                this.vx += Math.cos(angle) * 0.5 * this.homing;
                this.vy += Math.sin(angle) * 0.5 * this.homing;
                const s = Math.hypot(this.vx, this.vy);
                if(s > 12) { this.vx = (this.vx/s)*12; this.vy = (this.vy/s)*12; }
            }
        }

        if (this.boomerang > 0 && this.team === 'player') {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            const turnSpeed = 0.2 + (this.boomerang * 0.1);
            this.vx += (dx / dist) * turnSpeed;
            this.vy += (dy / dist) * turnSpeed;
            const s = Math.hypot(this.vx, this.vy);
            if (s > this.maxSpeed * 1.5) {
                this.vx = (this.vx / s) * (this.maxSpeed * 1.5);
                this.vy = (this.vy / s) * (this.maxSpeed * 1.5);
            }
        }

        this.x += this.vx * ts;
        this.y += this.vy * ts;
        
        if (this.ricochet > 0) {
            if (this.x < 0 || this.x > canvas.width) { this.vx = -this.vx; this.ricochet--; }
            if (this.y < 0 || this.y > canvas.height) { this.vy = -this.vy; this.ricochet--; }
        }
        
        this.life -= ts;
    }

    draw(ctx) {
        ctx.beginPath();
        const tailLen = 15;
        const angle = Math.atan2(this.vy, this.vx);
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - Math.cos(angle) * tailLen * (this.color.includes('hsl') ? 2 : 1), this.y - Math.sin(angle) * tailLen * (this.color.includes('hsl') ? 2 : 1));
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
}

class RailBeam {
    constructor(x, y, angle, damage) {
        this.x = x; this.y = y; this.angle = angle; this.damage = damage;
        this.life = 20; this.maxLife = 20;
    }
    update() { this.life--; }
    draw(ctx) {
        const w = 1000;
        const ex = this.x + Math.cos(this.angle) * w;
        const ey = this.y + Math.sin(this.angle) * w;
        
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(ex, ey);
        ctx.lineWidth = 4 + (this.life/2);
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.restore();
    }
}

class Gem {
    constructor(x, y, val, type = 'xp') {
        this.x = x;
        this.y = y;
        this.val = val;
        this.type = type;
        this.magnetized = false;
        this.radius = type === 'xp' ? 4 : 12;
    }

    update() {
        const d = Math.hypot(player.x - this.x, player.y - this.y);
        
        // Inherent slight magnetism for better flow
        if (!this.magnetized && d < 600) {
            this.x += (player.x - this.x) * 0.002;
            this.y += (player.y - this.y) * 0.002;
        }

        if (this.magnetized || d < 120) { // Magnet range
            const speed = this.magnetized ? 0.25 : 0.15;
            this.x += (player.x - this.x) * speed;
            this.y += (player.y - this.y) * speed;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.type !== 'xp') {
             const pulse = 1 + Math.sin(performance.now() * 0.01) * 0.1;
             ctx.scale(pulse, pulse);
        }
        ctx.beginPath();
        if (this.type === 'xp') {
            ctx.moveTo(0, -this.radius);
            ctx.lineTo(this.radius, 0);
            ctx.lineTo(0, this.radius);
            ctx.lineTo(-this.radius, 0);
            ctx.fillStyle = '#0f0';
        } else {
            ctx.arc(0, 0, this.radius, 0, Math.PI*2);
            ctx.fillStyle = this.type === 'heal' ? '#f33' : (this.type === 'nuke' ? '#fa0' : (this.type === 'freeze' ? '#0ff' : '#aaf'));
        }
        ctx.closePath();
        ctx.fill();
        
        if (this.type !== 'xp') {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let t = '?';
            if(this.type==='heal') t='✚';
            if(this.type==='nuke') t='☢';
            if(this.type==='magnet') t='🧲';
            if(this.type==='freeze') t='❄️';
            ctx.fillText(t, 0, 1); 
        }
        ctx.restore();
    }
}

function startGame() {
    player = new Player();
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
    overdriveUI.classList.remove('hidden');
    rerolls = 3;
    boss = null;
    bossHud.classList.remove('active');
    combo = 0;
    comboTimer = 0;
    gameState = 'PLAYING';
    startBtn.classList.add('hidden');
    instructions.classList.add('hidden');
    lastTime = performance.now();
    spawnTimer = 0;
    bgm.start();
    requestAnimationFrame(loop);
}

function checkCollisions() {
    // Bullets hit Enemies
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        
        if (b.team === 'enemy') {
            if (player.dashTime <= 0) {
                const dist = Math.hypot(b.x - player.x, b.y - player.y);
                if (dist < player.radius + b.radius) {
                    player.hp -= b.damage;
                    screenShake = 5;
                    bullets.splice(i, 1);
                    if (player.hp <= 0) triggerGameOver();
                    continue;
                }
            }
        } else {
            for (let j = enemies.length - 1; j >= 0; j--) {
                let e = enemies[j];
                if (b.hitList.includes(e)) continue;

                const dist = Math.hypot(b.x - e.x, b.y - e.y);
                if (dist < e.radius + b.radius) {
                    e.hp -= b.damage;
                    e.hitFlash = 2;
                    sfx.hit();
                    floatingTexts.push(new FloatingText(e.x, e.y - e.radius, b.damage));
                    b.hitList.push(e);
                    if (b.piercing <= 0) b.life = 0;
                    else b.piercing--;
                    
                    // Explosive Logic
                    if (player.blastRadius > 0) {
                        createExplosion(e.x, e.y, '#fa0', 2); // Reduced particle count for perf
                        enemies.forEach(nearby => {
                            if (nearby !== e && Math.hypot(nearby.x - e.x, nearby.y - e.y) < player.blastRadius) {
                                nearby.hp -= b.damage * 0.5;
                                nearby.hitFlash = 2;
                            }
                        });
                    }
                    
                    // Thunder Logic (Chain Lightning)
                    if (player.thunder > 0) {
                        let chains = 0;
                        for (let other of enemies) {
                            if (chains >= player.thunder) break;
                            // Find neighbors
                            if (other !== e && Math.hypot(other.x - e.x, other.y - e.y) < 180) {
                                other.hp -= b.damage * 0.7;
                                other.hitFlash = 5;
                                particles.push(new LightningBolt(e.x, e.y, other.x, other.y));
                                chains++;
                            }
                        }
                    }

                    // Vortex Logic
                    if (player.vortex > 0 && Math.random() < (0.05 + player.vortex * 0.05)) {
                        vortexes.push(new Vortex(e.x, e.y, player.vortex));
                    }

                    // Cluster Bomb Logic
                    if (player.cluster > 0 && Math.random() < (0.2 + player.cluster * 0.1)) {
                        createExplosion(e.x, e.y, '#ff8', 6);
                        // Small area damage from secondary blasts
                        enemies.forEach(nearby => { if(nearby!==e && Math.hypot(nearby.x-e.x, nearby.y-e.y) < 60) nearby.hp -= b.damage*0.5; });
                    }

                    break; // Bullet processed for this frame/enemy
                }
            }
        }
        if (b.life <= 0) bullets.splice(i, 1);
    }

    // Beam Collisions (Railgun)
    for (let i = beams.length - 1; i >= 0; i--) {
        const b = beams[i];
        if(b.life < b.maxLife - 1) continue; // Only hit on first frame effectively
        
        // Line vs Circle collision roughly
        const p1 = {x: b.x, y: b.y};
        const p2 = {x: b.x + Math.cos(b.angle)*1000, y: b.y + Math.sin(b.angle)*1000};
        
        for (let e of enemies) {
            // Project point e on line p1-p2
            const num = Math.abs((p2.y - p1.y)*e.x - (p2.x - p1.x)*e.y + p2.x*p1.y - p2.y*p1.x);
            const den = Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));
            const dist = num / den;
            
            if (dist < e.radius + 20) { // 20 is beam width/leeway
                 e.hp -= b.damage;
                 e.hitFlash = 5;
                 createExplosion(e.x, e.y, '#0ff', 3);
            }
        }
    }

    // Orbitals hit Enemies
    if (player.orbitals > 0) {
        for (let e of enemies) {
            for(let i=0; i<player.orbitals; i++) {
                const angle = player.orbitalAngle + (i * (Math.PI * 2 / player.orbitals));
                const ox = player.x + Math.cos(angle) * 50;
                const oy = player.y + Math.sin(angle) * 50;
                if (Math.hypot(ox - e.x, oy - e.y) < 8 + e.radius) {
                    e.hp -= 2;
                    e.hitFlash = 1;
                }
            }
        }
    }

    // Buzzsaw Logic
    if (player.saws > 0) {
        const sawRadius = 70 + (player.saws * 10);
        for (let e of enemies) {
             const d = Math.hypot(player.x - e.x, player.y - e.y);
             // Approximate saw ring collision
             if (Math.abs(d - sawRadius) < 20) {
                 e.hp -= 2 + (player.saws * 1); // Shredder
                 e.hitFlash = 1;
                 if (Math.random() < 0.1) particles.push(new Particle(e.x, e.y, '#f00'));
             }
        }
    }

    // Cleanup Dead Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].hp <= 0) {
            const e = enemies[i];
            if (e.type === 'splitter') {
                if (!isOverdrive) {
                    ultCharge = Math.min(100, ultCharge + (e.type === 'basic' ? 2 : 5));
                }
                for(let k=0; k<3; k++) {
                    const mini = new Enemy();
                    mini.x = e.x + (Math.random()-0.5)*20;
                    mini.y = e.y + (Math.random()-0.5)*20;
                    mini.type = 'basic';
                    mini.radius = 12; mini.hp = 20; mini.speed = e.speed * 1.5;
                    mini.points.forEach(p => { p.x *= 0.4; p.y *= 0.4; });
                    enemies.push(mini);
                }
            } else {
                if (!isOverdrive) {
                    ultCharge = Math.min(100, ultCharge + (e.type === 'boss' ? 50 : (e.type === 'basic' ? 2 : 5)));
                }
            }
            
            // Drops
            if (e.type === 'boss') {
                boss = null;
                // Boss Loot Fountain
                for(let k=0; k<10; k++) gems.push(new Gem(e.x+(Math.random()-0.5)*50, e.y+(Math.random()-0.5)*50, 50));
                gems.push(new Gem(e.x, e.y, 0, 'heal'));
                gems.push(new Gem(e.x, e.y, 0, 'magnet'));
            } else if (Math.random() < 0.02) {
                const r = Math.random();
                if (r < 0.33) gems.push(new Gem(e.x, e.y, 0, 'heal'));
                else if (r < 0.66) gems.push(new Gem(e.x, e.y, 0, 'magnet'));
                else if (r < 0.85) gems.push(new Gem(e.x, e.y, 0, 'nuke'));
                else gems.push(new Gem(e.x, e.y, 0, 'freeze'));
            } else {
                gems.push(new Gem(e.x, e.y, 10));
            }

            createExplosion(e.x, e.y, e.color, 10);
            sfx.explode();
            hitStop = 3;
            enemies.splice(i, 1);
            combo++;
            comboTimer = 150; // 2.5s
            score += 10 * (1 + Math.floor(combo / 5));
            screenShake = 5;

            // Chain Reaction: Soul Seekers on Combo
            if (combo > 5 || isOverdrive) {
                const count = isOverdrive ? 3 : 1;
                for(let s=0; s<count; s++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 8 + Math.random() * 4;
                    bullets.push(new Bullet(e.x, e.y, Math.cos(angle)*speed, Math.sin(angle)*speed, player.damage * 0.5, 1, 'player', 0.8, 0, 0, true));
                }
            }
        }
    }

    // Player hits Enemies
    for (let e of enemies) {
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (dist < player.radius + e.radius) {
            if (player.dashTime <= 0 && !isOverdrive) player.hp -= 2; // Vulnerable // Increased damage for danger
            else { e.hp -= 5; e.hitFlash = 2; } // Dash Ram
            
            if (e.type === 'kamikaze') {
                e.hp = 0; // Die instantly
                player.hp -= 25; // Big hurt
                createExplosion(player.x, player.y, '#fa0', 20);
                screenShake = 15;
                sfx.explode();
            }
            if (player.hp <= 0) {
                triggerGameOver();
            }
        }
    }

    // Player hits Gems
    for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i];
        const dist = Math.hypot(player.x - g.x, player.y - g.y);
        if (dist < player.radius + g.radius) {
            if (g.type === 'xp') {
                xp += g.val * (level < 5 ? 1.2 : 1.5);
                if (xp >= xpToNextLevel) levelUp();
                else sfx.xp();
            } else if (g.type === 'heal') {
                player.hp = Math.min(player.maxHp, player.hp + 40);
                floatingTexts.push(new FloatingText(player.x, player.y, "♥ HEAL"));
                sfx.powerup();
            } else if (g.type === 'magnet') {
                gems.forEach(gem => gem.magnetized = true);
                floatingTexts.push(new FloatingText(player.x, player.y, "🧲 MAGNET"));
                sfx.powerup();
            } else if (g.type === 'nuke') {
                enemies.forEach(e => {
                    e.hp = 0;
                    createExplosion(e.x, e.y, '#fa0', 6);
                });
                screenShake = 30;
                sfx.explode();
                floatingTexts.push(new FloatingText(player.x, player.y, "☢ NUKE"));
            } else if (g.type === 'freeze') {
                freezeTimer = 300; // 5 seconds
                floatingTexts.push(new FloatingText(player.x, player.y, "❄️ FREEZE"));
                sfx.powerup();
            }
            gems.splice(i, 1);
        }
    }
}

function triggerGameOver() {
    createExplosion(player.x, player.y, '#0ff');
    screenShake = 20;
    gameState = 'GAMEOVER';
    bgm.stop();
    overdriveUI.classList.add('hidden');
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('survivor_highscore', highScore);
    }
    startBtn.innerText = 'Game Over - Retry';
    startBtn.classList.remove('hidden');
    instructions.classList.remove('hidden');
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
    
    const upgrades = [
        { name: 'Rapid Fire', desc: 'Shoot 15% faster', apply: () => player.fireRate *= 0.85 },
        { name: 'High Caliber', desc: '+8 Damage', apply: () => player.damage += 8 },
        { name: 'Multishot', desc: '+1 Projectile', apply: () => player.bulletCount++ },
        { name: 'Speed', desc: 'Move faster', apply: () => player.speed += 1 },
        { name: 'Piercing', desc: '+1 Pierce', apply: () => player.piercing++ },
        { name: 'Health', desc: 'Heal 50 HP', apply: () => player.hp = Math.min(player.maxHp, player.hp + 50) },
        { name: 'Orbitals', desc: '+1 Shield Orbs', apply: () => player.orbitals++ },
        { name: 'Explosive', desc: 'Blast Dmg', apply: () => player.blastRadius += 40 },
        { name: 'Thunder', desc: 'Chain Lightning', apply: () => player.thunder += 2 },
        { name: 'Regen', desc: '+1 HP/sec', apply: () => player.regen++ },
        { name: 'Homing', desc: 'Missiles', apply: () => player.homing++ },
        { name: 'Ricochet', desc: 'Bouncy Bullets', apply: () => player.ricochet++ },
        { name: 'Vortex', desc: 'Gravity Wells', apply: () => player.vortex++ },
        { name: 'Nova', desc: 'Periodic Ring Blast', apply: () => player.nova++ },
        { name: 'Railgun', desc: 'Particle Beam', apply: () => player.railgun++ },
        { name: 'Cluster Bomb', desc: 'Hits cause explosions', apply: () => player.cluster++ },
        { name: 'Shotgun', desc: '+3 Bullets, Spread', apply: () => { player.bulletCount+=3; player.spread+=0.3; player.fireRate*=1.1; } },
        { name: 'Sniper', desc: 'Fast & Piercing', apply: () => { player.damage+=30; player.bulletSpeed+=5; player.piercing+=5; } },
        { name: 'Boomerang', desc: 'Bullets Return', apply: () => player.boomerang++ },
        { name: 'Tesla Coil', desc: 'Passive Zaps', apply: () => player.tesla++ },
        { name: 'Frenzy', desc: '+20% Fire Rate, -10 HP', apply: () => { player.fireRate *= 0.8; player.maxHp -= 10; player.hp = Math.min(player.hp, player.maxHp); } },
        { name: 'Buzzsaw', desc: 'Orbiting Blades', apply: () => player.saws++ }
    ];
    
    const renderOptions = () => {
        optionsContainer.innerHTML = '';
        const choices = [];
        while(choices.length < 3) {
            const r = upgrades[Math.floor(Math.random() * upgrades.length)];
            if(!choices.includes(r)) choices.push(r);
        }

        choices.forEach(choice => {
            const div = document.createElement('div');
            div.className = 'upgrade-option';
            div.innerHTML = `<strong>${choice.name}</strong><br>${choice.desc}`;
            div.onclick = () => {
                choice.apply();
                upgradeMenu.classList.add('hidden');
                gameState = 'PLAYING';
                lastTime = performance.now();
                requestAnimationFrame(loop);
            };
            optionsContainer.appendChild(div);
        });

        if (rerolls > 0) {
            const btn = document.createElement('div');
            btn.className = 'upgrade-option reroll-btn';
            btn.innerHTML = `<strong>🎲 REROLL</strong><br>Remaining: ${rerolls}`;
            btn.style.borderColor = '#fa0';
            btn.style.color = '#fa0';
            btn.onclick = () => { rerolls--; renderOptions(); };
            optionsContainer.appendChild(btn);
        }
    };
    renderOptions();

    upgradeMenu.classList.remove('hidden');
}

let spawnTimer = 0;

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
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
        // Parallax effect
        s.x -= player.vx * (s.s * 0.1);
        s.y -= player.vy * (s.s * 0.1);
        
        // Screen Wrap for stars
        if (s.x < 0) s.x += canvas.width;
        else if (s.x > canvas.width) s.x -= canvas.width;
        if (s.y < 0) s.y += canvas.height;
        else if (s.y > canvas.height) s.y -= canvas.height;

        ctx.globalAlpha = 0.2 + Math.random() * 0.5;
        ctx.fillRect(s.x, s.y, s.s, s.s);
    });
    ctx.globalAlpha = 1;

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
    spawnTimer += (isOverdrive ? 0.5 : 1); // Slow spawning in overdrive
    if (Math.floor(spawnTimer) % 1000 === 0) { // Hordes (More frequent)
        if (level % 5 === 0) {
            floatingTexts.push(new FloatingText(player.x, player.y - 80, "⚠️ BOSS APPROACHING ⚠️"));
            let b = new Enemy(true);
            enemies.push(b);
            boss = b;
        } else if (enemies.length < 60) { // Cap swarm spawns
            floatingTexts.push(new FloatingText(player.x, player.y - 50, "⚠️ SWARM DETECTED ⚠️"));
            // Ring Formation
            const count = Math.min(15, 5 + level * 1); // Cap swarm size
            const radius = 400;
            for(let i=0; i < count; i++) {
                const e = new Enemy();
                const angle = (Math.PI * 2 / count) * i;
                e.x = player.x + Math.cos(angle) * radius;
                e.y = player.y + Math.sin(angle) * radius;
                enemies.push(e);
            }
        }
    }
    if (enemies.length < 60 && Math.floor(spawnTimer) % Math.max(30, 70 - level*2) === 0) { // Regular
        enemies.push(new Enemy());
    }

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

    overdriveFill.style.width = `${ultCharge}%`;
    if (ultCharge >= 100) overdriveUI.classList.add('ready');
    else overdriveUI.classList.remove('ready');
    if (isOverdrive) {
        overdriveFill.style.boxShadow = `0 0 ${Math.random()*20 + 10}px #fff`;
        overdriveFill.style.background = '#fff';
    } else {
        overdriveFill.style.boxShadow = '0 0 10px #fff';
        overdriveFill.style.background = 'linear-gradient(90deg, #f0f, #0ff)';
    }

    // Updates
    if(comboTimer > 0) comboTimer--;
    else combo = 0;
    
    player.update(dt);
    bullets.forEach(b => b.update());
    enemies.forEach(e => e.update()); // Simple homing
    gems.forEach(g => g.update());
    vortexes.forEach((v, i) => {
        v.update();
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
    
    // Reset composite for standard drawing if not overdrive, actually let's keep lighter for overdrive entities
    // But text and UI might look weird.

    checkCollisions();

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
    scoreEl.innerText = `Level: ${level} | Score: ${score} | Combo: ${combo}`;
    if(boss) {
        bossHud.classList.add('active');
        bossHpBar.style.width = (boss.hp / boss.maxHp * 100) + '%';
    } else {
        bossHud.classList.remove('active');
    }

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

// Missing Helper Classes
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        this.vx = (Math.random()-0.5)*4; this.vy = (Math.random()-0.5)*4;
        this.life = 1.0;
    }
    update() { this.x += this.vx; this.y += this.vy; this.life -= 0.04; }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
    }
}
class FloatingText {
    constructor(x,y,text) { this.x=x; this.y=y; this.text=text; this.life=60; }
    update() { this.y -= 0.5; this.life--; }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life/60);
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle='#fff'; ctx.strokeStyle='#000'; ctx.lineWidth=3;
        ctx.strokeText(this.text, this.x, this.y); ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha=1;
    }
}
class LightningBolt {
    constructor(x1,y1,x2,y2) { this.x1=x1; this.y1=y1; this.x2=x2; this.y2=y2; this.life=8; }
    update() { this.life--; }
    draw(ctx) {
        ctx.globalAlpha = this.life/8; ctx.strokeStyle='#0ff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(this.x1, this.y1); ctx.lineTo(this.x2, this.y2); ctx.stroke();
        ctx.globalAlpha=1;
    }
}
class Vortex {
    constructor(x,y,lvl) { this.x=x; this.y=y; this.lvl=lvl; this.life=120; this.angle=0; }
    update() {
        this.life--; this.angle+=0.1;
        enemies.forEach(e=>{
            if(Math.hypot(e.x-this.x, e.y-this.y)<150) {
                 let a = Math.atan2(this.y-e.y, this.x-e.x);
                 e.x+=Math.cos(a)*3; e.y+=Math.sin(a)*3;
            }
        });
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x,this.y); ctx.rotate(this.angle);
        ctx.strokeStyle='#a0f'; ctx.lineWidth=3;
        ctx.beginPath();
        for(let i=0;i<3;i++) {
            ctx.rotate(Math.PI*2/3); ctx.moveTo(0,0); 
            for(let r=10;r<100;r+=10) ctx.lineTo(r, Math.sin(r*0.1)*20);
        }
        ctx.stroke(); ctx.restore();
    }
}
