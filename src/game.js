/**
 * Core Game Engine & Level Manager
 * Manages game loop, physics resolution, hit-stop juice,
 * camera shake, parallax backdrop, and HUD rendering.
 */

const ARENA_THEMES = {
    1: {
        name: "Overgrown Moss Grotto",
        diffName: "NOVICE",
        diffColor: "#4ade80",
        bgTop: "#021207",
        bgMid: "#062412",
        bgBottom: "#010804",
        archColor: "#051f0f",
        pillarColor: "#072614",
        runeColor: "rgba(74, 222, 128, 0.35)",
        runeGlow: "#22c55e",
        floorColor: "#082112",
        floorRim: "#16a34a",
        floorHighlight: "#4ade80",
        moteColorPrefix: "rgba(134, 239, 172, ",
        moteGlow: "#4ade80",
        vignetteCore: "rgba(2, 18, 7, 0.35)",
        vignetteEdge: "rgba(2, 18, 7, 0.96)"
    },
    2: {
        name: "Mantis Wind Cliffs",
        diffName: "APPRENTICE",
        diffColor: "#38bdf8",
        bgTop: "#040b18",
        bgMid: "#0b1836",
        bgBottom: "#02050e",
        archColor: "#0c1833",
        pillarColor: "#0f2044",
        runeColor: "rgba(56, 189, 248, 0.35)",
        runeGlow: "#0284c7",
        floorColor: "#0a1733",
        floorRim: "#0284c7",
        floorHighlight: "#38bdf8",
        moteColorPrefix: "rgba(125, 211, 252, ",
        moteGlow: "#38bdf8",
        vignetteCore: "rgba(4, 11, 24, 0.35)",
        vignetteEdge: "rgba(2, 6, 15, 0.96)"
    },
    3: {
        name: "Corrupted Soul Sanctum",
        diffName: "ADEPT",
        diffColor: "#c084fc",
        bgTop: "#120520",
        bgMid: "#250a40",
        bgBottom: "#08020d",
        archColor: "#1d0833",
        pillarColor: "#280b45",
        runeColor: "rgba(192, 132, 252, 0.35)",
        runeGlow: "#a855f7",
        floorColor: "#170729",
        floorRim: "#9333ea",
        floorHighlight: "#c084fc",
        moteColorPrefix: "rgba(216, 180, 254, ",
        moteGlow: "#a855f7",
        vignetteCore: "rgba(18, 5, 32, 0.35)",
        vignetteEdge: "rgba(8, 2, 13, 0.96)"
    },
    4: {
        name: "Crystalline Cavern",
        diffName: "CHALLENGING",
        diffColor: "#22d3ee",
        bgTop: "#02141a",
        bgMid: "#052e3b",
        bgBottom: "#010c10",
        archColor: "#06222b",
        pillarColor: "#082e3b",
        runeColor: "rgba(34, 211, 238, 0.35)",
        runeGlow: "#06b6d4",
        floorColor: "#052029",
        floorRim: "#0891b2",
        floorHighlight: "#22d3ee",
        moteColorPrefix: "rgba(103, 232, 249, ",
        moteGlow: "#06b6d4",
        vignetteCore: "rgba(2, 20, 26, 0.35)",
        vignetteEdge: "rgba(1, 12, 16, 0.96)"
    },
    5: {
        name: "The Void Abyss",
        diffName: "EXPERT",
        diffColor: "#94a3b8",
        bgTop: "#020306",
        bgMid: "#080c14",
        bgBottom: "#000000",
        archColor: "#090d16",
        pillarColor: "#0c1322",
        runeColor: "rgba(148, 163, 184, 0.25)",
        runeGlow: "#64748b",
        floorColor: "#04060b",
        floorRim: "#334155",
        floorHighlight: "#94a3b8",
        moteColorPrefix: "rgba(226, 232, 240, ",
        moteGlow: "#94a3b8",
        vignetteCore: "rgba(2, 3, 6, 0.4)",
        vignetteEdge: "rgba(0, 0, 0, 0.98)"
    },
    6: {
        name: "Amber Royal Hive",
        diffName: "MASTER",
        diffColor: "#facc15",
        bgTop: "#180e02",
        bgMid: "#331c04",
        bgBottom: "#0c0701",
        archColor: "#281703",
        pillarColor: "#3a2105",
        runeColor: "rgba(251, 191, 36, 0.4)",
        runeGlow: "#eab308",
        floorColor: "#241403",
        floorRim: "#ca8a04",
        floorHighlight: "#facc15",
        moteColorPrefix: "rgba(253, 224, 71, ",
        moteGlow: "#eab308",
        vignetteCore: "rgba(24, 14, 2, 0.35)",
        vignetteEdge: "rgba(12, 7, 1, 0.96)"
    },
    7: {
        name: "The Scarlet Pyre Tent",
        diffName: "TORMENT",
        diffColor: "#f43f5e",
        bgTop: "#1c0307",
        bgMid: "#3b060f",
        bgBottom: "#0d0103",
        archColor: "#2e050c",
        pillarColor: "#420711",
        runeColor: "rgba(244, 63, 94, 0.4)",
        runeGlow: "#e11d48",
        floorColor: "#26040a",
        floorRim: "#be123c",
        floorHighlight: "#f43f5e",
        moteColorPrefix: "rgba(253, 164, 175, ",
        moteGlow: "#e11d48",
        vignetteCore: "rgba(28, 3, 7, 0.4)",
        vignetteEdge: "rgba(13, 1, 3, 0.96)"
    },
    8: {
        name: "Sunken Abyssal Trench",
        diffName: "NIGHTMARE",
        diffColor: "#14b8a6",
        bgTop: "#011219",
        bgMid: "#032736",
        bgBottom: "#00080d",
        archColor: "#031d27",
        pillarColor: "#052a38",
        runeColor: "rgba(20, 184, 166, 0.4)",
        runeGlow: "#0d9488",
        floorColor: "#021721",
        floorRim: "#0f766e",
        floorHighlight: "#14b8a6",
        moteColorPrefix: "rgba(94, 234, 212, ",
        moteGlow: "#0d9488",
        vignetteCore: "rgba(1, 18, 25, 0.35)",
        vignetteEdge: "rgba(0, 8, 13, 0.96)"
    },
    9: {
        name: "Gilded Citadel Throne",
        diffName: "INFERNAL",
        diffColor: "#fbbf24",
        bgTop: "#1a1503",
        bgMid: "#382d07",
        bgBottom: "#0a0802",
        archColor: "#282005",
        pillarColor: "#3d3108",
        runeColor: "rgba(250, 204, 21, 0.45)",
        runeGlow: "#eab308",
        floorColor: "#261f05",
        floorRim: "#d97706",
        floorHighlight: "#fbbf24",
        moteColorPrefix: "rgba(254, 240, 138, ",
        moteGlow: "#facc15",
        vignetteCore: "rgba(26, 21, 3, 0.35)",
        vignetteEdge: "rgba(10, 8, 2, 0.96)"
    },
    10: {
        name: "SOLAR HELL",
        diffName: "HELL",
        diffColor: "#ef4444",
        bgTop: "#330802",
        bgMid: "#661205",
        bgBottom: "#1a0300",
        archColor: "#470b03",
        pillarColor: "#610f04",
        runeColor: "rgba(239, 68, 68, 0.6)",
        runeGlow: "#dc2626",
        floorColor: "#3d0a02",
        floorRim: "#ef4444",
        floorHighlight: "#f87171",
        moteColorPrefix: "rgba(254, 202, 202, ",
        moteGlow: "#ef4444",
        vignetteCore: "rgba(66, 12, 4, 0.45)",
        vignetteEdge: "rgba(26, 3, 0, 0.98)",
        isHell: true
    }
};

class GameEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Virtual Resolution (Crisp 16:9 1100x620)
        this.width = 1100;
        this.height = 620;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Arena Boundaries
        this.arena = {
            left: 80,
            right: 1020,
            groundY: 530
        };

        // Input Management
        this.input = {
            left: false,
            right: false,
            up: false,
            down: false,
            jump: false,
            jumpPressed: false,
            attackPressed: false,
            dashPressed: false
        };

        // Juice Systems
        this.hitStopFrames = 0;
        this.cameraShake = 0;
        this.cameraShakeX = 0;
        this.cameraShakeY = 0;

        // Game State: 'title', 'playing', 'level_win', 'game_over', 'all_clear'
        this.state = 'title';
        this.currentLevel = 1;
        this.maxLevels = 10;
        this.levelTimer = 0; // In seconds
        this.levelFrames = 0;

        // Entities
        this.player = new Player(180, this.arena.groundY);
        this.boss = null;
        this.currentTheme = ARENA_THEMES[1];

        // Background scenery data
        this.initBackdrop();

        // Bind events
        this.setupControls();

        // Responsive scaling
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    initBackdrop() {
        this.pillars = [];
        for (let i = 0; i < 7; i++) {
            this.pillars.push({
                x: 100 + i * 160 + (Math.random() - 0.5) * 40,
                width: 38 + Math.random() * 20,
                height: 480,
                hasRunes: i % 2 === 0
            });
        }
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            // Start audio on first user gesture
            window.soundEngine.init();

            if (e.repeat) return;
            const key = e.key.toLowerCase();

            if (key === 'a' || key === 'arrowleft') this.input.left = true;
            if (key === 'd' || key === 'arrowright') this.input.right = true;
            if (key === 'w' || key === 'arrowup') {
                this.input.up = true;
                this.input.jump = true;
                this.input.jumpPressed = true;
            }
            if (key === 's' || key === 'arrowdown') {
                this.input.down = true;
            }
            if (key === ' ') {
                this.input.jump = true;
                this.input.jumpPressed = true;
                e.preventDefault();
            }

            // Attack (J or Z)
            if (key === 'j' || key === 'z') {
                this.handleAttack();
            }

            // Dash (L or Shift)
            if (key === 'l' || key === 'shift') {
                this.player.triggerDash();
                e.preventDefault();
            }

            // Soul Spell (K or X) — fires Aether Blast projectile
            if (key === 'k' || key === 'x') {
                this.player.castSpell();
            }

            // Use Health Potion (C or H)
            if (key === 'c' || key === 'h') {
                this.player.usePotion();
            }

            // Mute toggle (M)
            if (key === 'm') {
                window.soundEngine.toggleMute();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'a' || key === 'arrowleft') this.input.left = false;
            if (key === 'd' || key === 'arrowright') this.input.right = false;
            if (key === 'w' || key === 'arrowup') {
                this.input.up = false;
                this.input.jump = false;
            }
            if (key === 's' || key === 'arrowdown') {
                this.input.down = false;
            }
            if (key === ' ') this.input.jump = false;
        });

        // Mouse controls support
        this.canvas.addEventListener('mousedown', (e) => {
            window.soundEngine.init();
            if (this.state !== 'playing') return;

            if (e.button === 0) {
                // Left click: Attack
                this.handleAttack();
            } else if (e.button === 2) {
                // Right click: Use Potion
                e.preventDefault();
                this.player.usePotion();
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handleAttack() {
        let dir = 'horizontal';
        if (this.input.up) dir = 'up';
        else if (this.input.down && !this.player.isGrounded) dir = 'down';
        this.player.triggerAttack(dir);
    }

    resize() {
        const container = document.getElementById('game-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const scaleX = rect.width / this.width;
        const scaleY = rect.height / this.height;
        const scale = Math.min(scaleX, scaleY);

        this.canvas.style.width = `${this.width * scale}px`;
        this.canvas.style.height = `${this.height * scale}px`;
    }

    startLevel(levelNumber) {
        this.currentLevel = levelNumber;
        this.currentTheme = ARENA_THEMES[levelNumber] || ARENA_THEMES[1];
        this.state = 'playing';
        this.levelTimer = 0;
        this.levelFrames = 0;
        this.hitStopFrames = 0;
        this.cameraShake = 0;

        window.particleSystem.reset();
        this.player.reset(200, this.arena.groundY);
        this.boss = window.BossFactory.createBoss(levelNumber, this.arena);

        window.soundEngine.startAmbientBGM();
        window.particleSystem.addFloatingText(`LEVEL ${levelNumber}: ${this.currentTheme.name.toUpperCase()}`, this.width / 2, 230, '#ffffff', true);
        window.particleSystem.addFloatingText(`DIFFICULTY: ${this.currentTheme.diffName}`, this.width / 2, 265, this.currentTheme.diffColor, true);
        window.particleSystem.addFloatingText(`${this.boss.name} — ${this.boss.title}`, this.width / 2, 305, '#bae6fd', false);
    }

    restartCurrentLevel() {
        this.startLevel(this.currentLevel);
    }

    nextLevel() {
        if (this.currentLevel < this.maxLevels) {
            this.startLevel(this.currentLevel + 1);
        } else {
            this.state = 'all_clear';
            window.soundEngine.playBossDefeat();
        }
    }

    applyCameraShake(amount) {
        this.cameraShake = Math.max(this.cameraShake, amount);
    }

    // --- Main Update Loop ---
    update() {
        // Handle Hit Stop (brief 3-4 frame pause on high impacts)
        if (this.hitStopFrames > 0) {
            this.hitStopFrames--;
            return;
        }

        // Camera Shake decay
        if (this.cameraShake > 0) {
            this.cameraShakeX = (Math.random() - 0.5) * this.cameraShake;
            this.cameraShakeY = (Math.random() - 0.5) * this.cameraShake;
            this.cameraShake *= 0.88;
            if (this.cameraShake < 0.5) this.cameraShake = 0;
        } else {
            this.cameraShakeX = 0;
            this.cameraShakeY = 0;
        }

        window.particleSystem.update(this.width, this.height);

        if (this.state === 'playing') {
            this.levelFrames++;
            if (this.levelFrames % 60 === 0) {
                this.levelTimer++;
            }

            // Hell mode ambient embers
            if (this.currentTheme && this.currentTheme.isHell && Math.random() < 0.35) {
                const emberX = this.arena.left + Math.random() * (this.arena.right - this.arena.left);
                window.particleSystem.addSparkBurst(emberX, this.arena.groundY, 1, Math.random() < 0.5 ? '#ef4444' : '#fbbf24');
            }

            // Update Player
            this.player.update(this.input, this.arena);

            // Reset single-frame triggers
            this.input.jumpPressed = false;

            // Update Boss
            if (this.boss) {
                this.boss.update(this.player, this.arena);

                // --- Combat Collisions ---
                this.checkCombatCollisions();

                // Check Level Win
                if (this.boss.isDead && this.boss.deathTimer <= 0) {
                    this.state = 'level_win';
                    window.soundEngine.playBossDefeat();
                }
            }

            // Check Player Death
            if (this.player.isDead) {
                this.state = 'game_over';
            }
        }
    }

    checkCombatCollisions() {
        if (!this.boss || this.boss.isDead) return;

        const bossBox = {
            left: this.boss.x - this.boss.width / 2,
            right: this.boss.x + this.boss.width / 2,
            top: this.boss.y - this.boss.height,
            bottom: this.boss.y
        };

        // 1. Player Nail Attack vs Boss
        if (this.player.isAttacking && this.player.attackHitbox && !this.player.hasHitEnemyThisSwing) {
            const hb = this.player.attackHitbox;
            const hbBox = {
                left: hb.x,
                right: hb.x + hb.width,
                top: hb.y,
                bottom: hb.y + hb.height
            };

            // AABB Overlap check
            const overlaps = (
                hbBox.left < bossBox.right &&
                hbBox.right > bossBox.left &&
                hbBox.top < bossBox.bottom &&
                hbBox.bottom > bossBox.top
            );

            if (overlaps) {
                this.player.hasHitEnemyThisSwing = true;
                const knockbackDir = this.player.x < this.boss.x ? 1 : -1;
                const wasDamaged = this.boss.takeDamage(hb.damage, knockbackDir, hb.isPogo);

                if (wasDamaged) {
                    this.hitStopFrames = 4; // Punchy hitstop
                    this.applyCameraShake(hb.damage >= 25 ? 8 : 4);

                    // Downward Pogo Strike Bounce!
                    if (hb.isPogo && this.player.y < this.boss.y) {
                        this.player.triggerPogoBounce();
                    }
                }
            }
        }

        // 2. Player Soul Projectiles vs Boss
        for (let i = this.player.projectiles.length - 1; i >= 0; i--) {
            const proj = this.player.projectiles[i];
            const dist = Math.hypot(proj.x - this.boss.x, proj.y - (this.boss.y - this.boss.height / 2));
            if (dist < 32 + this.boss.width / 2) {
                const knockbackDir = proj.vx > 0 ? 1 : -1;
                this.boss.takeDamage(proj.damage, knockbackDir, false);
                this.hitStopFrames = 3;
                this.applyCameraShake(6);
                window.particleSystem.addSparkBurst(proj.x, proj.y, 16, '#38bdf8');
                this.player.projectiles.splice(i, 1);
            }
        }

        // NOTE: Contact with the boss body does NOT deal damage.
        // Only boss attack hitboxes (handled inside boss update) damage the player.
    }

    // --- Rendering ---
    draw() {
        this.ctx.save();

        // Apply Camera Shake
        this.ctx.translate(this.cameraShakeX, this.cameraShakeY);

        // 1. Atmospheric Cavern Backdrop
        this.drawBackground();

        // 2. Ambient Floating Motes (Foreground & Midground)
        window.particleSystem.drawAmbientMotes(this.ctx, this.currentTheme);

        // 3. Shadow Clones & Shockwaves
        window.particleSystem.drawShadowClones(this.ctx);
        window.particleSystem.drawShockwaves(this.ctx);

        // 4. Boss & Player
        if (this.boss) this.boss.draw(this.ctx);
        this.player.draw(this.ctx);

        // 5. Particles & Combat Float Text
        window.particleSystem.drawParticles(this.ctx);
        window.particleSystem.drawFloatingTexts(this.ctx);

        // 6. Vignette Lighting & Atmospheric Rim
        this.drawVignette();

        this.ctx.restore();

        // 7. HUD & UI Overlays (Screen Space - unaffected by camera shake)
        this.drawHUD();
        this.drawUIOverlays();
    }

    drawBackground() {
        const theme = this.currentTheme || ARENA_THEMES[1];

        // Gradient Backdrop
        const bgGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        bgGrad.addColorStop(0, theme.bgTop);
        bgGrad.addColorStop(0.65, theme.bgMid);
        bgGrad.addColorStop(1, theme.bgBottom);
        this.ctx.fillStyle = bgGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Distant Gothic Arches
        this.ctx.strokeStyle = theme.archColor;
        this.ctx.lineWidth = 12;
        for (let i = 0; i < 5; i++) {
            const archX = 140 + i * 210;
            this.ctx.beginPath();
            this.ctx.arc(archX, 280, 80, Math.PI, 0);
            this.ctx.stroke();
        }

        // Ruined Stone Pillars with Runic Glow
        for (const p of this.pillars) {
            this.ctx.fillStyle = theme.pillarColor;
            this.ctx.fillRect(p.x, 80, p.width, p.height);

            // Glowing runes
            if (p.hasRunes) {
                this.ctx.fillStyle = theme.runeColor;
                this.ctx.shadowColor = theme.runeGlow;
                this.ctx.shadowBlur = 10;
                for (let r = 0; r < 4; r++) {
                    this.ctx.fillRect(p.x + p.width * 0.35, 180 + r * 60, p.width * 0.3, 14);
                }
                this.ctx.shadowBlur = 0;
            }
        }

        // Solid Stone Floor & Platforms
        this.ctx.fillStyle = theme.floorColor;
        this.ctx.fillRect(0, this.arena.groundY, this.width, this.height - this.arena.groundY);

        // Ornate floor rim line
        this.ctx.strokeStyle = theme.floorRim;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.arena.groundY);
        this.ctx.lineTo(this.width, this.arena.groundY);
        this.ctx.stroke();

        // Floor highlights
        this.ctx.fillStyle = theme.floorHighlight;
        this.ctx.fillRect(this.arena.left, this.arena.groundY, 14, 6);
        this.ctx.fillRect(this.arena.right - 14, this.arena.groundY, 14, 6);

        // Special Hell lava fissures on Level 10
        if (theme.isHell) {
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.shadowColor = '#dc2626';
            this.ctx.shadowBlur = 12;
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.moveTo(220, this.arena.groundY + 2);
            this.ctx.lineTo(280, this.arena.groundY + 28);
            this.ctx.lineTo(340, this.arena.groundY + 12);
            this.ctx.moveTo(680, this.arena.groundY + 2);
            this.ctx.lineTo(740, this.arena.groundY + 22);
            this.ctx.lineTo(810, this.arena.groundY + 8);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }
    }

    drawVignette() {
        const theme = this.currentTheme || ARENA_THEMES[1];
        const radGrad = this.ctx.createRadialGradient(
            this.width / 2, this.height * 0.45, 260,
            this.width / 2, this.height * 0.45, 680
        );
        radGrad.addColorStop(0, 'rgba(0,0,0,0)');
        radGrad.addColorStop(0.7, theme.vignetteCore);
        radGrad.addColorStop(1, theme.vignetteEdge);
        this.ctx.fillStyle = radGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawHUD() {
        if (this.state === 'title') return;

        this.ctx.save();

        // --- 1. Vitality Runes (Player Health) ---
        const startRuneX = 90;
        const runeY = 48;
        for (let i = 0; i < this.player.maxHealth; i++) {
            const hasHealth = i < this.player.health;
            const rx = startRuneX + i * 26;

            if (hasHealth) {
                // Glowing Cyan Runic Diamond Shard
                this.ctx.fillStyle = '#f8fafc';
                this.ctx.strokeStyle = '#38bdf8';
                this.ctx.shadowColor = '#0284c7';
                this.ctx.shadowBlur = 8;
                this.ctx.lineWidth = 1.8;
                this.ctx.beginPath();
                this.ctx.moveTo(rx, runeY - 11);
                this.ctx.lineTo(rx + 8, runeY);
                this.ctx.lineTo(rx, runeY + 11);
                this.ctx.lineTo(rx - 8, runeY);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();

                // Core glint
                this.ctx.fillStyle = '#0284c7';
                this.ctx.beginPath();
                this.ctx.arc(rx, runeY, 2.5, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Shattered / Dimmed Shard
                this.ctx.fillStyle = '#0f172a';
                this.ctx.strokeStyle = '#334155';
                this.ctx.lineWidth = 1.2;
                this.ctx.shadowBlur = 0;
                this.ctx.beginPath();
                this.ctx.moveTo(rx, runeY - 10);
                this.ctx.lineTo(rx + 7, runeY);
                this.ctx.lineTo(rx, runeY + 10);
                this.ctx.lineTo(rx - 7, runeY);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            }
        }

        // --- 2. Health Potions (bottom-left style row, below runes) ---
        const potionStartX = 70;
        const potionY = 82;
        const totalPotions = this.player.maxPotions;
        const usedPotions = totalPotions - this.player.potions;

        for (let i = 0; i < totalPotions; i++) {
            const px = potionStartX + i * 24;
            const full = i >= usedPotions;

            // Vial body
            this.ctx.save();
            this.ctx.strokeStyle = full ? '#38bdf8' : '#334155';
            this.ctx.lineWidth = 1.5;
            this.ctx.shadowColor = full ? '#0ea5e9' : 'transparent';
            this.ctx.shadowBlur = full ? 7 : 0;

            // Vial outline (rounded rect)
            this.ctx.beginPath();
            this.ctx.roundRect(px - 6, potionY - 14, 12, 18, 3);
            this.ctx.fillStyle = full ? '#0c1a2e' : '#0a0d14';
            this.ctx.fill();
            this.ctx.stroke();

            // Liquid fill
            if (full) {
                this.ctx.fillStyle = '#38bdf8';
                this.ctx.shadowColor = '#38bdf8';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.roundRect(px - 4, potionY - 6, 8, 8, 2);
                this.ctx.fill();
            }

            // Vial neck
            this.ctx.strokeStyle = full ? '#94a3b8' : '#334155';
            this.ctx.shadowBlur = 0;
            this.ctx.beginPath();
            this.ctx.roundRect(px - 3, potionY - 19, 6, 6, 2);
            this.ctx.fillStyle = '#0f172a';
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.restore();
        }

        // Label
        this.ctx.font = '10px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#64748b';
        this.ctx.textAlign = 'left';
        this.ctx.shadowBlur = 0;
        this.ctx.fillText(`POTIONS  [C]`, potionStartX - 6, potionY + 10);

        // --- 3. Boss Health Bar (Top Center) ---
        if (this.boss && !this.boss.isDead) {
            const barWidth = 460;
            const barHeight = 16;
            const barX = (this.width - barWidth) / 2;
            const barY = 44;

            // Boss Name & Title
            this.ctx.font = 'bold 15px "Cinzel", "Segoe UI", serif';
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 6;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${this.boss.name.toUpperCase()}  —  ${this.boss.title}`, this.width / 2, barY - 10);

            // Bar Background
            this.ctx.fillStyle = '#0f172a';
            this.ctx.strokeStyle = '#475569';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(barX, barY, barWidth, barHeight, 4);
            this.ctx.fill();
            this.ctx.stroke();

            // Current Health Fill
            const hpRatio = Math.max(0, this.boss.hp / this.boss.maxHp);
            this.ctx.fillStyle = this.boss.isStaggered ? '#fbbf24' : '#ef4444';
            this.ctx.shadowColor = this.boss.isStaggered ? '#f59e0b' : '#dc2626';
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.roundRect(barX + 2, barY + 2, (barWidth - 4) * hpRatio, barHeight - 4, 3);
            this.ctx.fill();
        }

        // --- 4. Level Timer & Difficulty Badge (Top Right) ---
        const theme = this.currentTheme || ARENA_THEMES[1];
        const formattedTimer = `${Math.floor(this.levelTimer / 60)}:${(this.levelTimer % 60).toString().padStart(2, '0')}`;

        this.ctx.font = 'bold 13px "Cinzel", "Segoe UI", sans-serif';
        this.ctx.fillStyle = theme.diffColor;
        this.ctx.shadowColor = theme.diffColor;
        this.ctx.shadowBlur = theme.isHell ? (8 + Math.sin(Date.now() * 0.008) * 6) : 4;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`DIFF: ${theme.diffName}`, this.width - 50, 36);

        this.ctx.font = '12px "Segoe UI", sans-serif';
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.shadowBlur = 0;
        this.ctx.fillText(`TIME: ${formattedTimer}  •  LVL ${this.currentLevel}/10`, this.width - 50, 54);

        this.ctx.restore();
    }

    drawUIOverlays() {
        this.ctx.save();
        this.ctx.textAlign = 'center';

        if (this.state === 'title') {
            // Dark Backdrop Overlay
            this.ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Title
            this.ctx.font = 'bold 44px "Cinzel", "Georgia", serif';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = '#38bdf8';
            this.ctx.shadowBlur = 18;
            this.ctx.fillText('UMBRAL EDGE', this.width / 2, 180);

            this.ctx.font = '16px "Cinzel", sans-serif';
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.shadowBlur = 0;
            this.ctx.fillText('1V1 BLADE DUEL PLATFORMER  •  10 REALMS OF TRIAL', this.width / 2, 220);

            // Start Prompt
            const pulse = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
            this.ctx.font = 'bold 20px "Cinzel", sans-serif';
            this.ctx.fillStyle = `rgba(56, 189, 248, ${0.6 + pulse * 0.4})`;
            this.ctx.shadowColor = '#0284c7';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText('PRESS SPACE OR CLICK "START GAME" TO BEGIN', this.width / 2, 340);

            // Controls summary
            this.ctx.font = '13px "Segoe UI", sans-serif';
            this.ctx.fillStyle = '#64748b';
            this.ctx.fillText('A/D: Move  |  W/Space: Jump (Double Jump)  |  J/Left Click: Slash Combo  |  Down+Slash: Pogo Bounce', this.width / 2, 420);
            this.ctx.fillText('L/Shift: Shadow Dash (i-frames)  |  K/X: Aether Blast  |  C/H/Right Click: Use Potion  |  M: Mute', this.width / 2, 445);
        } else if (this.state === 'level_win') {
            this.ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.font = 'bold 36px "Cinzel", serif';
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.shadowColor = '#0284c7';
            this.ctx.shadowBlur = 16;
            this.ctx.fillText('ENEMY VANQUISHED', this.width / 2, 220);

            this.ctx.font = '20px "Cinzel", sans-serif';
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.shadowBlur = 0;
            this.ctx.fillText(`DUEL TIME: ${this.levelTimer} SECONDS`, this.width / 2, 270);

            const isSpeedy = this.levelTimer <= 40;
            this.ctx.font = '16px "Segoe UI", sans-serif';
            this.ctx.fillStyle = isSpeedy ? '#4ade80' : '#facc15';
            this.ctx.fillText(isSpeedy ? '★ GOLD SPEED RANK (UNDER 40s) ★' : 'LEVEL COMPLETE!', this.width / 2, 305);

            this.ctx.font = 'bold 18px "Cinzel", sans-serif';
            this.ctx.fillStyle = '#bae6fd';
            this.ctx.fillText('PRESS SPACE OR CLICK "NEXT LEVEL" TO PROCEED', this.width / 2, 380);
        } else if (this.state === 'game_over') {
            this.ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.font = 'bold 40px "Cinzel", serif';
            this.ctx.fillStyle = '#ef4444';
            this.ctx.shadowColor = '#dc2626';
            this.ctx.shadowBlur = 18;
            this.ctx.fillText('BLADE FALLEN', this.width / 2, 230);

            this.ctx.font = '18px "Cinzel", sans-serif';
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.shadowBlur = 0;
            this.ctx.fillText('DO NOT FALTER, DUELIST. LEARN THE PATTERNS.', this.width / 2, 280);

            this.ctx.font = 'bold 18px "Cinzel", sans-serif';
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.fillText('PRESS SPACE OR CLICK "RETRY" TO RISE AGAIN', this.width / 2, 360);
        } else if (this.state === 'all_clear') {
            this.ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.font = 'bold 42px "Cinzel", serif';
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.shadowColor = '#d97706';
            this.ctx.shadowBlur = 20;
            this.ctx.fillText('UMBRAL CHAMPION', this.width / 2, 210);

            this.ctx.font = '20px "Cinzel", sans-serif';
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.shadowBlur = 0;
            this.ctx.fillText('ALL 10 GUARDIANS HAVE FALLEN', this.width / 2, 260);

            this.ctx.font = '16px "Segoe UI", sans-serif';
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.fillText('You have conquered every duel across all 10 realms with blade and reflex.', this.width / 2, 300);

            this.ctx.font = 'bold 18px "Cinzel", sans-serif';
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.fillText('PRESS SPACE OR CLICK "PLAY AGAIN"', this.width / 2, 380);
        }

        this.ctx.restore();
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    start() {
        this.loop();
    }
}

window.GameEngine = GameEngine;
