
(function() {
  'use strict';

  const BAYER_4X4 = [
    [ 0/16,  8/16,  2/16, 10/16],
    [12/16,  4/16, 14/16,  6/16],
    [ 3/16, 11/16,  1/16,  9/16],
    [15/16,  7/16, 13/16,  5/16]
  ];

  const PALETTES = {
    CYBERPUNK: {
      name: 'CYBERPUNK NEON',
      colors: [
        [10, 8, 20],     [24, 20, 48],    [64, 28, 96],
        [140, 32, 110],  [255, 0, 85],    [255, 80, 140],
        [0, 180, 216],   [0, 240, 255],   [16, 185, 129],
        [52, 211, 153],  [251, 191, 36],  [255, 230, 0],
        [244, 244, 245]
      ]
    },
    AMBER: {
      name: 'CRT AMBER',
      colors: [
        [8, 5, 0],    [30, 18, 0],  [75, 45, 0],
        [130, 78, 0], [190, 114, 0],[245, 150, 0],
        [255, 190, 40],[255, 235, 160]
      ]
    },
    GAMEBOY: {
      name: 'GAMEBOY GREEN',
      colors: [
        [15, 56, 15],  [48, 98, 48],
        [139, 172, 15],[155, 188, 15]
      ]
    },
    VOID: {
      name: 'VOID MONOCHROME',
      colors: [
        [10, 10, 12],  [35, 35, 40],   [75, 75, 85],
        [130, 130, 145],[195, 195, 210],[250, 250, 255]
      ]
    }
  };

  let activePaletteName = 'CYBERPUNK';
  const colorCache = new Map();

  function setActivePalette(name) {
    if (PALETTES[name]) {
      activePaletteName = name;
      colorCache.clear();
    }
  }

  function quantizeColorFast(r, g, b, x, y, paletteName = activePaletteName, ditherStrength = 0.22) {
    const ditherValue = BAYER_4X4[y & 3][x & 3] - 0.5;
    const offset = ditherValue * ditherStrength * 255;

    const dr = (r + offset + 0.5) | 0;
    const dg = (g + offset + 0.5) | 0;
    const db = (b + offset + 0.5) | 0;

    const cr = dr < 0 ? 0 : (dr > 255 ? 255 : dr);
    const cg = dg < 0 ? 0 : (dg > 255 ? 255 : dg);
    const cb = db < 0 ? 0 : (db > 255 ? 255 : db);

    const key = (cr << 16) | (cg << 8) | cb;
    let cached = colorCache.get(key);
    if (cached) return cached;

    const palette = PALETTES[paletteName].colors;
    let closest = palette[0];
    let minDistance = 1000000;

    for (let i = 0; i < palette.length; i++) {
      const c = palette[i];
      const dist = 0.3 * (cr - c[0]) * (cr - c[0]) + 0.59 * (cg - c[1]) * (cg - c[1]) + 0.11 * (cb - c[2]) * (cb - c[2]);
      if (dist < minDistance) {
        minDistance = dist;
        closest = c;
      }
    }

    colorCache.set(key, closest);
    return closest;
  }

  function fastRemove(arr, index) {
    const last = arr.pop();
    if (index < arr.length) {
      arr[index] = last;
    }
  }

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.musicGain = null;
      this.sfxGain = null;
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.35;

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.65;

        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.initialized = true;
        this.startBackgroundMusic();
      } catch (e) {
        console.warn("Audio Context init failed:", e);
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playPistol() {
      if (!this.initialized) return;
      this.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(480 + (Math.random() - 0.5) * 40, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    }

    playShotgun() {
      if (!this.initialized) return;
      this.resume();
      const bufferSize = (this.ctx.sampleRate * 0.18) | 0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.18);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start();
    }

    playLaser() {
      if (!this.initialized) return;
      this.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(950, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    }

    playCratePickup() {
      if (!this.initialized) return;
      this.resume();
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.45, now + idx * 0.04 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.04 + 0.14);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.14);
      });
    }

    playExplosion(pitchMultiplier = 1.0) {
      if (!this.initialized) return;
      this.resume();
      const bufferSize = (this.ctx.sampleRate * 0.3) | 0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 * pitchMultiplier, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start();
    }

    playCrowdRoar() {
      if (!this.initialized) return;
      this.resume();
      const bufferSize = (this.ctx.sampleRate * 0.5) | 0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);
      filter.Q.value = 1.2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start();
    }

    playAnnouncerVoice() {
      if (!this.initialized) return;
      this.resume();
      const now = this.ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        const freq = 130 + Math.random() * 90;
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.32, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.06);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.06);
      }
    }

    startBackgroundMusic() {
      if (!this.initialized) return;
      const bassline = [110, 110, 146.83, 110, 164.81, 130.81, 110, 123.47];
      let step = 0;

      setInterval(() => {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassline[step % bassline.length], now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 0.12);
        step++;
      }, 150);
    }
  }

  const soundEngine = new SoundEngine();

  const WEAPONS = {
    PISTOL: {
      id: 'PISTOL', name: 'DUAL PISTOLS', color: '#00f0ff',
      fireRate: 110, spread: 0.08, speed: 10, damage: 15,
      bulletsPerShot: 1, size: 3, recoil: 1.5,
      sound: () => soundEngine.playPistol()
    },
    SHOTGUN: {
      id: 'SHOTGUN', name: 'HEAVY SHOTGUN', color: '#ffe600',
      fireRate: 320, spread: 0.42, speed: 8.5, damage: 16,
      bulletsPerShot: 10, size: 2.5, recoil: 7, knockback: 4.5,
      sound: () => soundEngine.playShotgun()
    },
    PLASMA: {
      id: 'PLASMA', name: 'PLASMA RIFLE', color: '#ff0055',
      fireRate: 65, spread: 0.12, speed: 12, damage: 14,
      bulletsPerShot: 1, size: 4, recoil: 1, piercing: true,
      sound: () => soundEngine.playLaser()
    },
    RAILGUN: {
      id: 'RAILGUN', name: 'HYPER RAILGUN', color: '#00ff66',
      fireRate: 400, spread: 0.01, speed: 22, damage: 100,
      bulletsPerShot: 1, size: 4, recoil: 9, piercing: true, knockback: 6,
      sound: () => soundEngine.playLaser()
    },
    SAWBLADE: {
      id: 'SAWBLADE', name: 'BOUNCING SAW', color: '#a855f7',
      fireRate: 250, spread: 0.1, speed: 7.5, damage: 30,
      bulletsPerShot: 2, size: 6, bouncing: true, bouncesLeft: 6, recoil: 3, piercing: true,
      sound: () => soundEngine.playShotgun()
    },
    MISSILE: {
      id: 'MISSILE', name: 'MICRO MISSILE', color: '#ff9900',
      fireRate: 220, spread: 0.25, speed: 7.0, damage: 50,
      bulletsPerShot: 3, size: 5, explosive: true, recoil: 4, homing: true,
      sound: () => soundEngine.playPistol()
    },
    FLAMETHROWER: {
      id: 'FLAMETHROWER', name: 'FLAMETHROWER', color: '#ff3300',
      fireRate: 40, spread: 0.45, speed: 6.0, damage: 10,
      bulletsPerShot: 3, size: 5, recoil: 0.3, flame: true, piercing: true,
      sound: () => soundEngine.playLaser()
    }
  };

  class Bullet {
    constructor(x, y, vx, vy, weapon, isEnemy = false) {
      this.init(x, y, vx, vy, weapon, isEnemy);
    }

    init(x, y, vx, vy, weapon, isEnemy = false) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy;
      this.weapon = weapon;
      this.color = isEnemy ? '#ff0033' : weapon.color;
      this.size = weapon.size || 3;
      this.damage = weapon.damage || 10;
      this.piercing = weapon.piercing || false;
      this.bouncing = weapon.bouncing || false;
      this.bouncesLeft = weapon.bouncesLeft || 0;
      this.isEnemy = isEnemy;
      this.life = 0; this.maxLife = 120;
      this.dead = false;
    }

    update(arenaBounds, particles, dt, enemies) {
      if (this.weapon.homing && enemies && enemies.length > 0 && !this.isEnemy) {
        let closest = null;
        let minDist = 160;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          const d = Math.hypot(e.x - this.x, e.y - this.y);
          if (d < minDist) { minDist = d; closest = e; }
        }
        if (closest) {
          const targetAngle = Math.atan2(closest.y - this.y, closest.x - this.x);
          const currentAngle = Math.atan2(this.vy, this.vx);
          const newAngle = currentAngle + (targetAngle - currentAngle) * 0.14 * dt;
          const spd = Math.hypot(this.vx, this.vy);
          this.vx = Math.cos(newAngle) * spd;
          this.vy = Math.sin(newAngle) * spd;
        }
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life += dt;

      if (this.life >= this.maxLife) this.dead = true;

      if (this.x <= arenaBounds.x || this.x >= arenaBounds.x + arenaBounds.w) {
        if (this.bouncing && this.bouncesLeft > 0) {
          this.vx *= -1; this.bouncesLeft--;
        } else this.dead = true;
      }

      if (this.y <= arenaBounds.y || this.y >= arenaBounds.y + arenaBounds.h) {
        if (this.bouncing && this.bouncesLeft > 0) {
          this.vy *= -1; this.bouncesLeft--;
        } else this.dead = true;
      }

      if (Math.random() < 0.35 && particles) {
        particles.addParticle(this.x, this.y, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, this.color, 2, 10);
      }
    }

    draw(ctx) {
      ctx.fillStyle = this.color;
      ctx.fillRect((this.x - this.size / 2) | 0, (this.y - this.size / 2) | 0, this.size, this.size);
    }
  }

  class CrateManager {
    constructor(arenaBounds) {
      this.arenaBounds = arenaBounds;
      this.activeCrate = null;
      this.cratesCollected = 0;
    }

    spawnCrate() {
      const padding = 24;
      const x = this.arenaBounds.x + padding + Math.random() * (this.arenaBounds.w - padding * 2);
      const y = this.arenaBounds.y + padding + Math.random() * (this.arenaBounds.h - padding * 2);
      const isGolden = Math.random() < 0.2;

      this.activeCrate = {
        x, y,
        size: 14,
        bounceTimer: 0,
        pulse: 0,
        timerRing: 480,
        maxTimerRing: 480,
        isGolden
      };
    }

    update(player, particles, uiManager, dt, popups, triggerSlowMo) {
      if (!this.activeCrate) { this.spawnCrate(); return; }

      const crate = this.activeCrate;
      crate.bounceTimer += 0.08 * dt;
      crate.pulse = Math.sin(crate.bounceTimer) * 2.5;
      crate.timerRing -= dt;

      const dx = player.x - crate.x;
      const dy = player.y - crate.y;
      const dist = Math.hypot(dx, dy);

      if (dist < (player.size + crate.size) * 0.7) {
        this.cratesCollected++;
        soundEngine.playCratePickup();

        if (triggerSlowMo) triggerSlowMo(35);

        const weaponKeys = Object.keys(WEAPONS);
        let newKey = weaponKeys[(Math.random() * weaponKeys.length) | 0];
        if (weaponKeys.length > 1 && WEAPONS[newKey].id === player.currentWeapon.id) {
          const remaining = weaponKeys.filter(k => WEAPONS[k].id !== player.currentWeapon.id);
          newKey = remaining[(Math.random() * remaining.length) | 0];
        }

        const newWeapon = WEAPONS[newKey];
        player.equipWeapon(newWeapon);

        let scoreGain = 100 * player.comboMultiplier;
        if (crate.timerRing > 240) scoreGain += 50;

        if (uiManager) {
          uiManager.showBanner(`CRATE #${this.cratesCollected}: ${newWeapon.name}!`, 1200);
          uiManager.addScore(scoreGain);
        }

        if (popups) {
          popups.addPopup(crate.x, crate.y - 10, `+${scoreGain}`, crate.isGolden ? '#ffe600' : '#00f0ff');
        }

        if (particles) {
          const pColor = crate.isGolden ? '#ffe600' : '#00f0ff';
          for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const spd = 2 + Math.random() * 4.0;
            particles.addParticle(crate.x, crate.y, Math.cos(angle) * spd, Math.sin(angle) * spd, pColor, 3, 25);
          }
        }

        this.spawnCrate();
      }

      if (crate.timerRing <= 0) {
        this.spawnCrate();
      }
    }

    draw(ctx) {
      if (!this.activeCrate) return;
      const c = this.activeCrate;
      const drawY = c.y + c.pulse;
      const half = c.size / 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect((c.x - half) | 0, (c.y + half - 2) | 0, c.size, 4);

      ctx.fillStyle = c.isGolden ? '#ffe600' : '#ff9900';
      ctx.fillRect((c.x - half) | 0, (drawY - half) | 0, c.size, c.size);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(((c.x - half) | 0) + 0.5, ((drawY - half) | 0) + 0.5, c.size - 1, c.size - 1);

      ctx.fillStyle = '#ffffff';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.isGolden ? '★' : '?', (c.x) | 0, (drawY + 1) | 0);

      const ringPct = Math.max(0, c.timerRing / c.maxTimerRing);
      ctx.strokeStyle = c.isGolden ? '#ffe600' : '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc((c.x) | 0, (drawY) | 0, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringPct);
      ctx.stroke();
    }
  }

  class DebrisManager {
    constructor() {
      this.casings = [];
      this.corpses = [];
    }

    addCasing(x, y, angle) {
      const ejectAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      const spd = 1.8 + Math.random() * 2.0;
      this.casings.push({
        x, y,
        vx: Math.cos(ejectAngle) * spd,
        vy: Math.sin(ejectAngle) * spd,
        life: 240,
        color: '#ffe600'
      });
      if (this.casings.length > 150) this.casings.shift();
    }

    addCorpse(x, y, color, size) {
      this.corpses.push({
        x, y,
        size: size || 8,
        color,
        life: 360
      });
      if (this.corpses.length > 300) this.corpses.shift();
    }

    update(dt) {
      for (let i = this.casings.length - 1; i >= 0; i--) {
        const c = this.casings[i];
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vx *= Math.pow(0.85, dt);
        c.vy *= Math.pow(0.85, dt);
        c.life -= dt;
        if (c.life <= 0) fastRemove(this.casings, i);
      }
      for (let i = this.corpses.length - 1; i >= 0; i--) {
        const corpse = this.corpses[i];
        corpse.life -= dt;
        if (corpse.life <= 0) fastRemove(this.corpses, i);
      }
    }

    draw(ctx) {
      for (let i = 0; i < this.corpses.length; i++) {
        const corpse = this.corpses[i];
        ctx.fillStyle = corpse.color;
        ctx.globalAlpha = Math.max(0, corpse.life / 360) * 0.75;
        ctx.fillRect((corpse.x - corpse.size / 2) | 0, (corpse.y - corpse.size / 2) | 0, corpse.size, corpse.size - 2);
      }
      ctx.globalAlpha = 1.0;

      for (let i = 0; i < this.casings.length; i++) {
        const c = this.casings[i];
        ctx.fillStyle = c.color;
        ctx.globalAlpha = Math.max(0, c.life / 240);
        ctx.fillRect((c.x) | 0, (c.y) | 0, 2, 1);
      }
      ctx.globalAlpha = 1.0;
    }
  }

  class PopupManager {
    constructor() { this.popups = []; }
    addPopup(x, y, text, color = '#ffffff') {
      this.popups.push({ x, y, text, color, vy: -0.8, life: 45 });
    }
    update(dt) {
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const p = this.popups[i];
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) fastRemove(this.popups, i);
      }
    }
    draw(ctx) {
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      for (let i = 0; i < this.popups.length; i++) {
        const p = this.popups[i];
        const px = (p.x) | 0;
        const py = (p.y) | 0;
        ctx.fillStyle = '#000000';
        ctx.fillText(p.text, px + 1, py + 1);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, px, py);
      }
    }
  }

  class Player {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.size = 10;
      this.speed = 2.4;
      this.currentWeapon = WEAPONS.PISTOL;
      this.aimAngle = 0;
      this.lastShotTime = 0;
      this.hp = 100;
      this.maxHp = 100;
      this.invulnerableTimer = 0;
      this.comboMultiplier = 1;
      this.comboTimer = 0;
      this.killStreak = 0;

      this.isDashing = false;
      this.dashTimer = 0;
      this.dashCooldown = 0;
      this.dashVx = 0; this.dashVy = 0;
    }

    equipWeapon(w) { this.currentWeapon = w; }

    takeDamage(amount, particles) {
      if (this.invulnerableTimer > 0 || this.isDashing) return false;
      this.hp -= amount;
      this.invulnerableTimer = 35;
      this.comboMultiplier = 1;
      this.comboTimer = 0;

      if (particles) {
        for (let i = 0; i < 16; i++) {
          const ang = Math.random() * Math.PI * 2;
          particles.addParticle(this.x, this.y, Math.cos(ang) * 2.5, Math.sin(ang) * 2.5, '#ff0033', 2.5, 20);
        }
      }
      return true;
    }

    update(keys, mousePos, arenaBounds, bullets, particles, screenShake, dt, debris) {
      if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
      if (this.dashCooldown > 0) this.dashCooldown -= dt;

      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.comboMultiplier = 1;
          this.killStreak = 0;
        }
      }

      if (keys['Space'] || keys['ShiftLeft'] || keys['ShiftRight']) {
        if (!this.isDashing && this.dashCooldown <= 0) {
          let dx = 0, dy = 0;
          if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
          if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
          if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
          if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

          if (dx !== 0 || dy !== 0) {
            const mag = Math.hypot(dx, dy);
            this.dashVx = (dx / mag) * 5.8;
            this.dashVy = (dy / mag) * 5.8;
            this.isDashing = true;
            this.dashTimer = 10;
            this.dashCooldown = 35;
          }
        }
      }

      if (this.isDashing) {
        this.x += this.dashVx * dt; this.y += this.dashVy * dt;
        this.dashTimer -= dt;
        if (this.dashTimer <= 0) this.isDashing = false;
        if (particles && Math.random() < 0.6) {
          particles.addParticle(this.x, this.y, 0, 0, '#00f0ff', 3, 12);
        }
      } else {
        let moveX = 0, moveY = 0;
        if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

        if (moveX !== 0 && moveY !== 0) { moveX *= 0.7071; moveY *= 0.7071; }
        this.x += moveX * this.speed * dt;
        this.y += moveY * this.speed * dt;
      }

      const pad = this.size / 2;
      this.x = Math.max(arenaBounds.x + pad, Math.min(arenaBounds.x + arenaBounds.w - pad, this.x));
      this.y = Math.max(arenaBounds.y + pad, Math.min(arenaBounds.y + arenaBounds.h - pad, this.y));

      if (mousePos) {
        this.aimAngle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
      }

      const now = performance.now();
      if (mousePos && mousePos.isDown && now - this.lastShotTime >= this.currentWeapon.fireRate) {
        this.lastShotTime = now;
        this.fireWeapon(bullets, particles, screenShake, debris);
      }
    }

    fireWeapon(bullets, particles, screenShake, debris) {
      const w = this.currentWeapon;
      w.sound();
      if (screenShake && w.recoil > 2) screenShake.addShake(w.recoil * 0.8);

      if (w.recoil > 3) {
        this.x -= Math.cos(this.aimAngle) * (w.recoil * 0.3);
        this.y -= Math.sin(this.aimAngle) * (w.recoil * 0.3);
      }

      if (debris) {
        debris.addCasing(this.x, this.y, this.aimAngle);
      }

      const count = w.bulletsPerShot || 1;
      for (let i = 0; i < count; i++) {
        const spreadAngle = (Math.random() - 0.5) * w.spread;
        const finalAngle = this.aimAngle + spreadAngle;
        const vx = Math.cos(finalAngle) * w.speed;
        const vy = Math.sin(finalAngle) * w.speed;

        bullets.push(new Bullet(
          this.x + Math.cos(this.aimAngle) * 6,
          this.y + Math.sin(this.aimAngle) * 6,
          vx, vy, w, false
        ));

        if (particles) {
          particles.addParticle(
            this.x + Math.cos(this.aimAngle) * 8,
            this.y + Math.sin(this.aimAngle) * 8,
            vx * 0.2 + (Math.random() - 0.5),
            vy * 0.2 + (Math.random() - 0.5),
            w.color, 2.5, 10
          );
        }
      }
    }

    draw(ctx) {
      if (this.invulnerableTimer > 0 && (((this.invulnerableTimer / 3) | 0) % 2 === 0)) return;

      const half = this.size / 2;
      ctx.fillStyle = this.isDashing ? '#00f0ff' : '#ffe600';
      ctx.fillRect((this.x - half) | 0, (this.y - half) | 0, this.size, this.size);

      ctx.fillStyle = '#000000';
      const eyeX = this.x + Math.cos(this.aimAngle) * 3;
      const eyeY = this.y + Math.sin(this.aimAngle) * 3;
      ctx.fillRect((eyeX - 1.5) | 0, (eyeY - 1.5) | 0, 3, 3);

      ctx.strokeStyle = this.currentWeapon.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo((this.x) | 0, (this.y) | 0);
      ctx.lineTo(
        (this.x + Math.cos(this.aimAngle) * 10) | 0,
        (this.y + Math.sin(this.aimAngle) * 10) | 0
      );
      ctx.stroke();
    }
  }

  const ENEMY_TYPES = {
    SWARMER: { name: 'SWARMER BUG', hp: 14, speed: 1.9, size: 7, color: '#ff0055', scoreValue: 40, behavior: 'chase' },
    CHARGER: { name: 'CYBORG BULL', hp: 50, speed: 1.3, chargeSpeed: 4.5, size: 11, color: '#ff9900', scoreValue: 120, behavior: 'charge' },
    TURRET: { name: 'ARENA TURRET', hp: 35, speed: 0.5, size: 10, color: '#a855f7', scoreValue: 160, behavior: 'shoot' },
    TITAN: { name: 'MECHA TITAN', hp: 140, speed: 0.7, size: 15, color: '#00ff66', scoreValue: 350, behavior: 'heavy' },
    BOSS: { name: 'BROADCAST MEGABRAIN', hp: 700, speed: 0.6, size: 26, color: '#ffe600', scoreValue: 2000, behavior: 'boss' }
  };

  class Enemy {
    constructor(x, y, type) {
      this.x = x; this.y = y; this.type = type;
      this.hp = type.hp; this.maxHp = type.hp;
      this.speed = type.speed; this.size = type.size; this.color = type.color;
      this.dead = false;

      this.vx = 0;
      this.vy = 0;

      this.chargeTimer = 0; this.isCharging = false;
      this.chargeDirX = 0; this.chargeDirY = 0;
      this.shootTimer = 0; this.flashTimer = 0;
      this.squishX = 1; this.squishY = 1;
      this.age = 0;
      this.isEnraged = false;
    }

    takeDamage(amount, particles, screenShake, debris, popups, knockbackDirX = 0, knockbackDirY = 0, knockbackMag = 0) {
      this.hp -= amount;
      this.flashTimer = 5;
      this.squishX = 1.4; this.squishY = 0.6;

      if (knockbackMag > 0) {
        this.vx += knockbackDirX * knockbackMag;
        this.vy += knockbackDirY * knockbackMag;
      }

      if (popups) {
        popups.addPopup(this.x, this.y - 6, `-${amount}`, '#ff0055');
      }

      if (particles) {
        for (let i = 0; i < 5; i++) {
          const ang = Math.random() * Math.PI * 2;
          particles.addParticle(this.x, this.y, Math.cos(ang) * 2.0, Math.sin(ang) * 2.0, this.color, 2, 12);
        }
      }

      if (this.hp <= 0) {
        this.dead = true;
        soundEngine.playExplosion(this.type.behavior === 'boss' ? 0.5 : 1.1);
        if (screenShake) screenShake.addShake(this.type.behavior === 'boss' ? 14 : 3.5);

        if (debris) {
          debris.addCorpse(this.x, this.y, this.color, this.size);
        }

        if (particles) {
          for (let i = 0; i < 20; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 1 + Math.random() * 4.0;
            particles.addParticle(this.x, this.y, Math.cos(ang) * spd, Math.sin(ang) * spd, this.color, 3, 28);
          }
        }
      }
    }

    update(player, arenaBounds, enemyBullets, particles, dt, slowMoFactor = 1.0) {
      if (this.flashTimer > 0) this.flashTimer -= dt;
      this.squishX += (1 - this.squishX) * 0.2;
      this.squishY += (1 - this.squishY) * 0.2;

      const effectiveDt = dt * slowMoFactor;

      this.x += this.vx * effectiveDt;
      this.y += this.vy * effectiveDt;
      this.vx *= Math.pow(0.82, effectiveDt);
      this.vy *= Math.pow(0.82, effectiveDt);

      this.age += effectiveDt;
      if (!this.isEnraged && this.age > 450) {
        this.isEnraged = true;
        this.speed *= 2.2;
        this.color = '#ff0000';
      }

      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;

      switch (this.type.behavior) {
        case 'chase':
          this.x += (dx / dist) * this.speed * effectiveDt;
          this.y += (dy / dist) * this.speed * effectiveDt;
          break;

        case 'charge':
          if (!this.isCharging) {
            this.chargeTimer += effectiveDt;
            this.x += (dx / dist) * this.speed * effectiveDt;
            this.y += (dy / dist) * this.speed * effectiveDt;
            if (this.chargeTimer > 90 && dist < 140) {
              this.isCharging = true;
              this.chargeDirX = dx / dist; this.chargeDirY = dy / dist;
              this.chargeTimer = 0;
            }
          } else {
            this.x += this.chargeDirX * this.type.chargeSpeed * effectiveDt;
            this.y += this.chargeDirY * this.type.chargeSpeed * effectiveDt;
            this.chargeTimer += effectiveDt;
            if (this.chargeTimer > 35) { this.isCharging = false; this.chargeTimer = 0; }
          }
          break;

        case 'shoot':
          this.x += (dx / dist) * this.speed * effectiveDt;
          this.y += (dy / dist) * this.speed * effectiveDt;
          this.shootTimer += effectiveDt;
          if (this.shootTimer > 90) {
            this.shootTimer = 0;
            if (enemyBullets) {
              enemyBullets.push(new Bullet(this.x, this.y, (dx / dist) * 3, (dy / dist) * 3, { size: 4, damage: 15, color: '#ff0033' }, true));
            }
          }
          break;

        case 'heavy':
        case 'boss':
          this.x += (dx / dist) * this.speed * effectiveDt;
          this.y += (dy / dist) * this.speed * effectiveDt;
          this.shootTimer += effectiveDt;
          if (this.shootTimer > (this.type.behavior === 'boss' ? 45 : 120)) {
            this.shootTimer = 0;
            if (enemyBullets) {
              const shots = this.type.behavior === 'boss' ? 8 : 4;
              for (let i = 0; i < shots; i++) {
                const ang = (Math.PI * 2 * i) / shots + Math.atan2(dy, dx);
                enemyBullets.push(new Bullet(this.x, this.y, Math.cos(ang) * 2.5, Math.sin(ang) * 2.5, { size: 4, damage: 12, color: '#ff0033' }, true));
              }
            }
          }
          break;
      }

      const pad = this.size / 2;
      this.x = Math.max(arenaBounds.x + pad, Math.min(arenaBounds.x + arenaBounds.w - pad, this.x));
      this.y = Math.max(arenaBounds.y + pad, Math.min(arenaBounds.y + arenaBounds.h - pad, this.y));
    }

    draw(ctx) {
      const w = this.size * this.squishX;
      const h = this.size * this.squishY;

      ctx.fillStyle = this.flashTimer > 0 ? '#ffffff' : (this.isEnraged ? '#ff0000' : this.color);
      ctx.fillRect((this.x - w / 2) | 0, (this.y - h / 2) | 0, w | 0, h | 0);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(((this.x - w / 2) | 0) + 0.5, ((this.y - h / 2) | 0) + 0.5, (w - 1) | 0, (h - 1) | 0);
    }
  }

  class WaveManager {
    constructor(arenaBounds) {
      this.arenaBounds = arenaBounds;
      this.waveNumber = 1;
      this.waveActive = false;
      this.enemiesRemainingInWave = 0;
      this.spawnTimer = 0;
      this.spawnerDoors = [
        { x: arenaBounds.x + arenaBounds.w / 2, y: arenaBounds.y + 4 },
        { x: arenaBounds.x + arenaBounds.w / 2, y: arenaBounds.y + arenaBounds.h - 4 },
        { x: arenaBounds.x + 4, y: arenaBounds.y + arenaBounds.h / 2 },
        { x: arenaBounds.x + arenaBounds.w - 4, y: arenaBounds.y + arenaBounds.h / 2 }
      ];
    }

    startNextWave(uiManager) {
      this.waveActive = true;
      this.enemiesRemainingInWave = 20 + this.waveNumber * 12;

      if (uiManager) {
        soundEngine.playAnnouncerVoice();
        soundEngine.playCrowdRoar();
        const waveTitle = (this.waveNumber % 5 === 0) ? `WAVE ${this.waveNumber}: BOSS CARNAGE!` : `WAVE ${this.waveNumber} - MASSIVE SWARM!`;
        uiManager.showBanner(waveTitle, 2000);
      }
    }

    update(enemies, player, enemyBullets, particles, uiManager, dt) {
      if (!this.waveActive) return;
      this.spawnTimer += dt;

      if (this.enemiesRemainingInWave > 0 && this.spawnTimer >= Math.max(12, 40 - this.waveNumber * 3)) {
        this.spawnTimer = 0;

        const spawnClusterCount = Math.min(this.enemiesRemainingInWave, 2 + ((this.waveNumber / 2) | 0));
        const door = this.spawnerDoors[(Math.random() * this.spawnerDoors.length) | 0];

        for (let c = 0; c < spawnClusterCount; c++) {
          let type = ENEMY_TYPES.SWARMER;
          const r = Math.random();

          if (this.waveNumber % 5 === 0 && this.enemiesRemainingInWave === 1) type = ENEMY_TYPES.BOSS;
          else if (this.waveNumber >= 3 && r < 0.25) type = ENEMY_TYPES.CHARGER;
          else if (this.waveNumber >= 2 && r < 0.45) type = ENEMY_TYPES.TURRET;
          else if (this.waveNumber >= 4 && r < 0.6) type = ENEMY_TYPES.TITAN;

          const offsetX = (Math.random() - 0.5) * 16;
          const offsetY = (Math.random() - 0.5) * 16;
          enemies.push(new Enemy(door.x + offsetX, door.y + offsetY, type));
          this.enemiesRemainingInWave--;
        }

        if (particles) {
          for (let i = 0; i < 8; i++) {
            particles.addParticle(door.x, door.y, (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2.5, '#ff0055', 2, 15);
          }
        }
      }

      if (this.enemiesRemainingInWave === 0 && enemies.length === 0) {
        this.waveActive = false;
        this.waveNumber++;
        if (uiManager) {
          soundEngine.playCrowdRoar();
          uiManager.showBanner(`WAVE CLEAR! +1000 BONUS`, 2000);
          uiManager.addScore(1000);
        }
        setTimeout(() => this.startNextWave(uiManager), 2200);
      }
    }

    drawDoors(ctx) {
      for (let i = 0; i < this.spawnerDoors.length; i++) {
        const door = this.spawnerDoors[i];
        ctx.fillStyle = '#ff0055';
        ctx.fillRect((door.x - 8) | 0, (door.y - 8) | 0, 16, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect((door.x - 4) | 0, (door.y - 4) | 0, 8, 8);
      }
    }
  }

  class ScreenShake {
    constructor() { this.intensity = 0; this.offsetX = 0; this.offsetY = 0; }
    addShake(amount) { this.intensity = Math.min(18, this.intensity + amount); }
    update(dt) {
      if (this.intensity > 0.1) {
        this.offsetX = (Math.random() - 0.5) * this.intensity;
        this.offsetY = (Math.random() - 0.5) * this.intensity;
        this.intensity *= Math.pow(0.86, dt);
      } else { this.intensity = 0; this.offsetX = 0; this.offsetY = 0; }
    }
  }

  class ParticleSystem {
    constructor() { this.particles = []; }
    addParticle(x, y, vx, vy, color, size, life) {
      this.particles.push({ x, y, vx, vy, color, size, life, maxLife: life });
      if (this.particles.length > 250) fastRemove(this.particles, 0);
    }
    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= Math.pow(0.95, dt); p.vy *= Math.pow(0.95, dt);
        p.life -= dt;
        if (p.life <= 0) fastRemove(this.particles, i);
      }
    }
    draw(ctx) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillRect((p.x - p.size / 2) | 0, (p.y - p.size / 2) | 0, p.size, p.size);
      }
      ctx.globalAlpha = 1.0;
    }
  }

  class Renderer {
    constructor(width = 360, height = 240) {
      this.width = width; this.height = height;
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
      this.offCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
      this.offCtx.imageRendering = 'pixelated';
      this.ditherEnabled = true;
    }

    getContext() { return this.offCtx; }

    clear() {
      this.offCtx.fillStyle = '#05040a';
      this.offCtx.fillRect(0, 0, this.width, this.height);
    }

    drawArenaGrid(arenaBounds) {
      const ctx = this.offCtx;
      ctx.fillStyle = '#0a0814';
      ctx.fillRect(arenaBounds.x, arenaBounds.y, arenaBounds.w, arenaBounds.h);

      ctx.strokeStyle = '#18142a'; ctx.lineWidth = 1;
      for (let x = arenaBounds.x; x < arenaBounds.x + arenaBounds.w; x += 16) {
        ctx.beginPath(); ctx.moveTo(x, arenaBounds.y); ctx.lineTo(x, arenaBounds.y + arenaBounds.h); ctx.stroke();
      }
      for (let y = arenaBounds.y; y < arenaBounds.y + arenaBounds.h; y += 16) {
        ctx.beginPath(); ctx.moveTo(arenaBounds.x, y); ctx.lineTo(arenaBounds.x + arenaBounds.w, y); ctx.stroke();
      }

      ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 2;
      ctx.strokeRect(arenaBounds.x, arenaBounds.y, arenaBounds.w, arenaBounds.h);
    }

    drawDynamicLighting(lights) {
      const ctx = this.offCtx;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < lights.length; i++) {
        const l = lights[i];
        const rad = l.radius || 16;
        const grad = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, rad);
        grad.addColorStop(0, l.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(l.x, l.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    applyOrderedDithering() {
      if (!this.ditherEnabled) return;
      const imgData = this.offCtx.getImageData(0, 0, this.width, this.height);
      const data = imgData.data;

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const idx = (y * this.width + x) << 2;
          const quantized = quantizeColorFast(data[idx], data[idx + 1], data[idx + 2], x, y, activePaletteName, 0.22);
          data[idx] = quantized[0]; data[idx + 1] = quantized[1]; data[idx + 2] = quantized[2];
        }
      }
      this.offCtx.putImageData(imgData, 0, 0);
    }

    renderToScreen(screenCtx, mainWidth, mainHeight, screenShake) {
      screenCtx.save();
      screenCtx.clearRect(0, 0, mainWidth, mainHeight);
      screenCtx.imageSmoothingEnabled = false;
      if (screenShake) screenCtx.translate(screenShake.offsetX, screenShake.offsetY);
      screenCtx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height, 0, 0, mainWidth, mainHeight);
      screenCtx.restore();
    }
  }

  class UIManager {
    constructor() {
      this.score = 0;
      this.highScore = parseInt(localStorage.getItem('crate_arena_hi_score') || '0', 10);
      this.bannerElement = document.getElementById('broadcast-banner');
      this.bannerTimer = null;
    }

    addScore(amount) {
      this.score += amount;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('crate_arena_hi_score', this.highScore.toString());
      }
      this.updateHUD();
    }

    resetScore() { this.score = 0; this.updateHUD(); }

    showBanner(text, duration = 1800) {
      if (!this.bannerElement) return;
      if (this.bannerTimer) clearTimeout(this.bannerTimer);
      this.bannerElement.innerText = text;
      this.bannerElement.classList.add('active');
      this.bannerTimer = setTimeout(() => this.bannerElement.classList.remove('active'), duration);
    }

    updateHUD(player, waveManager, crateManager) {
      const elScore = document.getElementById('ui-score');
      const elHiScore = document.getElementById('ui-hiscore');
      const elCrates = document.getElementById('ui-crates');
      const elWeapon = document.getElementById('ui-weapon');
      const elHp = document.getElementById('ui-hp');
      const elWave = document.getElementById('ui-wave');

      if (elScore) elScore.innerText = this.score.toString().padStart(6, '0');
      if (elHiScore) elHiScore.innerText = this.highScore.toString().padStart(6, '0');
      if (elCrates && crateManager) elCrates.innerText = crateManager.cratesCollected;
      if (elWeapon && player) elWeapon.innerText = player.currentWeapon.name;
      if (elHp && player) elHp.innerText = `${Math.max(0, Math.ceil(player.hp))}%`;
      if (elWave && waveManager) elWave.innerText = `WAVE ${waveManager.waveNumber}`;
    }
  }

  const GAME_STATES = { TITLE: 'TITLE', PLAYING: 'PLAYING', PAUSED: 'PAUSED', GAMEOVER: 'GAMEOVER' };

  class Game {
    constructor() {
      this.state = GAME_STATES.TITLE;
      this.mainCanvas = document.getElementById('game-canvas');
      this.mainCtx = this.mainCanvas.getContext('2d');

      this.renderer = new Renderer(360, 240);
      this.arenaBounds = { x: 10, y: 10, w: 340, h: 220 };

      this.particles = new ParticleSystem();
      this.screenShake = new ScreenShake();
      this.uiManager = new UIManager();
      this.debrisManager = new DebrisManager();
      this.popupManager = new PopupManager();

      this.player = null;
      this.crateManager = null;
      this.waveManager = null;
      this.bullets = [];
      this.enemyBullets = [];
      this.enemies = [];

      this.keys = {};
      this.mousePos = { x: 180, y: 120, isDown: false };

      this.lastTime = performance.now();
      this.slowMoFrames = 0;

      this.bindEvents();
      this.setupUI();
      this.resizeCanvas();

      window.addEventListener('resize', () => this.resizeCanvas());
      requestAnimationFrame((time) => this.loop(time));
    }

    triggerSlowMo(frames = 35) {
      this.slowMoFrames = Math.max(this.slowMoFrames, frames);
    }

    resizeCanvas() {
      const wrapper = document.getElementById('canvas-wrapper');
      if (wrapper) {
        this.mainCanvas.width = wrapper.clientWidth;
        this.mainCanvas.height = wrapper.clientHeight;
      }
    }

    bindEvents() {
      window.addEventListener('keydown', (e) => {
        this.keys[e.code] = true;

        if ((this.state === 'TITLE' || this.state === 'GAMEOVER' || (typeof GAME_STATES !== 'undefined' && (this.state === GAME_STATES.TITLE || this.state === GAME_STATES.GAMEOVER))) && (e.code === 'Space' || e.code === 'Enter')) {
          this.startGame();
        }
        if (e.code === 'KeyQ' && window.parent !== window) window.parent.postMessage('NAV_PREV', '*');
        if (e.code === 'KeyE' && window.parent !== window) window.parent.postMessage('NAV_NEXT', '*');

        if (e.code === 'KeyP' && this.state === GAME_STATES.PLAYING) {
          this.togglePause();
        }

        if (this.state === GAME_STATES.GAMEOVER && (e.code === 'Space' || e.code === 'KeyR')) {
          this.startGame();
        }
      });

      window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

      this.mainCanvas.addEventListener('mousemove', (e) => {
        const rect = this.mainCanvas.getBoundingClientRect();
        const scaleX = this.renderer.width / rect.width;
        const scaleY = this.renderer.height / rect.height;
        this.mousePos.x = (e.clientX - rect.left) * scaleX;
        this.mousePos.y = (e.clientY - rect.top) * scaleY;
      });

      this.mainCanvas.addEventListener('mousedown', (e) => {
        soundEngine.init();
        if (e.button === 0) {
          this.mousePos.isDown = true;
          if (this.state === GAME_STATES.GAMEOVER) {
            this.startGame();
          }
        }
      });

      window.addEventListener('mouseup', (e) => {
        if (e.button === 0) this.mousePos.isDown = false;
      });
    }

    setupUI() {
      document.getElementById('btn-start')?.addEventListener('click', () => this.startGame());
      document.getElementById('btn-restart')?.addEventListener('click', () => this.startGame());
      document.getElementById('btn-resume')?.addEventListener('click', () => this.togglePause());

      document.querySelectorAll('.palette-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          setActivePalette(e.target.getAttribute('data-palette'));
        });
      });
    }

    startGame() {
      soundEngine.init();
      this.player = new Player(180, 120);
      this.crateManager = new CrateManager(this.arenaBounds);
      this.waveManager = new WaveManager(this.arenaBounds);
      this.bullets.length = 0;
      this.enemyBullets.length = 0;
      this.enemies.length = 0;
      this.particles = new ParticleSystem();
      this.debrisManager = new DebrisManager();
      this.popupManager = new PopupManager();
      this.uiManager.resetScore();
      this.slowMoFrames = 0;

      document.getElementById('screen-title')?.classList.add('hidden');
      document.getElementById('screen-gameover')?.classList.add('hidden');
      document.getElementById('screen-pause')?.classList.add('hidden');

      this.state = GAME_STATES.PLAYING;
      this.waveManager.startNextWave(this.uiManager);
      this.lastTime = performance.now();
    }

    togglePause() {
      if (this.state === GAME_STATES.PLAYING) {
        this.state = GAME_STATES.PAUSED;
        document.getElementById('screen-pause')?.classList.remove('hidden');
      } else if (this.state === GAME_STATES.PAUSED) {
        this.state = GAME_STATES.PLAYING;
        document.getElementById('screen-pause')?.classList.add('hidden');
        this.lastTime = performance.now();
      }
    }

    gameOver() {
      this.state = GAME_STATES.GAMEOVER;
      soundEngine.playExplosion();
      soundEngine.playAnnouncerVoice();

      document.getElementById('final-score').innerText = this.uiManager.score;
      document.getElementById('final-crates').innerText = this.crateManager.cratesCollected;
      document.getElementById('screen-gameover')?.classList.remove('hidden');
    }

    update(dt) {
      if (this.state !== GAME_STATES.PLAYING) return;

      let enemySlowMoFactor = 1.0;
      if (this.slowMoFrames > 0) {
        this.slowMoFrames -= dt;
        enemySlowMoFactor = 0.3;
      }

      this.screenShake.update(dt);
      this.particles.update(dt);
      this.debrisManager.update(dt);
      this.popupManager.update(dt);

      this.player.update(this.keys, this.mousePos, this.arenaBounds, this.bullets, this.particles, this.screenShake, dt, this.debrisManager);
      if (this.player.hp <= 0) { this.gameOver(); return; }

      this.crateManager.update(this.player, this.particles, this.uiManager, dt, this.popupManager, (f) => this.triggerSlowMo(f));
      this.waveManager.update(this.enemies, this.player, this.enemyBullets, this.particles, this.uiManager, dt);

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.update(this.arenaBounds, this.particles, dt, this.enemies);

        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          const dist = Math.hypot(b.x - e.x, b.y - e.y);

          if (dist < (b.size + e.size) * 0.6) {
            const kbAngle = Math.atan2(e.y - b.y, e.x - b.x);
            const kbMag = b.weapon.knockback || 2.5;

            e.takeDamage(
              b.damage,
              this.particles,
              this.screenShake,
              this.debrisManager,
              this.popupManager,
              Math.cos(kbAngle),
              Math.sin(kbAngle),
              kbMag
            );

            if (!b.piercing) b.dead = true;

            if (e.dead) {
              this.player.killStreak++;
              this.player.comboTimer = 120;
              this.player.comboMultiplier = Math.min(5, 1 + ((this.player.killStreak / 4) | 0));

              const addedScore = e.type.scoreValue * this.player.comboMultiplier;
              this.uiManager.addScore(addedScore);

              this.popupManager.addPopup(e.x, e.y - 12, `+${addedScore}`, '#00ff66');

              if (this.player.killStreak % 5 === 0) {
                soundEngine.playCrowdRoar();
                this.uiManager.showBanner(`RAMPAGE! ${this.player.comboMultiplier}X MULTIPLIER!`, 1200);
              }

              fastRemove(this.enemies, j);
            }
            break;
          }
        }
        if (b.dead) fastRemove(this.bullets, i);
      }

      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const eb = this.enemyBullets[i];
        eb.update(this.arenaBounds, this.particles, dt, null);

        const dist = Math.hypot(eb.x - this.player.x, eb.y - this.player.y);
        if (dist < (eb.size + this.player.size) * 0.6) {
          if (this.player.takeDamage(eb.damage, this.particles)) {
            this.screenShake.addShake(6);
            soundEngine.playExplosion();
          }
          eb.dead = true;
        }
        if (eb.dead) fastRemove(this.enemyBullets, i);
      }

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        e.update(this.player, this.arenaBounds, this.enemyBullets, this.particles, dt, enemySlowMoFactor);

        const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (dist < (e.size + this.player.size) * 0.6) {
          if (this.player.takeDamage(15, this.particles)) {
            this.screenShake.addShake(8);
            soundEngine.playExplosion();
          }
        }
      }

      this.uiManager.updateHUD(this.player, this.waveManager, this.crateManager);
    }

    render() {
      const offCtx = this.renderer.getContext();
      this.renderer.clear();

      this.renderer.drawArenaGrid(this.arenaBounds);

      this.debrisManager.draw(offCtx);

      if (this.waveManager) this.waveManager.drawDoors(offCtx);
      if (this.crateManager) this.crateManager.draw(offCtx);

      if (this.player && this.state === GAME_STATES.PLAYING) {
        offCtx.strokeStyle = 'rgba(255, 0, 85, 0.25)';
        offCtx.lineWidth = 1;
        offCtx.beginPath();
        offCtx.moveTo((this.player.x) | 0, (this.player.y) | 0);
        offCtx.lineTo((this.mousePos.x) | 0, (this.mousePos.y) | 0);
        offCtx.stroke();
      }

      for (let i = 0; i < this.enemies.length; i++) this.enemies[i].draw(offCtx);
      for (let i = 0; i < this.bullets.length; i++) this.bullets[i].draw(offCtx);
      for (let i = 0; i < this.enemyBullets.length; i++) this.enemyBullets[i].draw(offCtx);
      if (this.player && (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED)) {
        this.player.draw(offCtx);
      }

      this.particles.draw(offCtx);
      this.popupManager.draw(offCtx);

      const lights = [];
      if (this.player) lights.push({ x: this.player.x, y: this.player.y, radius: 24, color: 'rgba(0, 240, 255, 0.25)' });
      if (this.crateManager && this.crateManager.activeCrate) {
        const c = this.crateManager.activeCrate;
        lights.push({ x: c.x, y: c.y, radius: 22, color: c.isGolden ? 'rgba(255, 230, 0, 0.4)' : 'rgba(0, 240, 255, 0.3)' });
      }
      for (let i = 0; i < this.bullets.length; i++) {
        const b = this.bullets[i];
        lights.push({ x: b.x, y: b.y, radius: 10, color: 'rgba(255, 255, 255, 0.2)' });
      }
      for (let i = 0; i < this.enemyBullets.length; i++) {
        const eb = this.enemyBullets[i];
        lights.push({ x: eb.x, y: eb.y, radius: 12, color: 'rgba(255, 0, 85, 0.35)' });
      }
      this.renderer.drawDynamicLighting(lights);

      if (this.state === GAME_STATES.PLAYING) {
        offCtx.strokeStyle = '#00f0ff';
        offCtx.lineWidth = 1;
        const cx = (this.mousePos.x) | 0;
        const cy = (this.mousePos.y) | 0;
        offCtx.strokeRect(cx - 3, cy - 3, 6, 6);
      }

      this.renderer.applyOrderedDithering();
      this.renderer.renderToScreen(this.mainCtx, this.mainCanvas.width, this.mainCanvas.height, this.screenShake);
    }

    loop(currentTime) {
      const elapsedSeconds = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      const dt = Math.min(elapsedSeconds * 60, 3.0);

      this.update(dt);
      this.render();
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    new Game();
  });
})();