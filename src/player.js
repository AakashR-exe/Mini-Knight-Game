/**
 * Player Controller & Character Renderer
 * Combat: Swordigo-style wide sweep slash combo, purple fireball (mana cost),
 * shadow dash, double jump, pogo bounce, and magic shield.
 */
class Player {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 30;
        this.height = 48;
        this.facing = 1; // 1 = right, -1 = left

        // Stats
        this.maxHealth = 5;
        this.health = 5;

        // Health Potions
        this.maxPotions = 5;
        this.potions = 5;

        // Mana
        this.maxMana = 50;
        this.mana = 50;
        this.manaRegenTimer = 0;      // counts up in frames
        this.manaRegenRate = 180;     // 5 mana every 3 sec (60fps * 3)
        this.manaRegenAmount = 5;
        this.fireballCost = 5;

        // Physics
        this.speed = 5.2;
        this.jumpForce = -12.2;
        this.gravity = 0.58;
        this.isGrounded = false;
        this.hasDoubleJump = true;
        this.canDoubleJump = true;
        this.wallSlide = false;
        this.wallDir = 0;

        // Swordigo-style swing
        this.isAttacking = false;
        this.attackCombo = 0;         // 0 = light, 1 = mid, 2 = heavy
        this.attackTimer = 0;
        this.attackDuration = 16;     // slightly longer for wide sweep feel
        this.comboResetTimer = 0;
        this.attackDirection = 'horizontal';
        this.attackHitbox = null;
        this.hasHitEnemyThisSwing = false;
        // Swordigo sweep: track the animated angle
        this.sweepAngle = 0;

        // Dash
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDuration = 12;
        this.dashCooldown = 0;
        this.dashCooldownMax = 32;
        this.dashSpeed = 13.5;

        // Shield
        this.isShielding = false;
        this.shieldCastTimer = 0;
        this.shieldCastGoal = 180;    // 3 sec @ 60fps
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.shieldDuration = 300;    // 5 sec shield once cast
        this.shieldCooldown = 0;
        this.shieldCooldownMax = 900; // 15 sec @ 60fps

        // Invulnerability
        this.invincibleTimer = 0;
        this.invincibleDuration = 60;
        this.isDead = false;

        // Projectiles (purple fireballs)
        this.projectiles = [];

