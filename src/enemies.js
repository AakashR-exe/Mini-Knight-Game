/**
 * Boss & Enemy Pattern System
 * 1v1 fights tuned for 30-40 seconds of intense, rhythmic combat.
 * Features: Telegraphed attacks, stagger windows, pogo-able attacks, and unique patterns.
 */

class BaseEnemy {
    constructor(x, y, name, title, maxHp, width, height) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.name = name;
        this.title = title;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.width = width;
        this.height = height;
        this.facing = -1; // Face left towards player initially

        // State Machine: 'idle', 'telegraph', 'attack', 'recover', 'stagger', 'dead'
        this.state = 'idle';
        this.stateTimer = 60;
        this.currentAttack = null;

        // Visual flash & feedback
        this.hitFlashTimer = 0;
        this.staggerThresholds = [0.75, 0.4, 0.2];
        this.triggeredStaggerThresholds = new Set();
        this.isStaggered = false;

        // Projectiles / Hazards
        this.projectiles = [];
        this.hazardSpikes = [];

        this.isDead = false;
        this.deathTimer = 0;
        this.gravity = 0.55;
    }

    takeDamage(amount, knockbackDir = 0, isPogo = false) {
        if (this.isDead) return false;

        const previousHp = this.hp;
        this.hp -= amount;
        this.hitFlashTimer = 5;

        // Sound & Particles
        window.soundEngine.playHit(amount >= 25);
        window.particleSystem.addSparkBurst(this.x, this.y - this.height * 0.5, 12, '#f59e0b');
        window.particleSystem.addFloatingText(`${amount}`, this.x, this.y - this.height, amount >= 25 ? '#f59e0b' : '#ffffff', amount >= 25);

        // Knockback (less when not staggered)
        this.vx += knockbackDir * (this.isStaggered ? 4.5 : 1.2);

        // Stagger once when each health milestone is crossed.
        const crossedThreshold = this.staggerThresholds.find(threshold =>
            !this.triggeredStaggerThresholds.has(threshold) &&
            previousHp > this.maxHp * threshold &&
            this.hp > 0 &&
            this.hp <= this.maxHp * threshold
        );
        if (crossedThreshold !== undefined) {
            this.staggerThresholds.forEach(threshold => {
                if (previousHp > this.maxHp * threshold && this.hp > 0 && this.hp <= this.maxHp * threshold) {
                    this.triggeredStaggerThresholds.add(threshold);
                }
            });
            this.triggerStagger();
        }

        // Check Death
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }

        return true;
    }

    triggerStagger() {
        this.state = 'stagger';
        this.isStaggered = true;
        this.stateTimer = 110; // ~1.8 seconds vulnerable window
        this.vx = 0;
        window.soundEngine.playBossHurt();
        window.particleSystem.addShockwave(this.x, this.y, 40, 3, '#fbbf24');
        window.particleSystem.addFloatingText('STAGGERED!', this.x, this.y - this.height - 10, '#fbbf24', true);
    }

    die() {
        this.isDead = true;
        this.state = 'dead';
        this.deathTimer = 80;
        window.soundEngine.playBossDefeat();
        window.particleSystem.addSparkBurst(this.x, this.y - this.height * 0.5, 45, '#fbbf24');
        window.particleSystem.addShockwave(this.x, this.y, 80, 5, '#ffffff');
    }

    startTelegraph(attackName, duration, cueSound = true) {
        this.state = 'telegraph';
        this.currentAttack = attackName;
        this.stateTimer = duration;
        this.vx = 0;

        if (cueSound) {
            window.soundEngine.playTelegraph();
        }
        window.particleSystem.addSparkBurst(this.x, this.y - this.height * 0.8, 8, '#ef4444');
    }

    updateBase(player, arena) {
        if (this.hitFlashTimer > 0) this.hitFlashTimer--;

        if (this.isDead) {
            this.deathTimer--;
            return;
        }

        // Face player when idle or telegraphing
        if (this.state === 'idle' || this.state === 'telegraph') {
            this.facing = player.x < this.x ? -1 : 1;
        }

        // Apply physics
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;

        // Ground check
        if (this.y >= arena.groundY) {
            this.y = arena.groundY;
            this.vy = 0;
        }

        // Arena boundary check
        if (this.x - this.width / 2 < arena.left) {
            this.x = arena.left + this.width / 2;
            this.vx = 0;
        }
        if (this.x + this.width / 2 > arena.right) {
            this.x = arena.right - this.width / 2;
            this.vx = 0;
        }

        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.gravity) p.vy += p.gravity;
            p.life--;

            // Particle trail
            if (Math.random() < 0.3) {
                window.particleSystem.addSparkBurst(p.x, p.y, 1, p.color || '#ef4444');
            }

            // Check hit on player
            if (!player.isDashing && player.invincibleTimer <= 0) {
                const dist = Math.hypot(p.x - player.x, p.y - (player.y - player.height / 2));
                if (dist < (p.radius || 12) + 16) {
                    player.takeDamage(1, p.vx > 0 ? 1 : -1);
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }

            if (p.life <= 0 || p.x < arena.left - 40 || p.x > arena.right + 40 || p.y > arena.groundY + 20) {
                this.projectiles.splice(i, 1);
            }
        }

        // Update Spikes / Ground Hazards
        for (let i = this.hazardSpikes.length - 1; i >= 0; i--) {
            const h = this.hazardSpikes[i];
            h.life--;
            if (h.warningTimer > 0) {
                h.warningTimer--;
                if (h.warningTimer === 0) {
                    h.active = true;
                    window.particleSystem.addSparkBurst(h.x, arena.groundY, 8, '#f59e0b');
                }
            } else if (h.active) {
                // Check player collision
                if (!player.isDashing && player.invincibleTimer <= 0 && player.isGrounded) {
                    if (Math.abs(player.x - h.x) < h.width / 2 + 10) {
                        player.takeDamage(1, 0);
                    }
                }
            }

            if (h.life <= 0) {
                this.hazardSpikes.splice(i, 1);
            }
        }
    }

    drawProjectiles(ctx) {
        ctx.save();
        for (const p of this.projectiles) {
            ctx.fillStyle = p.color || '#ef4444';
            ctx.shadowColor = p.glowColor || '#dc2626';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius || 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Spikes
        for (const h of this.hazardSpikes) {
            if (h.warningTimer > 0) {
                // Warning floor marker
                ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
                ctx.fillRect(h.x - h.width / 2, h.y - 6, h.width, 6);
            } else if (h.active) {
                ctx.fillStyle = h.color || '#f59e0b';
                ctx.shadowColor = '#d97706';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(h.x - h.width / 2, h.y);
                ctx.lineTo(h.x, h.y - h.height);
                ctx.lineTo(h.x + h.width / 2, h.y);
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

// ==========================================
// LEVEL 1: Grimmhorn the Charger (Horned Beetle)
// ==========================================
class BeetleBoss extends BaseEnemy {
    constructor(x, y) {
        super(x, y, 'Grimmhorn', 'The Ancient Charger', 340, 56, 52);
        this.chargeSpeed = 9.5;
        this.attackPatternIndex = 0;
    }

    update(player, arena) {
        this.updateBase(player, arena);
        if (this.isDead) return;

        this.stateTimer--;

        switch (this.state) {
            case 'idle':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    const dist = Math.abs(player.x - this.x);
                    this.attackPatternIndex = (this.attackPatternIndex + 1) % 3;

                    if (this.attackPatternIndex === 0) {
                        this.startTelegraph('charge', 38);
                    } else if (this.attackPatternIndex === 1) {
                        this.startTelegraph('pounce', 30);
                    } else {
                        this.startTelegraph('spit', 25);
                    }
                }
                break;

            case 'telegraph':
                if (this.stateTimer <= 0) {
                    this.state = 'attack';
                    if (this.currentAttack === 'charge') {
                        this.stateTimer = 55;
                        this.vx = this.facing * this.chargeSpeed;
                        window.soundEngine.playBossRoar();
                    } else if (this.currentAttack === 'pounce') {
                        this.stateTimer = 50;
                        this.vy = -13.5;
                        this.vx = (player.x - this.x) * 0.045;
                        window.soundEngine.playJump();
                    } else if (this.currentAttack === 'spit') {
                        this.stateTimer = 35;
                        // Spit 3 thorns
                        for (let i = -1; i <= 1; i++) {
                            this.projectiles.push({
                                x: this.x,
                                y: this.y - 30,
                                vx: this.facing * (5 + Math.abs(i) * 2),
                                vy: -4 + i * 2,
                                gravity: 0.25,
                                radius: 8,
                                color: '#84cc16',
                                glowColor: '#4d7c0f',
                                life: 60
                            });
                        }
                    }
                }
                break;

            case 'attack':
                if (this.currentAttack === 'charge') {
                    // Running charge
                    if (Math.random() < 0.4) {
                        window.particleSystem.addDust(this.x, this.y, this.facing, 2);
                    }

                    // Check hit player
                    if (!player.isDashing && player.invincibleTimer <= 0) {
                        if (Math.abs(player.x - this.x) < 40 && Math.abs(player.y - this.y) < 40) {
                            player.takeDamage(1, this.facing);
                        }
                    }

                    // Bonk wall or finish charge
                    if (this.stateTimer <= 0 || (this.x <= arena.left + 35 && this.facing < 0) || (this.x >= arena.right - 35 && this.facing > 0)) {
                        this.state = 'recover';
                        this.stateTimer = 40;
                        this.vx = 0;
                        window.particleSystem.addShockwave(this.x, this.y, 45, 3, '#94a3b8');
                    }
                } else if (this.currentAttack === 'pounce') {
                    // Falling onto ground
                    if (this.y >= arena.groundY - 2 && this.vy >= 0) {
                        this.state = 'recover';
                        this.stateTimer = 38;
                        this.vx = 0;
                        window.soundEngine.playHit(true);
                        window.particleSystem.addShockwave(this.x, this.y, 75, 4.5, '#84cc16');

                        // Ground stomp hit check
                        if (!player.isDashing && player.invincibleTimer <= 0) {
                            if (Math.abs(player.x - this.x) < 70 && player.isGrounded) {
                                player.takeDamage(1, player.x < this.x ? -1 : 1);
                            }
                        }
                    }
                } else if (this.currentAttack === 'spit') {
                    this.vx *= 0.8;
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = 25;
                    }
                }
                break;

            case 'recover':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = 35; // Brief idle before next choice
                }
                break;

            case 'stagger':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.isStaggered = false;
                    this.state = 'idle';
                    this.stateTimer = 20;
                }
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        this.drawProjectiles(ctx);

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 15;
        } else if (this.isStaggered) {
            ctx.fillStyle = '#334155';
        } else {
            ctx.fillStyle = '#1e293b';
        }

        // Armored Carapace Shell
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 26, 28, 24, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shell highlights / moss patches
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(this.x - 6 * this.facing, this.y - 34, 7, 0, Math.PI * 2);
        ctx.arc(this.x + 8 * this.facing, this.y - 28, 5, 0, Math.PI * 2);
        ctx.fill();

        // Massive Curved Horn
        ctx.fillStyle = '#cbd5e1';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const hornBaseX = this.x + this.facing * 18;
        const hornBaseY = this.y - 24;
        ctx.moveTo(hornBaseX, hornBaseY);
        ctx.quadraticCurveTo(hornBaseX + this.facing * 28, hornBaseY - 25, hornBaseX + this.facing * 34, hornBaseY - 44);
        ctx.quadraticCurveTo(hornBaseX + this.facing * 12, hornBaseY - 30, hornBaseX - this.facing * 2, hornBaseY - 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Telegraph Horn Glow
        if (this.state === 'telegraph') {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 18;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Glowing Eyes
        ctx.fillStyle = (this.state === 'telegraph' || this.state === 'attack') ? '#ef4444' : '#e2e8f0';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x + this.facing * 14, this.y - 20, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Stagger stars
        if (this.isStaggered) {
            ctx.fillStyle = '#fbbf24';
            for (let i = 0; i < 3; i++) {
                const angle = Date.now() * 0.005 + (i * Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(angle) * 22, this.y - 50 + Math.sin(angle) * 8, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

// ==========================================
// LEVEL 2: Kaelen the Mantis Duelist
// ==========================================
class MantisBoss extends BaseEnemy {
    constructor(x, y) {
        super(x, y, 'Kaelen', 'Bladewing Duelist', 430, 42, 60);
        this.attackPatternIndex = 0;
        this.scytheAngle = 0;
    }

    update(player, arena) {
        this.updateBase(player, arena);
        if (this.isDead) return;

        this.scytheAngle += 0.2;
        this.stateTimer--;

        switch (this.state) {
            case 'idle':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.attackPatternIndex = (this.attackPatternIndex + 1) % 3;
                    if (this.attackPatternIndex === 0) {
                        this.startTelegraph('dash_slash', 32);
                    } else if (this.attackPatternIndex === 1) {
                        this.startTelegraph('boomerang', 28);
                    } else {
                        this.startTelegraph('sky_dive', 26);
                    }
                }
                break;

            case 'telegraph':
                if (this.stateTimer <= 0) {
                    this.state = 'attack';
                    if (this.currentAttack === 'dash_slash') {
                        this.stateTimer = 22;
                        this.vx = this.facing * 14.5;
                        window.soundEngine.playSlash(2);
                        window.particleSystem.addShadowClone(this);
                    } else if (this.currentAttack === 'boomerang') {
                        this.stateTimer = 40;
                        this.vx = 0;
                        window.soundEngine.playSlash(1);
                        // Launch boomerang scythe
                        this.projectiles.push({
                            x: this.x + this.facing * 20,
                            y: this.y - 30,
                            vx: this.facing * 10,
                            vy: 0,
                            radius: 14,
                            life: 75,
                            isBoomerang: true,
                            initialX: this.x,
                            color: '#38bdf8',
                            glowColor: '#0284c7'
                        });
                    } else if (this.currentAttack === 'sky_dive') {
                        // Teleport directly above player
                        this.x = player.x;
                        this.y = arena.groundY - 240;
                        this.vy = 18; // Plunge fast
                        this.vx = 0;
                        this.stateTimer = 40;
                        window.soundEngine.playTelegraph();
                        window.particleSystem.addShadowClone(this);
                    }
                }
                break;

            case 'attack':
                if (this.currentAttack === 'dash_slash') {
                    if (Math.random() < 0.5) window.particleSystem.addShadowClone(this);
                    if (!player.isDashing && player.invincibleTimer <= 0) {
                        if (Math.abs(player.x - this.x) < 45 && Math.abs(player.y - this.y) < 45) {
                            player.takeDamage(1, this.facing);
                        }
                    }
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = 28;
                        this.vx = 0;
                    }
                } else if (this.currentAttack === 'boomerang') {
                    // Update boomerangs returning
                    for (const p of this.projectiles) {
                        if (p.isBoomerang && p.life < 45) {
                            p.vx -= this.facing * 0.7; // Turn back
                        }
                    }
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = 22;
                    }
                } else if (this.currentAttack === 'sky_dive') {
                    if (this.y >= arena.groundY - 5) {
                        this.state = 'recover';
                        this.stateTimer = 34;
                        this.vy = 0;
                        window.soundEngine.playHit(true);
                        window.particleSystem.addShockwave(this.x, this.y, 80, 5, '#38bdf8');
                        if (!player.isDashing && player.invincibleTimer <= 0) {
                            if (Math.abs(player.x - this.x) < 70) {
                                player.takeDamage(1, player.x < this.x ? -1 : 1);
                            }
                        }
                    }
                }
                break;

            case 'recover':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = 28;
                }
                break;

            case 'stagger':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.isStaggered = false;
                    this.state = 'idle';
                    this.stateTimer = 18;
                }
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        this.drawProjectiles(ctx);

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else if (this.isStaggered) {
            ctx.fillStyle = '#475569';
        } else {
            ctx.fillStyle = '#0f172a';
        }

        // Slender Mantis Torso
        ctx.beginPath();
        ctx.roundRect(this.x - 10, this.y - 54, 20, 50, 6);
        ctx.fill();

        // Sleek Mantis Helmet / Mask
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 56, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Antennas
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y - 66);
        ctx.lineTo(this.x - 16, this.y - 82);
        ctx.moveTo(this.x + 5, this.y - 66);
        ctx.lineTo(this.x + 16, this.y - 82);
        ctx.stroke();

        // Glowing Blue/Red Eyes
        ctx.fillStyle = (this.state === 'telegraph' || this.state === 'attack') ? '#ef4444' : '#38bdf8';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x + this.facing * 5, this.y - 57, 3, 0, Math.PI * 2);
        ctx.fill();

        // Twin Curved Scythe Arms
        ctx.strokeStyle = '#bae6fd';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        const armStartX = this.x + this.facing * 8;
        const armStartY = this.y - 42;
        ctx.moveTo(armStartX, armStartY);
        ctx.quadraticCurveTo(armStartX + this.facing * 28, armStartY - 10, armStartX + this.facing * 35, armStartY + 25);
        ctx.stroke();

        if (this.isStaggered) {
            ctx.fillStyle = '#fbbf24';
            for (let i = 0; i < 3; i++) {
                const angle = Date.now() * 0.005 + (i * Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(angle) * 20, this.y - 65 + Math.sin(angle) * 7, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

// ==========================================
// LEVEL 3: Lord Malakar the Soul Weaver (Sorcerer)
// ==========================================
class SorcererBoss extends BaseEnemy {
    constructor(x, y) {
        super(x, y, 'Lord Malakar', 'Corrupted Soul Weaver', 490, 44, 58);
        this.hoverOffset = 0;
        this.attackPatternIndex = 0;
    }

    update(player, arena) {
        this.updateBase(player, arena);
        if (this.isDead) return;

        // Hover slightly above ground
        this.hoverOffset = Math.sin(Date.now() * 0.005) * 8;
        this.stateTimer--;

        switch (this.state) {
            case 'idle':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.attackPatternIndex = (this.attackPatternIndex + 1) % 3;
                    if (this.attackPatternIndex === 0) {
                        this.startTelegraph('homing_orbs', 35);
                    } else if (this.attackPatternIndex === 1) {
                        this.startTelegraph('void_pillars', 38);
                    } else {
                        this.startTelegraph('teleport_burst', 26);
                    }
                }
                break;

            case 'telegraph':
                if (this.currentAttack === 'void_pillars' && this.stateTimer === 25) {
                    // Spawn floor warning indicators under player and sides
                    const positions = [player.x - 120, player.x, player.x + 120];
                    for (const posX of positions) {
                        if (posX > arena.left + 40 && posX < arena.right - 40) {
                            this.hazardSpikes.push({
                                x: posX,
                                y: arena.groundY,
                                width: 38,
                                height: 160,
                                warningTimer: 25,
                                active: false,
                                life: 48,
                                color: '#a855f7'
                            });
                        }
                    }
                }

                if (this.stateTimer <= 0) {
                    this.state = 'attack';
                    if (this.currentAttack === 'homing_orbs') {
                        this.stateTimer = 55;
                        window.soundEngine.playSpell();
                        // 3 homing soul orbs
                        for (let i = 0; i < 3; i++) {
                            const angle = (this.facing > 0 ? 0 : Math.PI) + (i - 1) * 0.4;
                            this.projectiles.push({
                                x: this.x,
                                y: this.y - 40,
                                vx: Math.cos(angle) * 5.5,
                                vy: Math.sin(angle) * 5.5,
                                radius: 10,
                                isHoming: true,
                                life: 80,
                                color: '#c084fc',
                                glowColor: '#9333ea'
                            });
                        }
                    } else if (this.currentAttack === 'void_pillars') {
                        this.stateTimer = 35;
                        window.soundEngine.playHit(true);
                    } else if (this.currentAttack === 'teleport_burst') {
                        this.stateTimer = 25;
                        // Teleport to opposite side of arena
                        const targetX = player.x < (arena.left + arena.right) / 2 ? arena.right - 100 : arena.left + 100;
                        window.particleSystem.addSparkBurst(this.x, this.y - 30, 20, '#a855f7');
                        this.x = targetX;
                        window.soundEngine.playDash();
                        window.particleSystem.addSparkBurst(this.x, this.y - 30, 25, '#c084fc');
                        window.particleSystem.addShockwave(this.x, this.y, 60, 4, '#c084fc');
                    }
                }
                break;

            case 'attack':
                // Homing tracking
                for (const p of this.projectiles) {
                    if (p.isHoming && p.life > 20) {
                        const targetAngle = Math.atan2((player.y - player.height / 2) - p.y, player.x - p.x);
                        p.vx += Math.cos(targetAngle) * 0.35;
                        p.vy += Math.sin(targetAngle) * 0.35;
                        // Clamp speed
                        const spd = Math.hypot(p.vx, p.vy);
                        if (spd > 7.5) {
                            p.vx = (p.vx / spd) * 7.5;
                            p.vy = (p.vy / spd) * 7.5;
                        }
                    }
                }

                if (this.stateTimer <= 0) {
                    this.state = 'recover';
                    this.stateTimer = 30;
                }
                break;

            case 'recover':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = 30;
                }
                break;

            case 'stagger':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.isStaggered = false;
                    this.state = 'idle';
                    this.stateTimer = 20;
                }
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        this.drawProjectiles(ctx);

        const currentY = this.y + this.hoverOffset;

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else if (this.isStaggered) {
            ctx.fillStyle = '#4c1d95';
        } else {
            ctx.fillStyle = '#1e1b4b';
        }

        // Billowing Sorcerer Robe
        ctx.beginPath();
        ctx.moveTo(this.x - 18, currentY);
        ctx.lineTo(this.x - 12, currentY - 50);
        ctx.lineTo(this.x + 12, currentY - 50);
        ctx.lineTo(this.x + 18, currentY);
        ctx.closePath();
        ctx.fill();

        // Crown / Head
        ctx.fillStyle = '#e9d5ff';
        ctx.beginPath();
        ctx.arc(this.x, currentY - 54, 13, 0, Math.PI * 2);
        ctx.fill();

        // Violet Void Horns / Crown
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.moveTo(this.x - 8, currentY - 62);
        ctx.lineTo(this.x - 14, currentY - 78);
        ctx.lineTo(this.x - 3, currentY - 65);
        ctx.lineTo(this.x + 3, currentY - 65);
        ctx.lineTo(this.x + 14, currentY - 78);
        ctx.lineTo(this.x + 8, currentY - 62);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = (this.state === 'telegraph' || this.state === 'attack') ? '#ef4444' : '#f472b6';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(this.x + this.facing * 4, currentY - 54, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Floating Void Orb in hand
        ctx.fillStyle = '#c084fc';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(this.x + this.facing * 24, currentY - 34 + Math.sin(Date.now() * 0.008) * 5, 8, 0, Math.PI * 2);
        ctx.fill();

        if (this.isStaggered) {
            ctx.fillStyle = '#fbbf24';
            for (let i = 0; i < 3; i++) {
                const angle = Date.now() * 0.005 + (i * Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(angle) * 20, currentY - 68 + Math.sin(angle) * 7, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

// ==========================================
// LEVEL 4: Titan Goliath (Crystalline Golem)
// ==========================================
class GolemBoss extends BaseEnemy {
    constructor(x, y) {
        super(x, y, 'Titan Goliath', 'Runeplate Juggernaut', 560, 68, 70);
        this.attackPatternIndex = 0;
        this.shieldActive = false;
    }

    takeDamage(amount, knockbackDir = 0, isPogo = false) {
        // Shield blocks frontal attacks unless player pogos or hits from behind!
        if (this.shieldActive && !isPogo) {
            const isFrontal = (this.facing < 0 && knockbackDir > 0) || (this.facing > 0 && knockbackDir < 0);
            if (isFrontal) {
                window.soundEngine.playPogo(); // Clang metallic ding
                window.particleSystem.addSparkBurst(this.x + this.facing * 20, this.y - 35, 10, '#38bdf8');
                window.particleSystem.addFloatingText('BLOCKED!', this.x, this.y - this.height, '#38bdf8', false);
                return false;
            }
        }
        return super.takeDamage(amount, knockbackDir, isPogo);
    }

    update(player, arena) {
        this.updateBase(player, arena);
        if (this.isDead) return;

        this.stateTimer--;

        switch (this.state) {
            case 'idle':
                this.vx *= 0.8;
                this.shieldActive = false;
                if (this.stateTimer <= 0) {
                    this.attackPatternIndex = (this.attackPatternIndex + 1) % 3;
                    if (this.attackPatternIndex === 0) {
                        this.startTelegraph('shield_slam', 36);
                    } else if (this.attackPatternIndex === 1) {
                        this.startTelegraph('crystal_spikes', 34);
                    } else {
                        this.startTelegraph('boulder_throw', 30);
                    }
                }
                break;

            case 'telegraph':
                if (this.currentAttack === 'shield_slam') {
                    this.shieldActive = true;
                }
                if (this.stateTimer <= 0) {
                    this.state = 'attack';
                    if (this.currentAttack === 'shield_slam') {
                        this.stateTimer = 45;
                        this.vx = this.facing * 6;
                        window.soundEngine.playBossRoar();
                    } else if (this.currentAttack === 'crystal_spikes') {
                        this.stateTimer = 50;
                        window.soundEngine.playHit(true);
                        // Erupt sequence of ground spikes
                        for (let i = 1; i <= 5; i++) {
                            const spikeX = this.x + this.facing * (i * 60);
                            if (spikeX > arena.left + 20 && spikeX < arena.right - 20) {
                                this.hazardSpikes.push({
                                    x: spikeX,
                                    y: arena.groundY,
                                    width: 32,
                                    height: 48,
                                    warningTimer: i * 8,
                                    active: false,
                                    life: i * 8 + 25,
                                    color: '#06b6d4'
                                });
                            }
                        }
                    } else if (this.currentAttack === 'boulder_throw') {
                        this.stateTimer = 35;
                        window.soundEngine.playHit(false);
                        this.projectiles.push({
                            x: this.x + this.facing * 20,
                            y: this.y - 50,
                            vx: this.facing * 8.5,
                            vy: -5,
                            gravity: 0.35,
                            radius: 18,
                            color: '#64748b',
                            glowColor: '#06b6d4',
                            life: 60
                        });
                    }
                }
                break;

            case 'attack':
                if (this.currentAttack === 'shield_slam') {
                    if (!player.isDashing && player.invincibleTimer <= 0) {
                        if (Math.abs(player.x - this.x) < 55 && Math.abs(player.y - this.y) < 50) {
                            player.takeDamage(1, this.facing);
                        }
                    }
                    if (this.stateTimer <= 0) {
                        this.shieldActive = false;
                        this.state = 'recover';
                        this.stateTimer = 35;
                        this.vx = 0;
                    }
                } else if (this.currentAttack === 'crystal_spikes' || this.currentAttack === 'boulder_throw') {
                    this.vx *= 0.8;
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = 30;
                    }
                }
                break;

            case 'recover':
                this.vx *= 0.8;
                this.shieldActive = false;
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = 30;
                }
                break;

            case 'stagger':
                this.shieldActive = false;
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.isStaggered = false;
                    this.state = 'idle';
                    this.stateTimer = 20;
                }
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        this.drawProjectiles(ctx);

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else if (this.isStaggered) {
            ctx.fillStyle = '#334155';
        } else {
            ctx.fillStyle = '#1e293b';
        }

        // Heavy Stone Torso
        ctx.beginPath();
        ctx.roundRect(this.x - 28, this.y - 66, 56, 62, 10);
        ctx.fill();

        // Glowing Rune Heart Core
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 40, 10, 0, Math.PI * 2);
        ctx.fill();

        // Heavy Iron Mask
        ctx.fillStyle = '#475569';
        ctx.fillRect(this.x - 18, this.y - 74, 36, 16);

        // Glowing Golem Eye Slit
        ctx.fillStyle = (this.state === 'telegraph' || this.state === 'attack') ? '#ef4444' : '#22d3ee';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.fillRect(this.x - 12 + this.facing * 4, this.y - 69, 14, 4);

        // Shield plate when guarding
        if (this.shieldActive) {
            ctx.fillStyle = '#0891b2';
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#22d3ee';
            ctx.shadowBlur = 12;
            const shieldX = this.x + this.facing * 28;
            ctx.beginPath();
            ctx.roundRect(shieldX - 6, this.y - 68, 12, 64, 4);
            ctx.fill();
            ctx.stroke();
        }

        if (this.isStaggered) {
            ctx.fillStyle = '#fbbf24';
            for (let i = 0; i < 3; i++) {
                const angle = Date.now() * 0.005 + (i * Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(angle) * 28, this.y - 78 + Math.sin(angle) * 8, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

// ==========================================
// LEVEL 5: The Hollow Nemesis (Void Shade Doppelgänger)
// ==========================================
class HollowNemesisBoss extends BaseEnemy {
    constructor(x, y) {
        super(x, y, 'The Void Nemesis', 'Vessel of Pure Void', 650, 36, 54);
        this.attackPatternIndex = 0;
        this.isEnraged = false;
    }

    takeDamage(amount, knockbackDir = 0, isPogo = false) {
        const res = super.takeDamage(amount, knockbackDir, isPogo);
        // Phase 2 Enrage at 50% HP
        if (this.hp <= this.maxHp * 0.5 && !this.isEnraged) {
            this.isEnraged = true;
            window.soundEngine.playBossRoar();
            window.particleSystem.addShockwave(this.x, this.y, 100, 6, '#ef4444');
            window.particleSystem.addFloatingText('VOID OVERDRIVE!', this.x, this.y - this.height - 15, '#ef4444', true);
        }
        return res;
    }

    update(player, arena) {
        this.updateBase(player, arena);
        if (this.isDead) return;

        this.stateTimer--;

        // Dark aura emission
        if (this.isEnraged && Math.random() < 0.4) {
            window.particleSystem.addSparkBurst(this.x + (Math.random() - 0.5) * 20, this.y - 25, 1, '#ef4444');
        }

        switch (this.state) {
            case 'idle':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.attackPatternIndex = (this.attackPatternIndex + 1) % 4;
                    const speedMultiplier = this.isEnraged ? 0.75 : 1.0;

                    if (this.attackPatternIndex === 0) {
                        this.startTelegraph('shadow_dash', Math.floor(28 * speedMultiplier));
                    } else if (this.attackPatternIndex === 1) {
                        this.startTelegraph('void_pogo', Math.floor(25 * speedMultiplier));
                    } else if (this.attackPatternIndex === 2) {
                        this.startTelegraph('soul_barrage', Math.floor(32 * speedMultiplier));
                    } else {
                        this.startTelegraph('shadow_combo', Math.floor(24 * speedMultiplier));
                    }
                }
                break;

            case 'telegraph':
                if (this.stateTimer <= 0) {
                    this.state = 'attack';
                    if (this.currentAttack === 'shadow_dash') {
                        this.stateTimer = 20;
                        this.vx = this.facing * 16;
                        window.soundEngine.playDash();
                        window.particleSystem.addShadowClone(this);
                    } else if (this.currentAttack === 'void_pogo') {
                        this.stateTimer = 45;
                        this.x = player.x;
                        this.y = arena.groundY - 220;
                        this.vy = 17;
                        window.soundEngine.playJump();
                    } else if (this.currentAttack === 'soul_barrage') {
                        this.stateTimer = 40;
                        window.soundEngine.playSpell();
                        // 5 spiral void daggers
                        for (let i = -2; i <= 2; i++) {
                            const angle = (this.facing > 0 ? 0 : Math.PI) + i * 0.28;
                            this.projectiles.push({
                                x: this.x,
                                y: this.y - 30,
                                vx: Math.cos(angle) * 9,
                                vy: Math.sin(angle) * 9,
                                radius: 9,
                                life: 60,
                                color: '#f43f5e',
                                glowColor: '#9f1239'
                            });
                        }
                    } else if (this.currentAttack === 'shadow_combo') {
                        this.stateTimer = 35;
                        this.vx = this.facing * 7;
                        window.soundEngine.playSlash(0);
                    }
                }
                break;

            case 'attack':
                if (this.currentAttack === 'shadow_dash') {
                    if (Math.random() < 0.6) window.particleSystem.addShadowClone(this);
                    if (!player.isDashing && player.invincibleTimer <= 0) {
                        if (Math.abs(player.x - this.x) < 45 && Math.abs(player.y - this.y) < 45) {
                            player.takeDamage(1, this.facing);
                        }
                    }
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = this.isEnraged ? 18 : 26;
                        this.vx = 0;
                    }
                } else if (this.currentAttack === 'void_pogo') {
                    if (this.y >= arena.groundY - 5) {
                        this.state = 'recover';
                        this.stateTimer = this.isEnraged ? 20 : 30;
                        this.vy = 0;
                        window.soundEngine.playHit(true);
                        window.particleSystem.addShockwave(this.x, this.y, 85, 5, '#ef4444');
                        if (!player.isDashing && player.invincibleTimer <= 0) {
                            if (Math.abs(player.x - this.x) < 75) {
                                player.takeDamage(1, player.x < this.x ? -1 : 1);
                            }
                        }
                    }
                } else if (this.currentAttack === 'soul_barrage' || this.currentAttack === 'shadow_combo') {
                    if (this.currentAttack === 'shadow_combo' && !player.isDashing && player.invincibleTimer <= 0) {
                        if (Math.abs(player.x - this.x) < 40) {
                            player.takeDamage(1, this.facing);
                        }
                    }
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = this.isEnraged ? 16 : 24;
                        this.vx = 0;
                    }
                }
                break;

            case 'recover':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = this.isEnraged ? 16 : 24;
                }
                break;

            case 'stagger':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.isStaggered = false;
                    this.state = 'idle';
                    this.stateTimer = 16;
                }
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        this.drawProjectiles(ctx);

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = '#020617';
        }

        // Dark Cloak
        ctx.beginPath();
        ctx.moveTo(this.x - 14, this.y);
        ctx.lineTo(this.x - 10, this.y - 44);
        ctx.lineTo(this.x + 10, this.y - 44);
        ctx.lineTo(this.x + 14, this.y);
        ctx.closePath();
        ctx.fill();

        // Dark Vessel Mask
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = this.isEnraged ? '#ef4444' : '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 46, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Jagged Void Horns
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.moveTo(this.x - 6, this.y - 56);
        ctx.lineTo(this.x - 16, this.y - 74);
        ctx.lineTo(this.x - 4, this.y - 62);
        ctx.moveTo(this.x + 4, this.y - 62);
        ctx.lineTo(this.x + 16, this.y - 74);
        ctx.lineTo(this.x + 6, this.y - 56);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Piercing Crimson / Amber Eyes
        ctx.fillStyle = this.isEnraged ? '#ef4444' : '#fbbf24';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(this.x + this.facing * 4, this.y - 47, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Luminous Dark Blade
        ctx.strokeStyle = this.isEnraged ? '#ef4444' : '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + this.facing * 10, this.y - 25);
        ctx.lineTo(this.x + this.facing * 34, this.y - 32);
        ctx.stroke();

        if (this.isStaggered) {
            ctx.fillStyle = '#fbbf24';
            for (let i = 0; i < 3; i++) {
                const angle = Date.now() * 0.005 + (i * Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(angle) * 18, this.y - 60 + Math.sin(angle) * 6, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

// ==========================================
// LEVEL 6: Hive Queen Vespira (The Stinger Matron)
// ==========================================
class HiveQueenBoss extends BaseEnemy {
    constructor(x, y) {
        super(x, y, 'Queen Vespira', 'The Stinger Matron', 720, 48, 62);
        this.wingFlap = 0;
        this.attackPatternIndex = 0;
    }

    update(player, arena) {
        this.updateBase(player, arena);
        if (this.isDead) return;

        this.wingFlap += 0.4;
        this.stateTimer--;

        switch (this.state) {
            case 'idle':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.attackPatternIndex = (this.attackPatternIndex + 1) % 3;
                    if (this.attackPatternIndex === 0) {
                        this.startTelegraph('needle_tether', 30);
                    } else if (this.attackPatternIndex === 1) {
                        this.startTelegraph('amber_bombs', 32);
                    } else {
                        this.startTelegraph('stinger_lunge', 26);
                    }
                }
                break;

            case 'telegraph':
                if (this.stateTimer <= 0) {
                    this.state = 'attack';
                    if (this.currentAttack === 'needle_tether') {
                        this.stateTimer = 44;
                        window.soundEngine.playSlash(1);
                        // Needle projectile that pierces forward and returns
                        this.projectiles.push({
                            x: this.x + this.facing * 20,
                            y: this.y - 32,
                            vx: this.facing * 12,
                            vy: 0,
                            radius: 12,
                            life: 60,
                            isTether: true,
                            color: '#facc15',
                            glowColor: '#eab308'
                        });
                    } else if (this.currentAttack === 'amber_bombs') {
                        this.stateTimer = 48;
                        window.soundEngine.playSpell();
                        // Drop 3 amber bombs
                        for (let i = -1; i <= 1; i++) {
                            this.projectiles.push({
                                x: this.x + i * 40,
                                y: this.y - 50,
                                vx: this.facing * (3 + i * 2),
                                vy: -4,
                                gravity: 0.35,
                                radius: 10,
                                color: '#f59e0b',
                                glowColor: '#d97706',
                                life: 60
                            });
                        }
                    } else if (this.currentAttack === 'stinger_lunge') {
                        this.stateTimer = 24;
                        this.vx = this.facing * 15;
                        this.vy = -3;
                        window.soundEngine.playDash();
                    }
                }
                break;

            case 'attack':
                if (this.currentAttack === 'needle_tether') {
                    for (const p of this.projectiles) {
                        if (p.isTether && p.life < 30) {
                            p.vx -= this.facing * 1.1; // Pull back
                        }
                    }
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = 24;
                    }
                } else if (this.currentAttack === 'amber_bombs') {
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = 26;
                    }
                } else if (this.currentAttack === 'stinger_lunge') {
                    if (Math.random() < 0.4) window.particleSystem.addShadowClone(this);
                    if (!player.isDashing && player.invincibleTimer <= 0) {
                        if (Math.abs(player.x - this.x) < 45 && Math.abs(player.y - this.y) < 45) {
                            player.takeDamage(1, this.facing);
                        }
                    }
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = 26;
                        this.vx = 0;
                    }
                }
                break;

            case 'recover':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = 24;
                }
                break;

            case 'stagger':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.isStaggered = false;
                    this.state = 'idle';
                    this.stateTimer = 18;
                }
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        this.drawProjectiles(ctx);

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else if (this.isStaggered) {
            ctx.fillStyle = '#78350f';
        } else {
            ctx.fillStyle = '#451a03';
        }

        // Golden striped abdomen
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 28, 22, 28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Amber stripes
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(this.x - 18, this.y - 36, 36, 6);
        ctx.fillRect(this.x - 16, this.y - 22, 32, 6);

        // Translucent insect wings
        const wingSpread = Math.sin(this.wingFlap) * 14;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(this.x - 12, this.y - 48, 8, 20 + wingSpread, -0.4, 0, Math.PI * 2);
        ctx.ellipse(this.x + 12, this.y - 48, 8, 20 + wingSpread, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Mask & Crown
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 58, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Amber Eyes
        ctx.fillStyle = (this.state === 'telegraph' || this.state === 'attack') ? '#ef4444' : '#eab308';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x + this.facing * 5, this.y - 58, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Silver Stinger Needle
        ctx.strokeStyle = '#f8fafc';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(this.x + this.facing * 10, this.y - 30);
        ctx.lineTo(this.x + this.facing * 38, this.y - 30);
        ctx.stroke();

        if (this.isStaggered) {
            ctx.fillStyle = '#fbbf24';
            for (let i = 0; i < 3; i++) {
                const angle = Date.now() * 0.005 + (i * Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(angle) * 20, this.y - 70 + Math.sin(angle) * 6, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

// ==========================================
// LEVEL 7: Troupe Master Ignis (The Scarlet Bat)
// ==========================================
class ScarletTroupeBoss extends BaseEnemy {
    constructor(x, y) {
        super(x, y, 'Troupe Master Ignis', 'The Scarlet Sovereign', 820, 42, 64);
        this.attackPatternIndex = 0;
    }

    update(player, arena) {
        this.updateBase(player, arena);
        if (this.isDead) return;

        this.stateTimer--;

        switch (this.state) {
            case 'idle':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.attackPatternIndex = (this.attackPatternIndex + 1) % 3;
                    if (this.attackPatternIndex === 0) {
                        this.startTelegraph('scarlet_bats', 30);
                    } else if (this.attackPatternIndex === 1) {
                        this.startTelegraph('flame_pillars', 36);
                    } else {
                        this.startTelegraph('dive_dash', 28);
                    }
                }
                break;

            case 'telegraph':
                if (this.currentAttack === 'flame_pillars' && this.stateTimer === 22) {
                    // Spawn 4 creeping flame columns along floor
                    for (let i = 0; i < 4; i++) {
                        const colX = arena.left + 80 + i * 220;
                        this.hazardSpikes.push({
                            x: colX,
                            y: arena.groundY,
                            width: 36,
                            height: 180,
                            warningTimer: 20 + i * 4,
                            active: false,
                            life: 45 + i * 4,
                            color: '#ef4444'
                        });
                    }
                }

                if (this.stateTimer <= 0) {
                    this.state = 'attack';
                    if (this.currentAttack === 'scarlet_bats') {
                        this.stateTimer = 40;
                        window.soundEngine.playSpell();
                        // 3 crimson bats flying forward
                        for (let i = -1; i <= 1; i++) {
                            this.projectiles.push({
                                x: this.x + this.facing * 20,
                                y: this.y - 40 + i * 16,
                                vx: this.facing * 8.5,
                                vy: i * 1.5,
                                radius: 10,
                                color: '#f43f5e',
                                glowColor: '#be123c',
                                life: 65
                            });
                        }
                    } else if (this.currentAttack === 'flame_pillars') {
                        this.stateTimer = 34;
                        window.soundEngine.playHit(true);
                    } else if (this.currentAttack === 'dive_dash') {
                        this.stateTimer = 26;
                        this.x = player.x - this.facing * 120;
                        this.y = arena.groundY - 180;
                        this.vx = this.facing * 15;
                        this.vy = 12;
                        window.soundEngine.playDash();
                    }
                }
                break;

            case 'attack':
                if (this.currentAttack === 'dive_dash') {
                    if (this.y >= arena.groundY - 5) {
                        this.vy = 0;
                        window.particleSystem.addShockwave(this.x, this.y, 65, 4.5, '#ef4444');
                    }
                    if (!player.isDashing && player.invincibleTimer <= 0) {
                        if (Math.abs(player.x - this.x) < 45 && Math.abs(player.y - this.y) < 45) {
                            player.takeDamage(1, this.facing);
                        }
                    }
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = 24;
                        this.vx = 0;
                    }
                } else if (this.currentAttack === 'scarlet_bats' || this.currentAttack === 'flame_pillars') {
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = 22;
                    }
                }
                break;

            case 'recover':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = 22;
                }
                break;

            case 'stagger':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.isStaggered = false;
                    this.state = 'idle';
                    this.stateTimer = 16;
                }
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        this.drawProjectiles(ctx);

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else if (this.isStaggered) {
            ctx.fillStyle = '#881337';
        } else {
            ctx.fillStyle = '#4c0519';
        }

        // Scarlet Dramatic Cloak
        ctx.beginPath();
        ctx.moveTo(this.x - 16, this.y);
        ctx.lineTo(this.x - 12, this.y - 54);
        ctx.lineTo(this.x + 12, this.y - 54);
        ctx.lineTo(this.x + 16, this.y);
        ctx.closePath();
        ctx.fill();

        // White Porcelain Mask
        ctx.fillStyle = '#fff1f2';
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 58, 12, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Piercing Scarlet Eyes
        ctx.fillStyle = '#e11d48';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(this.x + this.facing * 4, this.y - 58, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Curved Horns
        ctx.fillStyle = '#4c0519';
        ctx.beginPath();
        ctx.moveTo(this.x - 6, this.y - 68);
        ctx.lineTo(this.x - 14, this.y - 84);
        ctx.lineTo(this.x - 2, this.y - 72);
        ctx.moveTo(this.x + 2, this.y - 72);
        ctx.lineTo(this.x + 14, this.y - 84);
        ctx.lineTo(this.x + 6, this.y - 68);
        ctx.closePath();
        ctx.fill();

        if (this.isStaggered) {
            ctx.fillStyle = '#fbbf24';
            for (let i = 0; i < 3; i++) {
                const angle = Date.now() * 0.005 + (i * Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(angle) * 18, this.y - 72 + Math.sin(angle) * 6, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

// ==========================================
// LEVEL 8: Mor'gath the Abyssal Wyrm (Void Serpent)
// ==========================================
class VoidWyrmBoss extends BaseEnemy {
    constructor(x, y) {
        super(x, y, "Mor'gath", 'The Abyssal Wyrm', 920, 64, 68);
        this.attackPatternIndex = 0;
    }

    update(player, arena) {
        this.updateBase(player, arena);
        if (this.isDead) return;

        this.stateTimer--;

        switch (this.state) {
            case 'idle':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.attackPatternIndex = (this.attackPatternIndex + 1) % 3;
                    if (this.attackPatternIndex === 0) {
                        this.startTelegraph('void_beam', 38);
                    } else if (this.attackPatternIndex === 1) {
                        this.startTelegraph('tail_quake', 32);
                    } else {
                        this.startTelegraph('shadow_surge', 30);
                    }
                }
                break;

            case 'telegraph':
                if (this.stateTimer <= 0) {
                    this.state = 'attack';
                    if (this.currentAttack === 'void_beam') {
                        this.stateTimer = 46;
                        window.soundEngine.playBossRoar();
                        // Floor-level sweeping beam
                        for (let i = 0; i < 6; i++) {
                            this.projectiles.push({
                                x: this.x + this.facing * (40 + i * 40),
                                y: arena.groundY - 18,
                                vx: this.facing * 7.5,
                                vy: 0,
                                radius: 14,
                                color: '#06b6d4',
                                glowColor: '#0891b2',
                                life: 55
                            });
                        }
                    } else if (this.currentAttack === 'tail_quake') {
                        this.stateTimer = 42;
                        window.soundEngine.playHit(true);
                        window.particleSystem.addShockwave(this.x, this.y, 90, 5, '#06b6d4');
                        // Rolling ground rocks
                        for (let dir of [-1, 1]) {
                            this.projectiles.push({
                                x: this.x,
                                y: arena.groundY - 12,
                                vx: dir * 6.5,
                                vy: -2,
                                gravity: 0.25,
                                radius: 12,
                                color: '#164e63',
                                glowColor: '#0891b2',
                                life: 55
                            });
                        }
                    } else if (this.currentAttack === 'shadow_surge') {
                        this.stateTimer = 40;
                        window.soundEngine.playSpell();
                        // 4 shadow geysers
                        for (let i = 1; i <= 4; i++) {
                            const gx = arena.left + i * 180;
                            this.hazardSpikes.push({
                                x: gx,
                                y: arena.groundY,
                                width: 34,
                                height: 160,
                                warningTimer: i * 6,
                                active: false,
                                life: i * 6 + 28,
                                color: '#0891b2'
                            });
                        }
                    }
                }
                break;

            case 'attack':
                if (this.stateTimer <= 0) {
                    this.state = 'recover';
                    this.stateTimer = 26;
                }
                break;

            case 'recover':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = 24;
                }
                break;

            case 'stagger':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.isStaggered = false;
                    this.state = 'idle';
                    this.stateTimer = 18;
                }
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        this.drawProjectiles(ctx);

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else if (this.isStaggered) {
            ctx.fillStyle = '#083344';
        } else {
            ctx.fillStyle = '#020617';
        }

        // Heavy serpentine skull
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 34, 30, 26, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mandibles / Fangs
        ctx.fillStyle = '#cffafe';
        ctx.beginPath();
        ctx.moveTo(this.x + this.facing * 20, this.y - 20);
        ctx.lineTo(this.x + this.facing * 34, this.y - 12);
        ctx.lineTo(this.x + this.facing * 18, this.y - 10);
        ctx.fill();

        // Glowing Cyan Eyes
        ctx.fillStyle = (this.state === 'telegraph' || this.state === 'attack') ? '#ef4444' : '#22d3ee';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(this.x + this.facing * 14, this.y - 36, 4, 0, Math.PI * 2);
        ctx.fill();

        // Spined Dorsal Fins
        ctx.fillStyle = '#0891b2';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x - 18 + i * 12, this.y - 50);
            ctx.lineTo(this.x - 12 + i * 12, this.y - 68);
            ctx.lineTo(this.x - 6 + i * 12, this.y - 50);
            ctx.fill();
        }

        if (this.isStaggered) {
            ctx.fillStyle = '#fbbf24';
            for (let i = 0; i < 3; i++) {
                const angle = Date.now() * 0.005 + (i * Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(angle) * 24, this.y - 60 + Math.sin(angle) * 7, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

// ==========================================
// LEVEL 9: Lord Regent Valerius (The Radiant Paladin)
// ==========================================
class PaladinBoss extends BaseEnemy {
    constructor(x, y) {
        super(x, y, 'Regent Valerius', 'Radiant Swordmaster', 1020, 46, 66);
        this.attackPatternIndex = 0;
        this.isParrying = false;
    }

    takeDamage(amount, knockbackDir = 0, isPogo = false) {
        // If hit during parry stance, counter immediately!
        if (this.isParrying && !isPogo) {
            this.isParrying = false;
            window.soundEngine.playPogo();
            window.soundEngine.playSlash(2);
            window.particleSystem.addSparkBurst(this.x, this.y - 30, 20, '#fbbf24');
            window.particleSystem.addFloatingText('PARRIED!', this.x, this.y - this.height, '#fbbf24', true);
            this.vx = this.facing * 12;
            return false;
        }
        return super.takeDamage(amount, knockbackDir, isPogo);
    }

    update(player, arena) {
        this.updateBase(player, arena);
        if (this.isDead) return;

        this.stateTimer--;

        switch (this.state) {
            case 'idle':
                this.vx *= 0.8;
                this.isParrying = false;
                if (this.stateTimer <= 0) {
                    this.attackPatternIndex = (this.attackPatternIndex + 1) % 3;
                    if (this.attackPatternIndex === 0) {
                        this.startTelegraph('sun_combo', 30);
                    } else if (this.attackPatternIndex === 1) {
                        this.startTelegraph('floating_swords', 34);
                    } else {
                        this.startTelegraph('parry_guard', 24);
                    }
                }
                break;

            case 'telegraph':
                if (this.stateTimer <= 0) {
                    this.state = 'attack';
                    if (this.currentAttack === 'sun_combo') {
                        this.stateTimer = 34;
                        this.vx = this.facing * 11;
                        window.soundEngine.playSlash(2);
                        window.particleSystem.addShadowClone(this);
                    } else if (this.currentAttack === 'floating_swords') {
                        this.stateTimer = 45;
                        window.soundEngine.playSpell();
                        // 4 golden swords launching in succession
                        for (let i = 0; i < 4; i++) {
                            const angle = (this.facing > 0 ? 0 : Math.PI) + (i - 1.5) * 0.22;
                            this.projectiles.push({
                                x: this.x + this.facing * 20,
                                y: this.y - 45 + i * 8,
                                vx: Math.cos(angle) * 10,
                                vy: Math.sin(angle) * 10,
                                radius: 10,
                                color: '#fef08a',
                                glowColor: '#facc15',
                                life: 60
                            });
                        }
                    } else if (this.currentAttack === 'parry_guard') {
                        this.stateTimer = 50;
                        this.isParrying = true;
                        window.soundEngine.playTelegraph();
                    }
                }
                break;

            case 'attack':
                if (this.currentAttack === 'sun_combo') {
                    if (!player.isDashing && player.invincibleTimer <= 0) {
                        if (Math.abs(player.x - this.x) < 50 && Math.abs(player.y - this.y) < 45) {
                            player.takeDamage(1, this.facing);
                        }
                    }
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = 24;
                        this.vx = 0;
                    }
                } else if (this.currentAttack === 'parry_guard') {
                    if (this.stateTimer <= 0) {
                        this.isParrying = false;
                        this.state = 'recover';
                        this.stateTimer = 20;
                    }
                } else if (this.currentAttack === 'floating_swords') {
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = 22;
                    }
                }
                break;

            case 'recover':
                this.vx *= 0.8;
                this.isParrying = false;
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = 22;
                }
                break;

            case 'stagger':
                this.vx *= 0.8;
                this.isParrying = false;
                if (this.stateTimer <= 0) {
                    this.isStaggered = false;
                    this.state = 'idle';
                    this.stateTimer = 16;
                }
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        this.drawProjectiles(ctx);

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else if (this.isStaggered) {
            ctx.fillStyle = '#854d0e';
        } else {
            ctx.fillStyle = '#1e293b';
        }

        // Golden Armor Torso
        ctx.beginPath();
        ctx.roundRect(this.x - 14, this.y - 54, 28, 50, 6);
        ctx.fill();

        // Gold Trim / Filigree
        ctx.fillStyle = '#facc15';
        ctx.fillRect(this.x - 10, this.y - 48, 20, 6);

        // Great Helmet
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 58, 13, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Royal Crest / Visor
        ctx.fillStyle = this.isParrying ? '#38bdf8' : ((this.state === 'telegraph' || this.state === 'attack') ? '#ef4444' : '#eab308');
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x - 8 + this.facing * 3, this.y - 59, 12, 3.5);

        // Radiant Broadsword
        ctx.strokeStyle = '#fef08a';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 4;
        ctx.beginPath();
        const swordBaseX = this.x + this.facing * 10;
        const swordBaseY = this.y - 30;
        ctx.moveTo(swordBaseX, swordBaseY);
        ctx.lineTo(swordBaseX + this.facing * 36, swordBaseY - 22);
        ctx.stroke();

        // Golden Aura when parrying
        if (this.isParrying) {
            ctx.strokeStyle = '#38bdf8';
            ctx.shadowColor = '#0284c7';
            ctx.shadowBlur = 18;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y - 35, 34, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.isStaggered) {
            ctx.fillStyle = '#fbbf24';
            for (let i = 0; i < 3; i++) {
                const angle = Date.now() * 0.005 + (i * Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(angle) * 20, this.y - 72 + Math.sin(angle) * 6, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

// ==========================================
// LEVEL 10: Dawn Sovereign Lumina (The Solar Seraph)
// ==========================================
class RadianceBoss extends BaseEnemy {
    constructor(x, y) {
        super(x, y, 'Sovereign Lumina', 'Solar Seraph [DIFFICULTY: HELL]', 1180, 52, 70);
        this.wingFlap = 0;
        this.attackPatternIndex = 0;
        this.isAscended = false;
        this.hellRainTimer = 0;
    }

    takeDamage(amount, knockbackDir = 0, isPogo = false) {
        const res = super.takeDamage(amount, knockbackDir, isPogo);
        if (this.hp <= this.maxHp * 0.5 && !this.isAscended) {
            this.isAscended = true;
            window.soundEngine.playBossRoar();
            window.particleSystem.addShockwave(this.x, this.y, 140, 7, '#ef4444');
            window.particleSystem.addFloatingText('ABSOLUTE HELL ASCENDANCE!', this.x, this.y - this.height - 15, '#ef4444', true);
        }
        return res;
    }

    update(player, arena) {
        this.updateBase(player, arena);
        if (this.isDead) return;

        this.wingFlap += 0.35;
        this.stateTimer--;

        // In Hell mode: passive background solar needles in Phase 2
        if (this.isAscended) {
            this.hellRainTimer++;
            if (this.hellRainTimer % 45 === 0) {
                const randomX = arena.left + 50 + Math.random() * (arena.right - arena.left - 100);
                this.projectiles.push({
                    x: randomX,
                    y: 40,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: 10,
                    radius: 7,
                    color: '#ef4444',
                    glowColor: '#dc2626',
                    life: 55
                });
            }

            // Blazing solar embers
            if (Math.random() < 0.6) {
                window.particleSystem.addSparkBurst(this.x + (Math.random() - 0.5) * 35, this.y - 40, 1, '#ef4444');
            }
        }

        switch (this.state) {
            case 'idle':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.attackPatternIndex = (this.attackPatternIndex + 1) % 4;
                    const speedMultiplier = this.isAscended ? 0.55 : 0.75; // Ultra fast in Hell

                    if (this.attackPatternIndex === 0) {
                        this.startTelegraph('needle_rain', Math.floor(26 * speedMultiplier));
                    } else if (this.attackPatternIndex === 1) {
                        this.startTelegraph('solar_orbs', Math.floor(24 * speedMultiplier));
                    } else if (this.attackPatternIndex === 2) {
                        this.startTelegraph('radiant_beam', Math.floor(28 * speedMultiplier));
                    } else {
                        this.startTelegraph('seraph_dive', Math.floor(20 * speedMultiplier));
                    }
                }
                break;

            case 'telegraph':
                if (this.stateTimer <= 0) {
                    this.state = 'attack';
                    if (this.currentAttack === 'needle_rain') {
                        this.stateTimer = 44;
                        window.soundEngine.playSpell();
                        // 7 golden needles raining from ceiling with tight gaps (Bullet Hell!)
                        for (let i = 0; i < 7; i++) {
                            const rainX = arena.left + 60 + i * 135 + (Math.random() - 0.5) * 25;
                            this.projectiles.push({
                                x: rainX,
                                y: 50,
                                vx: 0,
                                vy: 10.5,
                                radius: 8,
                                color: this.isAscended ? '#ef4444' : '#fef08a',
                                glowColor: '#facc15',
                                life: 60
                            });
                        }
                    } else if (this.currentAttack === 'solar_orbs') {
                        this.stateTimer = 42;
                        window.soundEngine.playSpell();
                        // 3 fast homing sun orbs
                        for (let i = -1; i <= 1; i++) {
                            this.projectiles.push({
                                x: this.x + i * 25,
                                y: this.y - 50,
                                vx: this.facing * 7.5,
                                vy: i * 3,
                                radius: 13,
                                isHoming: true,
                                color: '#fbbf24',
                                glowColor: '#ef4444',
                                life: 80
                            });
                        }
                    } else if (this.currentAttack === 'radiant_beam') {
                        this.stateTimer = 38;
                        window.soundEngine.playHit(true);
                        // 4 floor columns sweeping across
                        const spots = [player.x - 120, player.x - 40, player.x + 40, player.x + 120];
                        for (const sx of spots) {
                            if (sx > arena.left + 25 && sx < arena.right - 25) {
                                this.hazardSpikes.push({
                                    x: sx,
                                    y: arena.groundY,
                                    width: 36,
                                    height: 190,
                                    warningTimer: 14,
                                    active: false,
                                    life: 36,
                                    color: this.isAscended ? '#ef4444' : '#facc15'
                                });
                            }
                        }
                    } else if (this.currentAttack === 'seraph_dive') {
                        this.stateTimer = 24;
                        this.vx = this.facing * 18;
                        this.vy = -3;
                        window.soundEngine.playDash();
                    }
                }
                break;

            case 'attack':
                // Homing sun orbs
                for (const p of this.projectiles) {
                    if (p.isHoming && p.life > 15) {
                        const targetAngle = Math.atan2((player.y - player.height / 2) - p.y, player.x - p.x);
                        p.vx += Math.cos(targetAngle) * 0.45;
                        p.vy += Math.sin(targetAngle) * 0.45;
                        const spd = Math.hypot(p.vx, p.vy);
                        if (spd > 8.5) {
                            p.vx = (p.vx / spd) * 8.5;
                            p.vy = (p.vy / spd) * 8.5;
                        }
                    }
                }

                if (this.currentAttack === 'seraph_dive') {
                    if (!player.isDashing && player.invincibleTimer <= 0) {
                        if (Math.abs(player.x - this.x) < 52 && Math.abs(player.y - this.y) < 52) {
                            player.takeDamage(1, this.facing);
                        }
                    }
                    if (this.stateTimer <= 0) {
                        this.state = 'recover';
                        this.stateTimer = this.isAscended ? 12 : 18;
                        this.vx = 0;
                    }
                } else if (this.stateTimer <= 0) {
                    this.state = 'recover';
                    this.stateTimer = this.isAscended ? 12 : 20;
                }
                break;

            case 'recover':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.state = 'idle';
                    this.stateTimer = this.isAscended ? 10 : 16;
                }
                break;

            case 'stagger':
                this.vx *= 0.8;
                if (this.stateTimer <= 0) {
                    this.isStaggered = false;
                    this.state = 'idle';
                    this.stateTimer = 14;
                }
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        this.drawProjectiles(ctx);

        if (this.hitFlashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else if (this.isStaggered) {
            ctx.fillStyle = '#b45309';
        } else {
            ctx.fillStyle = '#451a03';
        }

        // Luminous Moth Wings
        const wingSpan = Math.sin(this.wingFlap) * 16;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.65)';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(this.x - 22, this.y - 45, 16, 32 + wingSpan, -0.4, 0, Math.PI * 2);
        ctx.ellipse(this.x + 22, this.y - 45, 16, 32 + wingSpan, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Robes
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.moveTo(this.x - 16, this.y);
        ctx.lineTo(this.x - 12, this.y - 50);
        ctx.lineTo(this.x + 12, this.y - 50);
        ctx.lineTo(this.x + 16, this.y);
        ctx.closePath();
        ctx.fill();

        // Crown / Head
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 54, 13, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Blinding Solar Halo
        ctx.strokeStyle = '#facc15';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 66, 18, 0, Math.PI * 2);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = (this.state === 'telegraph' || this.state === 'attack') ? '#ef4444' : '#f59e0b';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x + this.facing * 4, this.y - 54, 3.2, 0, Math.PI * 2);
        ctx.fill();

        if (this.isStaggered) {
            ctx.fillStyle = '#fbbf24';
            for (let i = 0; i < 3; i++) {
                const angle = Date.now() * 0.005 + (i * Math.PI * 2 / 3);
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(angle) * 22, this.y - 74 + Math.sin(angle) * 6, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

window.BossFactory = {
    createBoss(level, arena) {
        const spawnX = arena.right - 180;
        const spawnY = arena.groundY;

        switch (level) {
            case 1:
                return new BeetleBoss(spawnX, spawnY);
            case 2:
                return new MantisBoss(spawnX, spawnY);
            case 3:
                return new SorcererBoss(spawnX, spawnY);
            case 4:
                return new GolemBoss(spawnX, spawnY);
            case 5:
                return new HollowNemesisBoss(spawnX, spawnY);
            case 6:
                return new HiveQueenBoss(spawnX, spawnY);
            case 7:
                return new ScarletTroupeBoss(spawnX, spawnY);
            case 8:
                return new VoidWyrmBoss(spawnX, spawnY);
            case 9:
                return new PaladinBoss(spawnX, spawnY);
            case 10:
            default:
                return new RadianceBoss(spawnX, spawnY);
        }
    }
};
