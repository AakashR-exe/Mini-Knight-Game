/**
 * Particle and Visual Effects System
 * Manages atmospheric dust motes, combat sparks, slash trails,
 * shadow clones, shockwaves, and floating combat text.
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.shadowClones = [];
        this.shockwaves = [];
        this.floatingTexts = [];
        this.ambientMotes = [];

        // Initialize atmospheric background motes
        for (let i = 0; i < 40; i++) {
            this.ambientMotes.push({
                x: Math.random() * 1200,
                y: Math.random() * 700,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -Math.random() * 0.4 - 0.1,
                size: Math.random() * 2.5 + 1,
                alpha: Math.random() * 0.6 + 0.2,
                baseAlpha: Math.random() * 0.6 + 0.2,
                pulseSpeed: Math.random() * 0.03 + 0.01,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    reset() {
        this.particles = [];
        this.shadowClones = [];
        this.shockwaves = [];
        this.floatingTexts = [];
    }

    addSparkBurst(x, y, count = 12, color = '#64d8ff') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 7 + 2;
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1.5,
                color: color,
                alpha: 1,
                decay: Math.random() * 0.04 + 0.03,
                gravity: 0.15
            });
        }
    }

    addSoulSplatter(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1.5;
            this.particles.push({
                type: 'soul',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                size: Math.random() * 4 + 2,
                color: '#ffffff',
                glowColor: '#7dd3fc',
                alpha: 1,
                decay: 0.025,
                gravity: -0.05 // floats upward
            });
        }
    }

    addDust(x, y, direction = 0, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                type: 'dust',
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 4,
                vx: -direction * (Math.random() * 2 + 0.5) + (Math.random() - 0.5) * 0.8,
                vy: -Math.random() * 1.5 - 0.2,
                size: Math.random() * 4 + 2,
                color: '#94a3b8',
                alpha: 0.7,
                decay: 0.035,
                gravity: 0.02
            });
        }
    }

    addShockwave(x, y, maxRadius = 60, speed = 4, color = '#bae6fd') {
        this.shockwaves.push({
            x: x,
            y: y,
            radius: 5,
            maxRadius: maxRadius,
            speed: speed,
            color: color,
            alpha: 0.8,
            decay: 0.03
        });
    }

    addShadowClone(player) {
        this.shadowClones.push({
            x: player.x,
            y: player.y,
            facing: player.facing,
            width: player.width,
            height: player.height,
            state: player.state,
            alpha: 0.55,
            decay: 0.05
        });
    }

    addFloatingText(text, x, y, color = '#ffffff', isCritical = false) {
        this.floatingTexts.push({
            text: text,
            x: x + (Math.random() - 0.5) * 16,
            y: y - 10,
            vy: -2.2,
            alpha: 1,
            color: color,
            isCritical: isCritical,
            size: isCritical ? 22 : 16,
            decay: 0.025
        });
    }

    update(arenaWidth = 1200, arenaHeight = 700) {
        // Update ambient motes
        for (const mote of this.ambientMotes) {
            mote.x += mote.vx;
            mote.y += mote.vy;
            mote.pulse += mote.pulseSpeed;
            mote.alpha = mote.baseAlpha + Math.sin(mote.pulse) * 0.2;

            if (mote.y < -10) mote.y = arenaHeight + 10;
            if (mote.x < -10) mote.x = arenaWidth + 10;
            if (mote.x > arenaWidth + 10) mote.x = -10;
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update shadow clones
        for (let i = this.shadowClones.length - 1; i >= 0; i--) {
            const sc = this.shadowClones[i];
            sc.alpha -= sc.decay;
            if (sc.alpha <= 0) {
                this.shadowClones.splice(i, 1);
            }
        }

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += sw.speed;
            sw.alpha -= sw.decay;
            if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
                this.shockwaves.splice(i, 1);
            }
        }

        // Update floating combat texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.vy *= 0.95;
            ft.alpha -= ft.decay;
            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    drawAmbientMotes(ctx, theme = null) {
        ctx.save();
        const baseColor = theme ? theme.moteColor : 'rgba(165, 243, 252, ';
        const glowColor = theme ? theme.moteGlow : '#38bdf8';
        for (const mote of this.ambientMotes) {
            ctx.fillStyle = theme ? (theme.moteColorPrefix ? `${theme.moteColorPrefix}${Math.max(0, mote.alpha)})` : theme.moteColor) : `rgba(165, 243, 252, ${Math.max(0, mote.alpha)})`;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawShadowClones(ctx) {
        ctx.save();
        for (const sc of this.shadowClones) {
            ctx.globalAlpha = sc.alpha;
            ctx.fillStyle = '#0f172a';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;

            // Simple silhouette
            ctx.beginPath();
            ctx.roundRect(sc.x - sc.width / 2, sc.y - sc.height, sc.width, sc.height, 8);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    drawShockwaves(ctx) {
        ctx.save();
        for (const sw of this.shockwaves) {
            ctx.strokeStyle = sw.color;
            ctx.globalAlpha = sw.alpha;
            ctx.lineWidth = 3;
            ctx.beginPath();
            // Flat oval shockwave on ground
            ctx.ellipse(sw.x, sw.y, sw.radius, sw.radius * 0.35, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawParticles(ctx) {
        ctx.save();
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.alpha);
            if (p.type === 'spark') {
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            } else if (p.type === 'soul') {
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.glowColor;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'dust') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    drawFloatingTexts(ctx) {
        ctx.save();
        for (const ft of this.floatingTexts) {
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.font = `${ft.isCritical ? 'bold ' : ''}${ft.size}px "Cinzel", "Segoe UI", sans-serif`;
            ctx.fillStyle = ft.color;
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.restore();
    }
}

window.particleSystem = new ParticleSystem();
