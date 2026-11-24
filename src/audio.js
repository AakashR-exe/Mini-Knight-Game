/**
 * Audio Engine using Web Audio API
 * Fully procedural sound effects and dynamic ambient background music.
 * Zero external audio files required - 100% reliable, zero latency.
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.7;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.35;
        this.muted = false;
        this.bgmPlaying = false;
        this.bgmInterval = null;
        this.scale = [110, 130.81, 146.83, 164.81, 196, 220, 261.63, 293.66]; // A minor pentatonic / dorian
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    // --- Sound Effects ---

    playSlash(comboIndex = 0) {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // White noise burst with bandpass sweep
        const bufferSize = this.ctx.sampleRate * 0.12;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        const startFreq = comboIndex === 2 ? 1400 : (comboIndex === 1 ? 1100 : 900);
        const endFreq = comboIndex === 2 ? 300 : 200;
        filter.frequency.setValueAtTime(startFreq, t);
        filter.frequency.exponentialRampToValueAtTime(endFreq, t + 0.1);
        filter.Q.value = 2.5;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.11);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(t);
        noise.stop(t + 0.12);

        // Blade tone
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        const pitch = comboIndex === 2 ? 440 : (comboIndex === 1 ? 380 : 320);
        osc.frequency.setValueAtTime(pitch, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.09);

        oscGain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    playPogo() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // Iconic Hollow Knight metallic nail ding
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(880, t); // A5
        osc1.frequency.exponentialRampToValueAtTime(1760, t + 0.04);
        osc1.frequency.exponentialRampToValueAtTime(1200, t + 0.25);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, t);
        osc2.frequency.exponentialRampToValueAtTime(600, t + 0.2);

        gain.gain.setValueAtTime(0.6 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.25);
        osc2.stop(t + 0.25);
    }

    playHit(isHeavy = false) {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // Sub impact thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isHeavy ? 180 : 120, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

        gain.gain.setValueAtTime((isHeavy ? 0.7 : 0.45) * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.15);
    }

    playDash() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // Fast airy whoosh
        const bufferSize = this.ctx.sampleRate * 0.18;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(2400, t + 0.08);
        filter.frequency.exponentialRampToValueAtTime(400, t + 0.18);
        filter.Q.value = 1.2;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(t);
        noise.stop(t + 0.18);
    }

    playSpell() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // Soul spell blast (like Vengeful Spirit)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(660, t + 0.1);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.35);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, t);
        filter.frequency.exponentialRampToValueAtTime(300, t + 0.35);

        gain.gain.setValueAtTime(0.5 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.35);
    }

    playHeal() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // Focus heal chime (ascending arpeggio)
        const notes = [329.63, 440, 554.37, 659.25]; // E major
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = t + idx * 0.08;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.3 * this.sfxVolume, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(start);
            osc.stop(start + 0.3);
        });
    }

    playTelegraph() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // Menacing high harmonic warning sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.linearRampToValueAtTime(950, t + 0.25);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 4.0;

        gain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.25);
    }

    playBossRoar() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.5);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, t);
        filter.frequency.exponentialRampToValueAtTime(150, t + 0.5);

        gain.gain.setValueAtTime(0.6 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.5);
    }

    playBossDefeat() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // Big cinematic rumble and ascending chime
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.8);

        gain.gain.setValueAtTime(0.8 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.8);

        // Chimes
        const chimeNotes = [523.25, 659.25, 783.99, 1046.50];
        chimeNotes.forEach((freq, idx) => {
            const cOsc = this.ctx.createOscillator();
            const cGain = this.ctx.createGain();
            const start = t + 0.2 + idx * 0.12;

            cOsc.type = 'sine';
            cOsc.frequency.setValueAtTime(freq, start);

            cGain.gain.setValueAtTime(0.4 * this.sfxVolume, start);
            cGain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

            cOsc.connect(cGain);
            cGain.connect(this.ctx.destination);
            cOsc.start(start);
            cOsc.stop(start + 0.6);
        });
    }

    playJump() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(380, t + 0.12);

        gain.gain.setValueAtTime(0.25 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    playPlayerHurt() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(60, t + 0.2);

        gain.gain.setValueAtTime(0.5 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    // --- Dynamic Ambient Music ---
    startAmbientBGM() {
        if (this.bgmPlaying) return;
        this.init();
        this.bgmPlaying = true;

        const bassNotes = [55, 65.41, 73.42, 82.41]; // A1, C2, D2, E2
        let step = 0;

        this.bgmInterval = setInterval(() => {
            if (this.muted || !this.bgmPlaying) return;
            const t = this.ctx.currentTime;

            // Deep pulsing bass pad
            const bass = this.ctx.createOscillator();
            const bassFilter = this.ctx.createBiquadFilter();
            const bassGain = this.ctx.createGain();

            bass.type = 'triangle';
            bass.frequency.setValueAtTime(bassNotes[step % bassNotes.length], t);

            bassFilter.type = 'lowpass';
            bassFilter.frequency.setValueAtTime(220, t);

            bassGain.gain.setValueAtTime(0.01, t);
            bassGain.gain.linearRampToValueAtTime(0.25 * this.musicVolume, t + 0.8);
            bassGain.gain.exponentialRampToValueAtTime(0.001, t + 2.8);

            bass.connect(bassFilter);
            bassFilter.connect(bassGain);
            bassGain.connect(this.ctx.destination);

            bass.start(t);
            bass.stop(t + 3.0);

            // Ambient hollow bell note
            if (step % 2 === 0) {
                const bellFreq = this.scale[Math.floor(Math.random() * this.scale.length)] * 2;
                const bell = this.ctx.createOscillator();
                const bellGain = this.ctx.createGain();

                bell.type = 'sine';
                bell.frequency.setValueAtTime(bellFreq, t + 0.5);

                bellGain.gain.setValueAtTime(0.01, t + 0.5);
                bellGain.gain.linearRampToValueAtTime(0.12 * this.musicVolume, t + 0.6);
                bellGain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

                bell.connect(bellGain);
                bellGain.connect(this.ctx.destination);

                bell.start(t + 0.5);
                bell.stop(t + 2.6);
            }

            step++;
        }, 1800);
    }

    stopAmbientBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
        this.bgmPlaying = false;
    }

    playBossHurt() {
        if (this.muted) return;
        this.init();
        const t = this.ctx.currentTime;

        // Heavy metallic stagger clang — distinct from playHit
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(220, t);
        osc1.frequency.exponentialRampToValueAtTime(80, t + 0.3);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(440, t);
        osc2.frequency.exponentialRampToValueAtTime(180, t + 0.25);

        gain.gain.setValueAtTime(0.6 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(t); osc2.start(t);
        osc1.stop(t + 0.3); osc2.stop(t + 0.3);
    }
}

window.soundEngine = new SoundEngine();
