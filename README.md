# Umbral Edge ⚔️

A fast-paced 1v1 action boss duel platformer inspired by the fluid combat of dark fantasy platformers like *Swordigo*. Designed to run smoothly and lag-free in any web browser with zero external asset dependencies across **10 escalating realms of difficulty**.

---

## 🎮 Highlights & Mechanics

- **Original Identity & Hero**: Play as the **Umbral Duelist**—a hooded blademaster with glowing cyan visor eyes, flowing cloak, and an energized blade.
- **Pure 1v1 Boss Duels**: 10 distinct, handcrafted boss encounters (one enemy per level).
- **Brisk 30–40s Encounters**: Each encounter is tuned for rapid, high-intensity pattern-reading and execution.
- **Difficulty Progression**: Progresses from **NOVICE** to the unrelenting bullet-hell of **DIFFICULTY: HELL** on Level 10.
- **10 Distinct Arena Themes**: Every realm features a unique aesthetic background, color palette, architectural runes, atmospheric motes, and floor accents.
- **Combat Mechanics**:
  - **3-Hit Blade Combo**: Fluid multi-stage horizontal slashes with crescent light arcs.
  - **Downward Pogo Strike** (`Down + Attack` in mid-air): Bounce off enemies and spikes, refreshing your double jump and dash instantly!
  - **Upward Strike** (`Up + Attack`): Cleave flying and aerial threats above you.
  - **Shadow Dash** (`Shift` or `L`): Slip through enemies with invulnerability frames and shadow silhouettes.
  - **Aether Blast Spell** (`K`, `X`, or Right Click): Spend energy gained from sword strikes to fire piercing spirit projectiles.
  - **Focus Heal** (Hold `C`, `H`, or `Down` while grounded): Safely channel energy to regenerate Vitality Runes.
- **Telegraphed Pattern Attacks & Staggering**:
  - Enemies flash eye telegraphs, wind up ground stomps, dash slashes, projectiles, and shockwaves.
  - Bosses stagger once when their health crosses 75%, 40%, and 20%, granting free combo windows.
- **Procedural Web Audio Engine**:
  - 100% procedural sound effects and dynamic ambient cave chords synthesized via Web Audio API.
  - Zero external `.mp3` or `.wav` network loading delays or lag.
- **Full Touch & Keyboard Support**:
  - Play with keyboard, mouse, or touch controls (virtual D-pad and action buttons).

---

## 🕹️ Controls

| Action | Primary Key | Secondary Key | Mouse / Touch |
| :--- | :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` | `Left` / `Right` Arrow | Touch D-Pad |
| **Jump / Double Jump** | `Space` | `W` / `Up` Arrow | Jump Button |
| **Blade Slash Combo** | `J` | `Z` | Left Click / SLASH Button |
| **Upward Slash** | `W + J` | `Up + Z` | Up + SLASH |
| **Down Pogo Strike** | `S + J` in air | `Down + Z` in air | Down + SLASH |
| **Shadow Dash (i-frames)** | `L` | `Left Shift` | DASH Button |
| **Aether Blast (Spell)** | `K` | `X` | Right Click / SOUL Button |
| **Focus Heal** | `C` (Hold) | `H` or `Down` (Hold) | POGO (Hold grounded) |
| **Toggle Audio** | `M` | — | Sound Toggle Button |

---

## 🏛️ The 10 Realms: Themes & Difficulty

| Lvl | Arena Realm | Difficulty | Boss Guardian | Visual Atmosphere & Mechanics |
|:---:|:---|:---:|:---|:---|
| **1** | **Overgrown Moss Grotto** | `NOVICE` | **Grimmhorn** | Emerald flora, floating green spores. Generous telegraphs (~40f), telegraphed rush, and arcing thorns. |
| **2** | **Mantis Wind Cliffs** | `APPRENTICE` | **Kaelen** | Stormy twilight navy with windy drifting motes. Flash-dash strikes and returning boomerang scythes. |
| **3** | **Corrupted Soul Sanctum** | `ADEPT` | **Lord Malakar** | Deep amethyst halls with violet soul wisps. Deflectable homing soul orbs, vertical floor geysers, and teleport bursts. |
| **4** | **Crystalline Cavern** | `CHALLENGING` | **Titan Goliath** | Glowing cyan mines with crystal shards. Frontal shield guard (must pogo or dash behind), earth spikes, boulder toss. |
| **5** | **The Void Abyss** | `EXPERT` | **The Void Nemesis** | Pitch-black abyss with floating monochrome motes. Shadow dash strikes, void pogos, and 50% HP overdrive. |
| **6** | **Amber Royal Hive** | `MASTER` | **Queen Vespira** | Warm honeycomb wax arches and golden pollen. Tethered needle throws, explosive amber globes, and fast diagonal lunges. |
| **7** | **The Scarlet Pyre Tent** | `TORMENT` | **Troupe Master Ignis** | Crimson velvet & obsidian banners with rising sparks. Wave of 3 scarlet bats, creeping floor flame columns, and dive dashes. |
| **8** | **Sunken Abyssal Trench** | `NIGHTMARE` | **Mor'gath the Wyrm** | Deep sea teal and bio-luminescent oceanic spores. Floor-sweeping void laser (must pogo/jump), bidirectional tail quakes. |
| **9** | **Gilded Citadel Throne** | `INFERNAL` | **Regent Valerius** | Grand royal gold colonnades. 3-hit radiant greatsword combo, floating spectral swords, and a dangerous parry guard! |
| **10**| **SOLAR HELL** | `HELL` 🔥 | **Sovereign Lumina** | Scorching incandescent inferno with glowing lava fissures, heatwaves, and red embers. Relentless 7-needle rain, 3 fast homing sun flares, sweeping radiant beams, and passive solar needle cascades! |

---

## 🚀 How to Run

Simply open `index.html` in any modern web browser:

```bash
# Direct launch in default browser:
start C:\Users\rashm\.gemini\antigravity\scratch\hollow-knight-mini\index.html
```

Or run a local static server if preferred:
```bash
python -m http.server 8000 --directory C:\Users\rashm\.gemini\antigravity\scratch\hollow-knight-mini
```
