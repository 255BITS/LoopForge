import { FloatingText } from '../effects/FloatingText.js';
import { LightningBolt } from '../effects/LightningBolt.js';
import { Vortex } from '../effects/Vortex.js';
import { createItem } from '../items/Factory.js';
import { Bullet } from '../entities/Bullet.js';
import { createEnemy } from '../enemies/Factory.js';

export class CollisionSystem {
    update(context) {
        const { 
            bullets, enemies, player, gems, beams, vortexes, particles,
            width, height, level, isOverdrive, floatText,
            addScore, addCombo, addUlt, addXp, setFreeze, addShake, triggerHitStop,
            createExplosion, sfx, floatingTexts, callbacks, onBossKilled
        } = context;

        // 1. Bullets vs Enemies (and Player)
        for (let i = bullets.length - 1; i >= 0; i--) {
            let b = bullets[i];
            
            if (b.team === 'enemy') {
                if (player.dashTime <= 0) {
                    const dist = Math.hypot(b.x - player.x, b.y - player.y);
                    if (dist < player.radius + b.radius) {
                        player.hp -= b.damage;
                        if(addShake) addShake(5);
                        bullets.splice(i, 1);
                        if (player.hp <= 0) callbacks.onGameOver();
                        continue;
                    }
                }
            } else {
                for (let j = enemies.length - 1; j >= 0; j--) {
                    let e = enemies[j];
                    if (b.hitList.includes(e)) continue;

                    const dist = Math.hypot(b.x - e.x, b.y - e.y);
                    if (dist < e.radius + b.radius) {
                        // Hit Logic
                        e.hp -= b.damage;
                        e.hitFlash = 2;
                        sfx.hit();
                        floatingTexts.push(new FloatingText(e.x, e.y - e.radius, b.damage));
                        b.hitList.push(e);
                        
                        if (b.piercing <= 0) b.life = 0;
                        else b.piercing--;
                        
                        // Ability Procs that happen on HIT
                        if (player.blastRadius > 0) {
                            createExplosion(e.x, e.y, '#fa0', 2); 
                            enemies.forEach(nearby => {
                                if (nearby !== e && Math.hypot(nearby.x - e.x, nearby.y - e.y) < player.blastRadius) {
                                    nearby.hp -= b.damage * 0.5;
                                    nearby.hitFlash = 2;
                                }
                            });
                        }
                        
                        if (player.thunder > 0) {
                            let chains = 0;
                            for (let other of enemies) {
                                if (chains >= player.thunder) break;
                                if (other !== e && Math.hypot(other.x - e.x, other.y - e.y) < 180) {
                                    other.hp -= b.damage * 0.7;
                                    other.hitFlash = 5;
                                    particles.push(new LightningBolt(e.x, e.y, other.x, other.y));
                                    chains++;
                                }
                            }
                        }

                        if (player.vortex > 0 && Math.random() < (0.05 + player.vortex * 0.05)) {
                            vortexes.push(new Vortex(e.x, e.y, player.vortex));
                        }

                        if (player.cluster > 0 && Math.random() < (0.2 + player.cluster * 0.1)) {
                            createExplosion(e.x, e.y, '#ff8', 6);
                            enemies.forEach(nearby => { if(nearby!==e && Math.hypot(nearby.x-e.x, nearby.y-e.y) < 60) nearby.hp -= b.damage*0.5; });
                        }

                        break; 
                    }
                }
            }
            if (b.life <= 0) bullets.splice(i, 1);
        }

        // 2. Beams vs Enemies (Railgun)
        for (let i = beams.length - 1; i >= 0; i--) {
            const b = beams[i];
            if(b.life < b.maxLife - 1) continue; 
            const p1 = {x: b.x, y: b.y};
            const p2 = {x: b.x + Math.cos(b.angle)*1000, y: b.y + Math.sin(b.angle)*1000};
            for (let e of enemies) {
                const num = Math.abs((p2.y - p1.y)*e.x - (p2.x - p1.x)*e.y + p2.x*p1.y - p2.y*p1.x);
                const den = Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));
                if (num / den < e.radius + 20) {
                     e.hp -= b.damage; e.hitFlash = 5; createExplosion(e.x, e.y, '#0ff', 3);
                }
            }
        }

        // 3. Enemy Death & Cleanup
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (enemies[i].hp <= 0) {
                const e = enemies[i];
                
                // Splitter Logic
                if (e.type === 'splitter') {
                    addUlt(e.type === 'basic' ? 2 : 5);
                    for(let k=0; k<3; k++) {
                        const mini = createEnemy(level, width, height, false, 'basic');
                        mini.x = e.x + (Math.random()-0.5)*20; mini.y = e.y + (Math.random()-0.5)*20;
                        mini.radius = 12; mini.hp = 20; mini.speed = e.speed * 1.5;
                        mini.points.forEach(p => { p.x *= 0.4; p.y *= 0.4; }); 
                        enemies.push(mini);
                    }
                } else {
                    addUlt(e.type === 'boss' ? 50 : (e.type === 'basic' ? 2 : 5));
                }
                
                // Drops
                if (e.type === 'boss') {
                    if(onBossKilled) onBossKilled();
                    for(let k=0; k<10; k++) gems.push(createItem(e.x+(Math.random()-0.5)*50, e.y+(Math.random()-0.5)*50, 50));
                    gems.push(createItem(e.x, e.y, 0, 'heal'));
                    gems.push(createItem(e.x, e.y, 0, 'magnet'));
                } else if (Math.random() < 0.02) {
                    const r = Math.random();
                    if (r < 0.33) gems.push(createItem(e.x, e.y, 0, 'heal'));
                    else if (r < 0.66) gems.push(createItem(e.x, e.y, 0, 'magnet'));
                    else if (r < 0.85) gems.push(createItem(e.x, e.y, 0, 'nuke'));
                    else gems.push(createItem(e.x, e.y, 0, 'freeze'));
                } else {
                    gems.push(createItem(e.x, e.y, 10));
                }

                createExplosion(e.x, e.y, e.color, 10);
                sfx.explode();
                triggerHitStop(3);
                enemies.splice(i, 1);
                addCombo();
                addScore(10 * (1 + Math.floor(context.combo / 5))); // Approximate combo from context
                addShake(5);

                // Combo / Overdrive Soul Seekers
                if (context.combo > 5 || isOverdrive) {
                    const count = isOverdrive ? 3 : 1;
                    for(let s=0; s<count; s++) {
                        const a = Math.random() * Math.PI * 2;
                        const sp = 8 + Math.random() * 4;
                        bullets.push(new Bullet(e.x, e.y, Math.cos(a)*sp, Math.sin(a)*sp, player.damage * 0.5, 1, 'player', 0.8, 0, 0, true));
                    }
                }
            }
        }

        // 4. Player vs Enemies / Gems
        for (let e of enemies) {
            const dx = player.x - e.x;
            const dy = player.y - e.y;
            const dist = Math.hypot(dx, dy);
            const combinedRadius = player.radius + e.radius;

            if (dist < combinedRadius) {
                // Collision Physics & Impact
                const angle = Math.atan2(dy, dx);
                const overlap = combinedRadius - dist;

                // Helper: Elastic Bounce
                player.vx += Math.cos(angle) * 10;
                player.vy += Math.sin(angle) * 10;
                player.x += Math.cos(angle) * (overlap * 0.5);
                player.y += Math.sin(angle) * (overlap * 0.5);
                
                e.x -= Math.cos(angle) * (overlap * 0.5 + (player.knockback || 0));
                e.y -= Math.sin(angle) * (overlap * 0.5 + (player.knockback || 0));

                // Visuals
                createExplosion((player.x + e.x)/2, (player.y + e.y)/2, '#fff', 8);
                addShake(8);

                // Calculate Kinetic Damage
                const ramDmg = 20 + (player.maxHp * 0.2) + (Math.hypot(player.vx, player.vy) * 2);

                if (player.dashTime > 0 || isOverdrive) {
                    e.hp -= ramDmg * 5; e.hitFlash = 10;
                    createExplosion(e.x, e.y, '#ff0', 15); sfx.explode();
                } else {
                    player.hp -= (10 + Math.floor(level * 1.2));
                    e.hp -= ramDmg; e.hitFlash = 5;
                    sfx.hit();
                }

                if (e.type === 'kamikaze') { e.hp = 0; player.hp -= 25; createExplosion(player.x, player.y, '#fa0', 20); addShake(15); sfx.explode(); }
                if (player.hp <= 0) callbacks.onGameOver();
            }
        }

        for (let i = gems.length - 1; i >= 0; i--) {
            const g = gems[i];
            if (Math.hypot(player.x - g.x, player.y - g.y) < player.radius + g.radius) {
                g.collect(context);
                gems.splice(i, 1);
            }
        }
    }
}