        // Cloak physics
        this.cloakPoints = [];
        for (let i = 0; i < 5; i++) {
            this.cloakPoints.push({ x: this.x, y: this.y - 20 + i * 8 });
        }
    }

    reset(x, y) {
        this.x = x || this.startX;
        this.y = y || this.startY;
        this.vx = 0;
        this.vy = 0;
        this.facing = 1;
        this.health = this.maxHealth;
        this.potions = this.maxPotions;
        this.mana = this.maxMana;
        this.manaRegenTimer = 0;
        this.isAttacking = false;
        this.attackCombo = 0;
        this.attackTimer = 0;
        this.sweepAngle = 0;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        this.isShielding = false;
        this.shieldCastTimer = 0;
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.shieldCooldown = 0;
        this.invincibleTimer = 0;
        this.isDead = false;
        this.projectiles = [];
    }

    takeDamage(amount = 1, knockbackDir = 0) {
        // Shield blocks all damage
        if (this.shieldActive) {
            window.particleSystem.addShockwave(this.x, this.y - this.height / 2, 40, 3, '#a855f7');
            window.particleSystem.addFloatingText('BLOCKED!', this.x, this.y - this.height, '#a855f7', true);
            return false;
        }
        if (this.invincibleTimer > 0 || this.isDashing || this.isDead) return false;

        this.health -= amount;
        this.invincibleTimer = this.invincibleDuration;
        // Cancel shield casting on hit
        this.isShielding = false;
        this.shieldCastTimer = 0;

        this.vx = knockbackDir * 5.5;
        this.vy = -5.0;

        window.soundEngine.playPlayerHurt();
        window.particleSystem.addSparkBurst(this.x, this.y - this.height / 2, 14, '#ef4444');
        window.particleSystem.addFloatingText(`-${amount}`, this.x, this.y - this.height, '#ef4444', true);

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            window.soundEngine.playBossDefeat();
            window.particleSystem.addSparkBurst(this.x, this.y - this.height / 2, 35, '#ffffff');
            window.particleSystem.addSoulSplatter(this.x, this.y - this.height / 2, 20);
        }
        return true;
    }

    // ── Swordigo-style swing ──────────────────────────────────────────────────
    triggerAttack(direction = 'horizontal') {
        if (this.isAttacking || this.isDashing || this.isShielding || this.isDead) return;

        this.isAttacking = true;
        this.attackDirection = direction;
        this.attackTimer = this.attackDuration;
        this.hasHitEnemyThisSwing = false;

        if (direction === 'horizontal') {
            if (this.comboResetTimer > 0) {
                this.attackCombo = (this.attackCombo + 1) % 3;
            } else {
                this.attackCombo = 0;
            }
            this.comboResetTimer = 32;
        } else {
            this.attackCombo = 0;
        }

        // Initialise sweep angle (Swordigo: starts behind, sweeps forward)
        if (direction === 'horizontal') {
            this.sweepAngle = this.facing > 0 ? -Math.PI * 0.75 : Math.PI * 1.75;
        }

        window.soundEngine.playSlash(this.attackCombo);

        // Combo-3 lunge step
        if (direction === 'horizontal' && this.attackCombo === 2) {
            this.vx += this.facing * 4;
        }
    }

    triggerDash() {
        if (this.isDashing || this.dashCooldown > 0 || this.isDead) return;

        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldown = this.dashCooldownMax;
        this.isAttacking = false;
        this.isShielding = false;
        this.shieldCastTimer = 0;
        this.vy = 0;

        window.soundEngine.playDash();
        window.particleSystem.addShadowClone(this);
        window.particleSystem.addDust(this.x, this.y, this.facing, 6);
    }

    // ── Purple Fireball ───────────────────────────────────────────────────────
    castFireball() {
        if (this.isDead || this.isDashing || this.isShielding) return;
        if (this.mana < this.fireballCost) {
            window.particleSystem.addFloatingText('NO MANA', this.x, this.y - this.height, '#a855f7', false);
            return;
        }

        this.mana -= this.fireballCost;
        window.soundEngine.playSpell();

        const spawnX = this.x + this.facing * 26;
        const spawnY = this.y - this.height * 0.55;

        this.projectiles.push({
            x: spawnX,
            y: spawnY,
            vx: this.facing * 11,
            vy: 0,
            damage: 30,
            life: 50,
            trail: [],
            type: 'fireball'
        });

        // Slight recoil
        this.vx = -this.facing * 2.5;
        window.particleSystem.addSparkBurst(spawnX, spawnY, 12, '#a855f7');
    }

    // Alias for legacy spell calls
    castSpell() {
        this.castFireball();
    }

    // ── Magic Shield ──────────────────────────────────────────────────────────
    toggleShield() {
        if (this.isDead || this.isDashing || this.isAttacking) return;
        if (this.shieldActive) {
            window.particleSystem.addFloatingText('SHIELD ACTIVE', this.x, this.y - this.height, '#c084fc', false);
            return;
        }
        if (this.shieldCooldown > 0) {
            const sec = Math.ceil(this.shieldCooldown / 60);
            window.particleSystem.addFloatingText(`COOLDOWN ${sec}s`, this.x, this.y - this.height, '#94a3b8', false);
            return;
        }
        if (this.isShielding) {
            this.isShielding = false;
            this.shieldCastTimer = 0;
            window.particleSystem.addFloatingText('CANCELLED', this.x, this.y - this.height, '#94a3b8', false);
        } else {
            this.beginShield();
        }
    }

    beginShield() {
        if (this.isDead || this.isDashing || this.isAttacking) return;
        if (this.shieldCooldown > 0 || this.shieldActive) return;

        this.isShielding = true;
        this.vx = 0; // stand still while casting
    }

    releaseShield() {
        // If released before fully charged, cancel
        if (this.isShielding && this.shieldCastTimer < this.shieldCastGoal) {
            this.isShielding = false;
            this.shieldCastTimer = 0;
        }
    }

    // ── Potion ────────────────────────────────────────────────────────────────
    usePotion() {
        if (this.potions <= 0 || this.health >= this.maxHealth || this.isDead || this.isDashing) return;

        this.potions--;
        this.health = Math.min(this.maxHealth, this.health + 1);
        window.soundEngine.playHeal();
        window.particleSystem.addSparkBurst(this.x, this.y - this.height / 2, 22, '#34d399');
        window.particleSystem.addFloatingText('+1 ♥', this.x, this.y - this.height, '#34d399', true);
    }

    // ── Update ────────────────────────────────────────────────────────────────
    update(input, arena) {
        if (this.isDead) return;

        // --- TIMERS ---
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.comboResetTimer > 0) this.comboResetTimer--;
        if (this.shieldCooldown > 0) this.shieldCooldown--;

        // --- MANA REGEN (5 per 3 sec) ---
        if (this.mana < this.maxMana) {
            this.manaRegenTimer++;
            if (this.manaRegenTimer >= this.manaRegenRate) {
                this.manaRegenTimer = 0;
                this.mana = Math.min(this.maxMana, this.mana + this.manaRegenAmount);
            }
        } else {
            this.manaRegenTimer = 0;
        }

        // --- SHIELD CAST ---
        if (this.isShielding) {
            if (input.left || input.right || input.jumpPressed) {
                this.isShielding = false;
                this.shieldCastTimer = 0;
            } else {
                this.shieldCastTimer++;
                this.vx = 0;

                // Sparkle effect while channelling
                if (this.shieldCastTimer % 10 === 0) {
                    window.particleSystem.addSparkBurst(this.x, this.y - this.height / 2, 4, '#a855f7');
                }

                if (this.shieldCastTimer >= this.shieldCastGoal) {
                    // Shield fully charged — activate!
                    this.isShielding = false;
                    this.shieldCastTimer = 0;
                    this.shieldActive = true;
                    this.shieldTimer = this.shieldDuration;
                    this.shieldCooldown = this.shieldCooldownMax;
                    window.soundEngine.playHeal(); // repurpose as shield ping
                    window.particleSystem.addShockwave(this.x, this.y - this.height / 2, 55, 4, '#a855f7');
                    window.particleSystem.addSparkBurst(this.x, this.y - this.height / 2, 30, '#c084fc');
                    window.particleSystem.addFloatingText('SHIELD UP!', this.x, this.y - this.height - 10, '#c084fc', true);
                }
            }
        }

        // --- SHIELD ACTIVE COUNTDOWN ---
        if (this.shieldActive) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                window.particleSystem.addSparkBurst(this.x, this.y - this.height / 2, 10, '#7e22ce');
            }
        }

        // --- DASH HANDLING ---
        if (this.isDashing) {
            this.vx = this.facing * this.dashSpeed;
            this.vy = 0;
            this.dashTimer--;

            if (this.dashTimer % 3 === 0) {
                window.particleSystem.addShadowClone(this);
            }

            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.vx *= 0.4;
            }
        } else if (!this.isShielding) {
            // --- NORMAL HORIZONTAL MOVEMENT ---
            let moveDir = 0;
            if (input.left) moveDir -= 1;
            if (input.right) moveDir += 1;

            if (moveDir !== 0) {
                this.facing = moveDir;
                this.vx = moveDir * this.speed;
                if (this.isGrounded && Math.random() < 0.25) {
                    window.particleSystem.addDust(this.x, this.y, this.facing, 2);
                }
            } else {
                this.vx *= 0.65;
                if (Math.abs(this.vx) < 0.2) this.vx = 0;
            }

            // --- JUMPING ---
            if (input.jumpPressed) {
                if (this.isGrounded) {
                    this.vy = this.jumpForce;
                    this.isGrounded = false;
                    this.canDoubleJump = true;
                    window.soundEngine.playJump();
                    window.particleSystem.addDust(this.x, this.y, 0, 8);
                } else if (this.wallSlide) {
                    this.vy = this.jumpForce * 0.95;
                    this.vx = -this.wallDir * this.speed * 1.3;
                    this.facing = -this.wallDir;
                    this.canDoubleJump = true;
                    window.soundEngine.playJump();
                    window.particleSystem.addDust(this.x, this.y - this.height / 2, this.wallDir, 6);
                } else if (this.canDoubleJump) {
                    this.vy = this.jumpForce * 0.88;
                    this.canDoubleJump = false;
                    window.soundEngine.playJump();
                    window.particleSystem.addSparkBurst(this.x, this.y - 10, 16, '#e0f2fe');
                }
            }

            if (!input.jump && this.vy < -3) this.vy *= 0.52;

            this.vy += this.gravity;
            if (this.vy > 14) this.vy = 14;
        }

        // --- ATTACK TIMING & HITBOX (Swordigo sweep) ---
        if (this.isAttacking) {
            this.attackTimer--;

            // Animate sweep angle across the arc
            const progress = 1 - this.attackTimer / this.attackDuration;
            const reach = this.attackCombo === 2 ? 60 : 48;

            if (this.attackDirection === 'horizontal') {
                // Sweep from behind-shoulder through to in-front: ~270° arc animated
                const totalArc = Math.PI * 1.5; // 270°
                const startAngle = this.facing > 0 ? -Math.PI * 0.75 : Math.PI * 1.75;
                this.sweepAngle = startAngle + this.facing * totalArc * progress;

                // Hitbox follows the tip of the sword
                const tipX = this.x + Math.cos(this.sweepAngle) * reach;
                const tipY = (this.y - this.height * 0.55) + Math.sin(this.sweepAngle) * reach;
                this.attackHitbox = {
                    x: tipX - 20,
                    y: tipY - 20,
                    width: 40,
                    height: 40,
                    damage: this.attackCombo === 2 ? 30 : 18,
                    isPogo: false
                };
            } else if (this.attackDirection === 'up') {
                this.attackHitbox = {
                    x: this.x - reach * 0.5,
                    y: this.y - this.height - 28,
                    width: reach,
                    height: reach,
                    damage: 20,
                    isPogo: false
                };
            } else if (this.attackDirection === 'down') {
                this.attackHitbox = {
                    x: this.x - reach * 0.5,
                    y: this.y - 5,
                    width: reach,
                    height: 32,
                    damage: 22,
                    isPogo: true
                };
            }

            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.attackHitbox = null;
            }
        } else {
            this.attackHitbox = null;
        }

        // --- POSITION & ARENA COLLISIONS ---
        this.x += this.vx;
        this.y += this.vy;

        this.isGrounded = false;
        if (this.y >= arena.groundY) {
            if (this.vy > 4) window.particleSystem.addDust(this.x, this.y, 0, 5);
            this.y = arena.groundY;
            this.vy = 0;
            this.isGrounded = true;
            this.canDoubleJump = true;
        }

        this.wallSlide = false;
        if (this.x - this.width / 2 < arena.left) {
            this.x = arena.left + this.width / 2;
            if (!this.isGrounded && this.vy > 0) {
                this.wallSlide = true; this.wallDir = -1;
                this.vy = Math.min(this.vy, 2.5);
            }
        }
        if (this.x + this.width / 2 > arena.right) {
            this.x = arena.right - this.width / 2;
            if (!this.isGrounded && this.vy > 0) {
                this.wallSlide = true; this.wallDir = 1;
                this.vy = Math.min(this.vy, 2.5);
            }
        }

        // Cloak physics
        const targetAnchorX = this.x - this.facing * 6;
        const targetAnchorY = this.y - this.height * 0.7;
        this.cloakPoints[0].x = targetAnchorX;
        this.cloakPoints[0].y = targetAnchorY;
        for (let i = 1; i < this.cloakPoints.length; i++) {
            const p = this.cloakPoints[i];
            const prev = this.cloakPoints[i - 1];
            const lag = 0.35;
            p.x += (prev.x - p.x - this.facing * 3) * lag;
            p.y += (prev.y + 7 - p.y) * lag;
        }

        // --- UPDATE PROJECTILES ---
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;

            p.trail.push({ x: p.x, y: p.y });
            if (p.trail.length > 10) p.trail.shift();

            if (Math.random() < 0.5) {
                window.particleSystem.addSparkBurst(p.x, p.y, 1, '#a855f7');
            }

            if (p.life <= 0 || p.x < arena.left - 60 || p.x > arena.right + 60) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    triggerPogoBounce() {
        this.vy = -12.5;
        this.canDoubleJump = true;
        this.dashCooldown = 0;
        window.soundEngine.playPogo();
        window.particleSystem.addShockwave(this.x, this.y, 45, 3.5, '#38bdf8');
        window.particleSystem.addSparkBurst(this.x, this.y, 18, '#ffffff');
    }

    // ── Draw ──────────────────────────────────────────────────────────────────
    draw(ctx) {
        // Flash when invincible
        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) return;

        ctx.save();

        // Draw Shield orb (behind character)
        if (this.shieldActive) {
            const pulse = 0.85 + Math.sin(Date.now() * 0.012) * 0.15;
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 20 * pulse;
            ctx.globalAlpha = 0.65 * pulse;
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.height / 2, 34, 0, Math.PI * 2);
            ctx.stroke();
            // Inner ring
            ctx.globalAlpha = 0.25 * pulse;
            ctx.fillStyle = '#c084fc';
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }

        // Shield cast charging ring
        if (this.isShielding) {
            const pct = this.shieldCastTimer / this.shieldCastGoal;
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.height / 2, 30, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Flowing Cloak
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.cloakPoints[0].x, this.cloakPoints[0].y);
        for (let i = 1; i < this.cloakPoints.length; i++) {
            ctx.lineTo(this.cloakPoints[i].x, this.cloakPoints[i].y);
        }
        ctx.lineTo(this.x, this.y - 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Main Body / Armored Tunic
        ctx.fillStyle = '#090d16';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(this.x - 10, this.y - this.height * 0.65, 20, this.height * 0.6, 5);
        ctx.fill();
        ctx.stroke();

        // Runic Trim
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(this.x - 2, this.y - this.height * 0.62, 4, 18);

        // Hood / Cowl
        const headY = this.y - this.height + 10;
        ctx.fillStyle = '#0b0f19';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x - 13, headY + 12);
        ctx.lineTo(this.x - 14, headY - 4);
        ctx.quadraticCurveTo(this.x - 10, headY - 22, this.x, headY - 26);
        ctx.quadraticCurveTo(this.x + 10, headY - 22, this.x + 14, headY - 4);
        ctx.lineTo(this.x + 13, headY + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner Face Shadow
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.ellipse(this.x + this.facing * 2, headY, 8, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Scarf Knot
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(this.x - 6, headY + 8, 12, 4);

        // Phantom Eyes
        const eyeOffset = this.facing * 3;
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(this.x - 6 + eyeOffset, headY - 1);
        ctx.lineTo(this.x - 1 + eyeOffset, headY);
        ctx.lineTo(this.x - 5 + eyeOffset, headY + 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 2 + eyeOffset, headY);
        ctx.lineTo(this.x + 7 + eyeOffset, headY - 1);
        ctx.lineTo(this.x + 6 + eyeOffset, headY + 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + eyeOffset - 1, headY - 0.5, 2, 2);
        ctx.shadowBlur = 0;

        // Swordigo-style slash sweep
        if (this.isAttacking && this.attackHitbox) {
            this.drawSwordigoSwing(ctx);
        }

        ctx.restore();

        // Fireballs drawn separately (outside save/restore)
        this.drawProjectiles(ctx);
    }

    // ── Swordigo Sword Swing ──────────────────────────────────────────────────
    drawSwordigoSwing(ctx) {
        ctx.save();
        const progress = 1 - this.attackTimer / this.attackDuration;
        const reach = this.attackCombo === 2 ? 60 : 48;

        // Color escalates per combo hit
        const colors = [
            { core: '#e2e8f0', glow: '#38bdf8', width: 3.5 },  // hit 1: silver
            { core: '#fde68a', glow: '#f59e0b', width: 4.5 },  // hit 2: gold
            { core: '#f9a8d4', glow: '#ec4899', width: 6 }     // hit 3: magenta blaze
        ];
        const c = colors[Math.min(this.attackCombo, 2)];

        if (this.attackDirection === 'horizontal') {
            const cx = this.x;
            const cy = this.y - this.height * 0.55;

            // ── Swordigo arc trail: draw fading arc segments swept so far ──
            const totalArc = Math.PI * 1.5;
            const startAngle = this.facing > 0 ? -Math.PI * 0.75 : Math.PI * 1.75;
            const endAngle = this.sweepAngle;

            const segments = 14;
            for (let s = 0; s < segments; s++) {
                const t0 = s / segments;
                const t1 = (s + 1) / segments;
                const a0 = startAngle + this.facing * totalArc * t0 * progress;
                const a1 = startAngle + this.facing * totalArc * t1 * progress;
                const alpha = (s / segments) * 0.9 + 0.1; // fade older parts

                ctx.strokeStyle = c.core;
                ctx.globalAlpha = alpha;
                ctx.shadowColor = c.glow;
                ctx.shadowBlur = 14 * alpha;
                ctx.lineWidth = c.width * (0.5 + 0.5 * (s / segments));
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(cx, cy, reach, a0, a1, this.facing < 0);
                ctx.stroke();
            }

            // ── Bright sword blade tip at current angle ──
            ctx.globalAlpha = 1;
            const tipX = cx + Math.cos(this.sweepAngle) * reach;
            const tipY = cy + Math.sin(this.sweepAngle) * reach;
            const baseX = cx + Math.cos(this.sweepAngle) * (reach * 0.3);
            const baseY = cy + Math.sin(this.sweepAngle) * (reach * 0.3);

            ctx.strokeStyle = '#ffffff';
            ctx.shadowColor = c.glow;
            ctx.shadowBlur = 20;
            ctx.lineWidth = c.width * 0.8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(baseX, baseY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();

            // Sparkle at tip on first few frames
            if (this.attackTimer > this.attackDuration * 0.6 && Math.random() < 0.6) {
                window.particleSystem.addSparkBurst(tipX, tipY, 2, c.glow);
            }

        } else if (this.attackDirection === 'up') {
            ctx.strokeStyle = c.core;
            ctx.shadowColor = c.glow;
            ctx.shadowBlur = 14;
            ctx.lineWidth = c.width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.height * 0.8, reach * 0.9, -Math.PI * 0.95, -Math.PI * 0.05);
            ctx.stroke();
        } else if (this.attackDirection === 'down') {
            ctx.strokeStyle = c.core;
            ctx.shadowColor = c.glow;
            ctx.shadowBlur = 14;
            ctx.lineWidth = c.width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(this.x, this.y, reach * 0.75, Math.PI * 0.05, Math.PI * 0.95);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ── Purple Fireball Projectiles ───────────────────────────────────────────
    drawProjectiles(ctx) {
        ctx.save();
        for (const p of this.projectiles) {
            // Purple flame trail
            for (let i = 0; i < p.trail.length; i++) {
                const tr = p.trail[i];
                const frac = i / p.trail.length;
                ctx.globalAlpha = frac * 0.55;
                ctx.fillStyle = frac > 0.5 ? '#c084fc' : '#7e22ce';
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, 10 * frac, 0, Math.PI * 2);
                ctx.fill();
            }

            // Fireball core
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 22;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
            ctx.fill();

            // Inner purple flame
            ctx.fillStyle = '#a855f7';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();

            // Dark hot core
            ctx.fillStyle = '#3b0764';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

window.Player = Player;
