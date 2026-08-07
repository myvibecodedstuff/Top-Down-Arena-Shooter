
(function() {
  'use strict';

  const BAYER_4X4 = [
    [ 0/16,  8/16,  2/16, 10/16],
    [12/16,  4/16, 14/16,  6/16],
    [ 3/16, 11/16,  1/16,  9/16],
    [15/16,  7/16, 13/16,  5/16]
  ];

  const 16-Bit Console_PALETTE = [
    [12, 10, 20],
    [26, 20, 42],
    [54, 40, 80],
    [98, 30, 85],
    [228, 16, 80],
    [255, 90, 140],
    [0, 168, 204],
    [0, 230, 255],
    [20, 220, 140],
    [240, 170, 0],
    [255, 220, 40],
    [255, 110, 0],
    [130, 80, 220],
    [180, 185, 200],
    [220, 225, 240],
    [255, 255, 255]
  ];

  const colorCache = new Map();

  function quantizeColorFast(r, g, b, x, y, ditherStrength = 0.20) {
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

    let closest = 16-Bit Console_PALETTE[0];
    let minDistance = 1000000;

    for (let i = 0; i < 16-Bit Console_PALETTE.length; i++) {
      const c = 16-Bit Console_PALETTE[i];
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
      osc.frequency.setValueAtTime(440 + (Math.random() - 0.5) * 30, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.07);
    }

    playShotgun() {
      if (!this.initialized) return;
      this.resume();
      const bufferSize = (this.ctx.sampleRate * 0.16) | 0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.16);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);

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
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.10);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.10);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.10);
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
      const bufferSize = (this.ctx.sampleRate * 0.28) | 0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750 * pitchMultiplier, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.28);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start();
    }

    playCrowdRoar() {
      if (!this.initialized) return;
      this.resume();
      const bufferSize = (this.ctx.sampleRate * 0.45) | 0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      filter.Q.value = 1.2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.10);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

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
        filter.frequency.setValueAtTime(400, now);

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
      fireRate: 110, spread: 0.08, speed: 9.0, damage: 15,
      bulletsPerShot: 1, size: 3, recoil: 1.5,
      sound: () => soundEngine.playPistol()
    },
    SHOTGUN: {
      id: 'SHOTGUN', name: 'HEAVY SHOTGUN', color: '#f0a000',
      fireRate: 320, spread: 0.42, speed: 7.5, damage: 16,
      bulletsPerShot: 10, size: 2.5, recoil: 7, knockback: 4.5,
      sound: () => soundEngine.playShotgun()
    },
    PLASMA: {
      id: 'PLASMA', name: 'PLASMA RIFLE', color: '#e41050',
      fireRate: 65, spread: 0.12, speed: 11.0, damage: 14,
      bulletsPerShot: 1, size: 4, recoil: 1, piercing: true,
      sound: () => soundEngine.playLaser()
    },
    RAILGUN: {
      id: 'RAILGUN', name: 'HYPER RAILGUN', color: '#14dc8c',
      fireRate: 400, spread: 0.01, speed: 20.0, damage: 100,
      bulletsPerShot: 1, size: 4, recoil: 9, piercing: true, knockback: 6,
      sound: () => soundEngine.playLaser()
    },
    SAWBLADE: {
      id: 'SAWBLADE', name: 'BOUNCING SAW', color: '#8250dc',
      fireRate: 250, spread: 0.1, speed: 7.0, damage: 30,
      bulletsPerShot: 2, size: 6, bouncing: true, bouncesLeft: 6, recoil: 3, piercing: true,
      sound: () => soundEngine.playShotgun()
    },
    MISSILE: {
      id: 'MISSILE', name: 'MICRO MISSILE', color: '#ff6e00',
      fireRate: 220, spread: 0.25, speed: 6.5, damage: 50,
      bulletsPerShot: 3, size: 5, explosive: true, recoil: 4, homing: true,
      sound: () => soundEngine.playPistol()
    },
    FLAMETHROWER: {
      id: 'FLAMETHROWER', name: 'FLAMETHROWER', color: '#ff3300',
      fireRate: 40, spread: 0.45, speed: 5.5, damage: 10,
      bulletsPerShot: 3, size: 5, recoil: 0.3, flame: true, piercing: true,
      sound: () => soundEngine.playLaser()
    }
  };

  class Bullet {
    constructor(x, y, vx, vy, weapon, isEnemy = false) {
      this.x = x; this.y = y;
      this.vx = vx; this.vy = vy;
      this.weapon = weapon;
      this.color = isEnemy ? '#e41050' : weapon.color;
      this.size = weapon.size || 3;
      this.damage = weapon.damage || 10;
      this.piercing = weapon.piercing || false;
      this.bouncing = weapon.bouncing || false;
      this.bouncesLeft = weapon.bouncesLeft || 0;
      this.isEnemy = isEnemy;
      this.lifeFrames = 0; this.maxLifeFrames = 120;
      this.dead = false;
    }

    update(arenaBounds, particles, enemies) {
      if (this.weapon.homing && enemies && enemies.length > 0 && !this.isEnemy) {
        let closest = null;
        let minDistSq = 140 * 140;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          const dSq = (e.x - this.x) * (e.x - this.x) + (e.y - this.y) * (e.y - this.y);
          if (dSq < minDistSq) { minDistSq = dSq; closest = e; }
        }
        if (closest) {
          const targetAngle = Math.atan2(closest.y - this.y, closest.x - this.x);
          const currentAngle = Math.atan2(this.vy, this.vx);
          const newAngle = currentAngle + (targetAngle - currentAngle) * 0.14;
          const spd = Math.hypot(this.vx, this.vy);
          this.vx = Math.cos(newAngle) * spd;
          this.vy = Math.sin(newAngle) * spd;
        }
      }

      this.x += this.vx;
      this.y += this.vy;
      this.lifeFrames++;

      if (this.lifeFrames >= this.maxLifeFrames) this.dead = true;

      const px = Math.floor(this.x);
      const py = Math.floor(this.y);

      if (px <= arenaBounds.x || px >= arenaBounds.x + arenaBounds.w) {
        if (this.bouncing && this.bouncesLeft > 0) {
          this.vx *= -1; this.bouncesLeft--;
        } else this.dead = true;
      }

      if (py <= arenaBounds.y || py >= arenaBounds.y + arenaBounds.h) {
        if (this.bouncing && this.bouncesLeft > 0) {
          this.vy *= -1; this.bouncesLeft--;
        } else this.dead = true;
      }

      if (Math.random() < 0.35 && particles) {
        particles.addParticle(px, py, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, this.color, 2, 10);
      }
    }

    draw(ctx) {
      const px = Math.floor(this.x);
      const py = Math.floor(this.y);
      const sz = Math.floor(this.size);
      ctx.fillStyle = this.color;
      ctx.fillRect(px - (sz >> 1), py - (sz >> 1), sz, sz);
    }
  }

  class CrateManager {
    constructor(arenaBounds) {
      this.arenaBounds = arenaBounds;
      this.activeCrate = null;
      this.cratesCollected = 0;
    }

    spawnCrate() {
      const padding = 20;
      const x = Math.floor(this.arenaBounds.x + padding + Math.random() * (this.arenaBounds.w - padding * 2));
      const y = Math.floor(this.arenaBounds.y + padding + Math.random() * (this.arenaBounds.h - padding * 2));
      const isGolden = Math.random() < 0.2;

      this.activeCrate = {
        x, y,
        size: 12,
        frameTimer: 0,
        pulseY: 0,
        timerRingFrames: 480,
        maxTimerRingFrames: 480,
        isGolden
      };
    }

    update(player, particles, uiManager, popups, triggerSlowMo) {
      if (!this.activeCrate) { this.spawnCrate(); return; }

      const crate = this.activeCrate;
      crate.frameTimer++;
      crate.pulseY = Math.floor(Math.sin(crate.frameTimer * 0.08) * 2.0);
      crate.timerRingFrames--;

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
        if (crate.timerRingFrames > 240) scoreGain += 50;

        if (uiManager) {
          uiManager.showBanner(`CRATE #${this.cratesCollected}: ${newWeapon.name}!`, 1200);
          uiManager.addScore(scoreGain);
        }

        if (popups) {
          popups.addPopup(crate.x, crate.y - 10, `+${scoreGain}`, crate.isGolden ? '#ffdc28' : '#00e6ff');
        }

        if (particles) {
          const pColor = crate.isGolden ? '#f0a000' : '#00e6ff';
          for (let i = 0; i < 28; i++) {
            const angle = (Math.PI * 2 * i) / 28;
            const spd = 2 + Math.random() * 3.5;
            particles.addParticle(crate.x, crate.y, Math.cos(angle) * spd, Math.sin(angle) * spd, pColor, 2, 22);
          }
        }

        this.spawnCrate();
      }

      if (crate.timerRingFrames <= 0) {
        this.spawnCrate();
      }
    }

    draw(ctx) {
      if (!this.activeCrate) return;
      const c = this.activeCrate;
      const cx = Math.floor(c.x);
      const cy = Math.floor(c.y);
      const drawY = Math.floor(c.y + c.pulseY);
      const half = c.size >> 1;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(cx - half, cy + half - 1, c.size, 3);

      ctx.fillStyle = c.isGolden ? '#f0a000' : '#9c5020';
      ctx.fillRect(cx - half, drawY - half, c.size, c.size);

      ctx.fillStyle = c.isGolden ? '#ffdc28' : '#e08030';
      ctx.fillRect(cx - half + 1, drawY - half + 1, c.size - 2, 1);
      ctx.fillRect(cx - half + 1, drawY - half + 1, 1, c.size - 2);

      ctx.fillStyle = '#000000';
      ctx.fillRect(cx - half + 2, drawY - half + 2, 2, 2);
      ctx.fillRect(cx + half - 4, drawY - half + 2, 2, 2);
      ctx.fillRect(cx - half + 2, drawY + half - 4, 2, 2);
      ctx.fillRect(cx + half - 4, drawY + half - 4, 2, 2);

      ctx.fillStyle = '#ffffff';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.isGolden ? '★' : '?', cx, drawY + 1);

      const ringPct = Math.max(0, c.timerRingFrames / c.maxTimerRingFrames);
      ctx.strokeStyle = c.isGolden ? '#ffdc28' : '#00e6ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, drawY, 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringPct);
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
        x: Math.floor(x),
        y: Math.floor(y),
        vx: Math.cos(ejectAngle) * spd,
        vy: Math.sin(ejectAngle) * spd,
        lifeFrames: 240,
        color: '#b4b9c8'
      });
      if (this.casings.length > 150) this.casings.shift();
    }

    addCorpse(x, y, color, size) {
      this.corpses.push({
        x: Math.floor(x),
        y: Math.floor(y),
        size: size || 8,
        color,
        lifeFrames: 360
      });
      if (this.corpses.length > 300) this.corpses.shift();
    }

    update() {
      for (let i = this.casings.length - 1; i >= 0; i--) {
        const c = this.casings[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vx *= 0.85;
        c.vy *= 0.85;
        c.lifeFrames--;
        if (c.lifeFrames <= 0) fastRemove(this.casings, i);
      }
      for (let i = 0; i < this.corpses.length; i++) {
        const corpse = this.corpses[i];
        corpse.lifeFrames--;
        if (corpse.lifeFrames <= 0) fastRemove(this.corpses, i);
      }
    }

    draw(ctx) {
      for (let i = 0; i < this.corpses.length; i++) {
        const corpse = this.corpses[i];
        const cz = corpse.size;
        ctx.fillStyle = corpse.color;
        ctx.globalAlpha = Math.max(0, corpse.lifeFrames / 360) * 0.75;
        ctx.fillRect(corpse.x - (cz >> 1), corpse.y - (cz >> 1), cz, cz - 2);
      }
      ctx.globalAlpha = 1.0;

      for (let i = 0; i < this.casings.length; i++) {
        const c = this.casings[i];
        ctx.fillStyle = c.color;
        ctx.globalAlpha = Math.max(0, c.lifeFrames / 240);
        ctx.fillRect(Math.floor(c.x), Math.floor(c.y), 2, 1);
      }
      ctx.globalAlpha = 1.0;
    }
  }

  class PopupManager {
    constructor() { this.popups = []; }

    addPopup(x, y, text, color = '#ffffff') {
      this.popups.push({
        x: Math.floor(x),
        y: Math.floor(y),
        frameTickCounter: 0,
        text,
        color,
        lifeFrames: 45
      });
    }

    update() {
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const p = this.popups[i];
        p.frameTickCounter++;

        if ((p.frameTickCounter % 3) === 0) {
          p.y -= 1;
        }

        p.lifeFrames--;
        if (p.lifeFrames <= 0) fastRemove(this.popups, i);
      }
    }

    draw(ctx) {
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      for (let i = 0; i < this.popups.length; i++) {
        const p = this.popups[i];
        const px = Math.floor(p.x);
        const py = Math.floor(p.y);

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
      this.speed = 2.2;
      this.currentWeapon = WEAPONS.PISTOL;
      this.aimAngle = 0;
      this.lastShotTime = 0;
      this.hp = 100;
      this.maxHp = 100;
      this.invulnerableFrames = 0;
      this.comboMultiplier = 1;
      this.comboFrames = 0;
      this.killStreak = 0;

      this.isDashing = false;
      this.dashFrames = 0;
      this.dashCooldownFrames = 0;
      this.dashVx = 0; this.dashVy = 0;
    }

    equipWeapon(w) { this.currentWeapon = w; }

    takeDamage(amount, particles) {
      if (this.invulnerableFrames > 0 || this.isDashing) return false;
      this.hp -= amount;
      this.invulnerableFrames = 35;
      this.comboMultiplier = 1;
      this.comboFrames = 0;

      if (particles) {
        for (let i = 0; i < 16; i++) {
          const ang = Math.random() * Math.PI * 2;
          particles.addParticle(this.x, this.y, Math.cos(ang) * 2.5, Math.sin(ang) * 2.5, '#e41050', 2.5, 20);
        }
      }
      return true;
    }

    update(keys, mousePos, arenaBounds, bullets, particles, screenShake, debris) {
      if (this.invulnerableFrames > 0) this.invulnerableFrames--;
      if (this.dashCooldownFrames > 0) this.dashCooldownFrames--;

      if (this.comboFrames > 0) {
        this.comboFrames--;
        if (this.comboFrames <= 0) {
          this.comboMultiplier = 1;
          this.killStreak = 0;
        }
      }

      if (keys['Space'] || keys['ShiftLeft'] || keys['ShiftRight']) {
        if (!this.isDashing && this.dashCooldownFrames <= 0) {
          let dx = 0, dy = 0;
          if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
          if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
          if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
          if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

          if (dx !== 0 || dy !== 0) {
            const mag = Math.hypot(dx, dy);
            this.dashVx = (dx / mag) * 5.4;
            this.dashVy = (dy / mag) * 5.4;
            this.isDashing = true;
            this.dashFrames = 10;
            this.dashCooldownFrames = 35;
          }
        }
      }

      if (this.isDashing) {
        this.x += this.dashVx; this.y += this.dashVy;
        this.dashFrames--;
        if (this.dashFrames <= 0) this.isDashing = false;
        if (particles && Math.random() < 0.6) {
          particles.addParticle(this.x, this.y, 0, 0, '#00e6ff', 3, 12);
        }
      } else {
        let moveX = 0, moveY = 0;
        if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

        if (moveX !== 0 && moveY !== 0) { moveX *= 0.7071; moveY *= 0.7071; }

        this.x += moveX * this.speed;
        this.y += moveY * this.speed;
      }

      const pad = this.size / 2;
      this.x = Math.max(arenaBounds.x + pad, Math.min(arenaBounds.x + arenaBounds.w - pad, this.x));
      this.y = Math.max(arenaBounds.y + pad, Math.min(arenaBounds.y + arenaBounds.h - pad, this.y));

      if (mousePos) {
        const dx = mousePos.x - this.x;
        const dy = mousePos.y - this.y;
        this.aimAngle = Math.atan2(dy, dx);
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
            vx * 0.2, vy * 0.2,
            w.color, 2, 10
          );
        }
      }
    }

    draw(ctx) {
      if (this.invulnerableFrames > 0 && (((this.invulnerableFrames / 3) | 0) % 2 === 0)) return;

      const px = Math.floor(this.x);
      const py = Math.floor(this.y);

      ctx.fillStyle = this.isDashing ? '#00e6ff' : '#dc9600';
      ctx.fillRect(px - 4, py - 4, 8, 8);

      ctx.fillStyle = '#ffdc28';
      ctx.fillRect(px - 2, py - 2, 4, 4);

      ctx.fillStyle = '#00e6ff';
      const eyeX = Math.floor(this.x + Math.cos(this.aimAngle) * 3);
      const eyeY = Math.floor(this.y + Math.sin(this.aimAngle) * 3);
      ctx.fillRect(eyeX - 1, eyeY - 1, 3, 2);

      ctx.fillStyle = this.currentWeapon.color;
      ctx.fillRect(
        Math.floor(this.x + Math.cos(this.aimAngle) * 4) - 1,
        Math.floor(this.y + Math.sin(this.aimAngle) * 4) - 1,
        3, 3
      );
    }
  }

  const ENEMY_TYPES = {
    SWARMER: { name: 'SWARMER BUG', hp: 14, speed: 1.9, size: 7, color: '#e41050', scoreValue: 40, behavior: 'chase' },
    CHARGER: { name: 'CYBORG BULL', hp: 50, speed: 1.3, chargeSpeed: 4.5, size: 11, color: '#ff6e00', scoreValue: 120, behavior: 'charge' },
    TURRET: { name: 'ARENA TURRET', hp: 35, speed: 0.5, size: 10, color: '#8250dc', scoreValue: 160, behavior: 'shoot' },
    TITAN: { name: 'MECHA TITAN', hp: 140, speed: 0.7, size: 15, color: '#14dc8c', scoreValue: 350, behavior: 'heavy' },
    BOSS: { name: 'BROADCAST MEGABRAIN', hp: 700, speed: 0.6, size: 26, color: '#ffdc28', scoreValue: 2000, behavior: 'boss' }
  };

  class Enemy {
    constructor(x, y, type) {
      this.x = x; this.y = y; this.type = type;
      this.hp = type.hp; this.maxHp = type.hp;
      this.speed = type.speed; this.size = type.size; this.color = type.color;
      this.dead = false;

      this.vx = 0;
      this.vy = 0;

      this.chargeFrames = 0; this.isCharging = false;
      this.chargeDirX = 0; this.chargeDirY = 0;
      this.shootFrames = 0; this.flashFrames = 0;
      this.ageFrames = 0;
      this.isEnraged = false;
    }

    takeDamage(amount, particles, screenShake, debris, popups, knockbackDirX = 0, knockbackDirY = 0, knockbackMag = 0) {
      this.hp -= amount;
      this.flashFrames = 5;

      if (knockbackMag > 0) {
        this.vx += knockbackDirX * knockbackMag;
        this.vy += knockbackDirY * knockbackMag;
      }

      if (popups) {
        popups.addPopup(this.x, this.y - 6, `-${amount}`, '#e41050');
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
            particles.addParticle(this.x, this.y, Math.cos(ang) * spd, Math.sin(ang) * spd, this.color, 2, 24);
          }
        }
      }
    }

    update(player, arenaBounds, enemyBullets, particles, slowMoFactor = 1.0) {
      if (this.flashFrames > 0) this.flashFrames--;

      const effectiveSpeed = this.speed * slowMoFactor;

      this.x += this.vx * slowMoFactor;
      this.y += this.vy * slowMoFactor;
      this.vx *= 0.82;
      this.vy *= 0.82;

      this.ageFrames++;
      if (!this.isEnraged && this.ageFrames > 450) {
        this.isEnraged = true;
        this.speed *= 2.2;
        this.color = '#e41050';
      }

      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;

      switch (this.type.behavior) {
        case 'chase':
          this.x += (dx / dist) * effectiveSpeed;
          this.y += (dy / dist) * effectiveSpeed;
          break;

        case 'charge':
          if (!this.isCharging) {
            this.chargeFrames++;
            this.x += (dx / dist) * effectiveSpeed;
            this.y += (dy / dist) * effectiveSpeed;
            if (this.chargeFrames > 90 && dist < 140) {
              this.isCharging = true;
              this.chargeDirX = dx / dist; this.chargeDirY = dy / dist;
              this.chargeFrames = 0;
            }
          } else {
            this.x += this.chargeDirX * (this.type.chargeSpeed * slowMoFactor);
            this.y += this.chargeDirY * (this.type.chargeSpeed * slowMoFactor);
            this.chargeFrames++;
            if (this.chargeFrames > 35) { this.isCharging = false; this.chargeFrames = 0; }
          }
          break;

        case 'shoot':
          this.x += (dx / dist) * effectiveSpeed;
          this.y += (dy / dist) * effectiveSpeed;
          this.shootFrames++;
          if (this.shootFrames > 90) {
            this.shootFrames = 0;
            if (enemyBullets) {
              enemyBullets.push(new Bullet(this.x, this.y, (dx / dist) * 3.0, (dy / dist) * 3.0, { size: 4, damage: 15, color: '#e41050' }, true));
            }
          }
          break;

        case 'heavy':
        case 'boss':
          this.x += (dx / dist) * effectiveSpeed;
          this.y += (dy / dist) * effectiveSpeed;
          this.shootFrames++;
          if (this.shootFrames > (this.type.behavior === 'boss' ? 45 : 120)) {
            this.shootFrames = 0;
            if (enemyBullets) {
              const shots = this.type.behavior === 'boss' ? 8 : 4;
              for (let i = 0; i < shots; i++) {
                const ang = (Math.PI * 2 * i) / shots + Math.atan2(dy, dx);
                enemyBullets.push(new Bullet(this.x, this.y, Math.cos(ang) * 2.5, Math.sin(ang) * 2.5, { size: 4, damage: 12, color: '#e41050' }, true));
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
      const ex = Math.floor(this.x);
      const ey = Math.floor(this.y);
      const w = Math.floor(this.size);
      const h = Math.floor(this.size);
      const halfW = w >> 1;
      const halfH = h >> 1;

      ctx.fillStyle = this.flashFrames > 0 ? '#ffffff' : (this.isEnraged ? '#e41050' : this.color);
      ctx.fillRect(ex - halfW, ey - halfH, w, h);

      ctx.fillStyle = '#000000';
      ctx.fillRect(ex - 2, ey - 2, 4, 4);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ex - 1, ey - 1, 2, 2);
    }
  }

  class WaveManager {
    constructor(arenaBounds) {
      this.arenaBounds = arenaBounds;
      this.waveNumber = 1;
      this.waveActive = false;
      this.enemiesRemainingInWave = 0;
      this.spawnTimerFrames = 0;
      this.spawnerDoors = [
        { x: arenaBounds.x + arenaBounds.w / 2, y: arenaBounds.y + 4 },
        { x: arenaBounds.x + arenaBounds.w / 2, y: arenaBounds.y + arenaBounds.h - 4 },
        { x: arenaBounds.x + 4, y: arenaBounds.y + arenaBounds.h / 2 },
        { x: arenaBounds.x + arenaBounds.w - 4, y: arenaBounds.y + arenaBounds.h / 2 }
      ];
    }

    startNextWave(uiManager) {
      this.waveActive = true;
      this.enemiesRemainingInWave = 18 + this.waveNumber * 10;

      if (uiManager) {
        soundEngine.playAnnouncerVoice();
        soundEngine.playCrowdRoar();
        const waveTitle = (this.waveNumber % 5 === 0) ? `WAVE ${this.waveNumber}: BOSS BATTLE!` : `WAVE ${this.waveNumber} - BEGIN!`;
        uiManager.showBanner(waveTitle, 2000);
      }
    }

    update(enemies, player, enemyBullets, particles, uiManager) {
      if (!this.waveActive) return;
      this.spawnTimerFrames++;

      if (this.enemiesRemainingInWave > 0 && this.spawnTimerFrames >= Math.max(12, 40 - this.waveNumber * 3)) {
        this.spawnTimerFrames = 0;

        const spawnClusterCount = Math.min(this.enemiesRemainingInWave, 2 + ((this.waveNumber / 2) | 0));
        const door = this.spawnerDoors[(Math.random() * this.spawnerDoors.length) | 0];

        for (let c = 0; c < spawnClusterCount; c++) {
          let type = ENEMY_TYPES.SWARMER;
          const r = Math.random();

          if (this.waveNumber % 5 === 0 && this.enemiesRemainingInWave === 1) type = ENEMY_TYPES.BOSS;
          else if (this.waveNumber >= 3 && r < 0.25) type = ENEMY_TYPES.CHARGER;
          else if (this.waveNumber >= 2 && r < 0.45) type = ENEMY_TYPES.TURRET;
          else if (this.waveNumber >= 4 && r < 0.6) type = ENEMY_TYPES.TITAN;

          const offsetX = (Math.random() - 0.5) * 12;
          const offsetY = (Math.random() - 0.5) * 12;
          enemies.push(new Enemy(door.x + offsetX, door.y + offsetY, type));
          this.enemiesRemainingInWave--;
        }

        if (particles) {
          for (let i = 0; i < 6; i++) {
            particles.addParticle(door.x, door.y, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, '#e41050', 2, 12);
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
        const dx = Math.floor(door.x);
        const dy = Math.floor(door.y);
        ctx.fillStyle = '#e41050';
        ctx.fillRect(dx - 6, dy - 6, 12, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(dx - 3, dy - 3, 6, 6);
      }
    }
  }

  class ScreenShake {
    constructor() { this.intensity = 0; this.offsetX = 0; this.offsetY = 0; }
    addShake(amount) { this.intensity = Math.min(16, this.intensity + amount); }
    update() {
      if (this.intensity > 0.1) {
        this.offsetX = Math.floor((Math.random() - 0.5) * this.intensity);
        this.offsetY = Math.floor((Math.random() - 0.5) * this.intensity);
        this.intensity *= 0.86;
      } else { this.intensity = 0; this.offsetX = 0; this.offsetY = 0; }
    }
  }

  class ParticleSystem {
    constructor() { this.particles = []; }
    addParticle(x, y, vx, vy, color, size, life) {
      this.particles.push({
        x: Math.floor(x),
        y: Math.floor(y),
        vx, vy, color,
        size: Math.floor(size),
        lifeFrames: life, maxLifeFrames: life
      });
      if (this.particles.length > 200) fastRemove(this.particles, 0);
    }
    update() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.95; p.vy *= 0.95;
        p.lifeFrames--;
        if (p.lifeFrames <= 0) fastRemove(this.particles, i);
      }
    }

    draw(ctx) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const px = Math.floor(p.x);
        const py = Math.floor(p.y);
        const psz = Math.max(1, Math.floor(p.size));
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.lifeFrames / p.maxLifeFrames);
        ctx.fillRect(px - (psz >> 1), py - (psz >> 1), psz, psz);
      }
      ctx.globalAlpha = 1.0;
    }
  }

  class Renderer {
    constructor(width = 256, height = 224) {
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
      this.offCtx.fillStyle = '#0c0a14';
      this.offCtx.fillRect(0, 0, this.width, this.height);
    }

    drawArenaGrid(arenaBounds) {
      const ctx = this.offCtx;
      ctx.fillStyle = '#1a142a';
      ctx.fillRect(arenaBounds.x, arenaBounds.y, arenaBounds.w, arenaBounds.h);

      ctx.strokeStyle = '#282040'; ctx.lineWidth = 1;
      for (let x = arenaBounds.x; x < arenaBounds.x + arenaBounds.w; x += 16) {
        ctx.beginPath(); ctx.moveTo(x, arenaBounds.y); ctx.lineTo(x, arenaBounds.y + arenaBounds.h); ctx.stroke();
      }
      for (let y = arenaBounds.y; y < arenaBounds.y + arenaBounds.h; y += 16) {
        ctx.beginPath(); ctx.moveTo(arenaBounds.x, y); ctx.lineTo(arenaBounds.x + arenaBounds.w, y); ctx.stroke();
      }

      ctx.strokeStyle = '#e41050'; ctx.lineWidth = 2;
      ctx.strokeRect(arenaBounds.x, arenaBounds.y, arenaBounds.w, arenaBounds.h);
    }

    drawPixelDottedLaser(x1, y1, x2, y2, color) {
      const ctx = this.offCtx;
      ctx.fillStyle = color;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.hypot(dx, dy);
      const stepCount = Math.floor(dist / 4);

      for (let i = 0; i <= stepCount; i++) {
        const t = stepCount === 0 ? 0 : i / stepCount;
        const px = Math.floor(x1 + dx * t);
        const py = Math.floor(y1 + dy * t);
        ctx.fillRect(px, py, 1, 1);
      }
    }

    drawDynamicLighting(lights) {
      const ctx = this.offCtx;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < lights.length; i++) {
        const l = lights[i];
        const rad = Math.floor(l.radius || 14);
        const lx = Math.floor(l.x);
        const ly = Math.floor(l.y);
        const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, rad);
        grad.addColorStop(0, l.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(lx, ly, rad, 0, Math.PI * 2);
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
          const quantized = quantizeColorFast(data[idx], data[idx + 1], data[idx + 2], x, y, 0.20);
          data[idx] = quantized[0]; data[idx + 1] = quantized[1]; data[idx + 2] = quantized[2];
        }
      }
      this.offCtx.putImageData(imgData, 0, 0);
    }

    renderToScreen(screenCtx, mainWidth, mainHeight, screenShake) {
      screenCtx.save();
      screenCtx.clearRect(0, 0, mainWidth, mainHeight);
      screenCtx.imageSmoothingEnabled = false;
      if (screenShake) screenCtx.translate(Math.floor(screenShake.offsetX), Math.floor(screenShake.offsetY));
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

      this.renderer = new Renderer(256, 224);
      this.arenaBounds = { x: 8, y: 8, w: 240, h: 208 };

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
      this.mousePos = { x: 128, y: 112, isDown: false };

      this.slowMoFrames = 0;

      this.bindEvents();
      this.setupUI();
      this.resizeCanvas();

      window.addEventListener('resize', () => this.resizeCanvas());
      requestAnimationFrame(() => this.loop());
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
        this.mousePos.x = Math.floor((e.clientX - rect.left) * scaleX);
        this.mousePos.y = Math.floor((e.clientY - rect.top) * scaleY);
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
    }

    startGame() {
      soundEngine.init();
      this.player = new Player(128, 112);
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
    }

    togglePause() {
      if (this.state === GAME_STATES.PLAYING) {
        this.state = GAME_STATES.PAUSED;
        document.getElementById('screen-pause')?.classList.remove('hidden');
      } else if (this.state === GAME_STATES.PAUSED) {
        this.state = GAME_STATES.PLAYING;
        document.getElementById('screen-pause')?.classList.add('hidden');
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

    update() {
      if (this.state !== GAME_STATES.PLAYING) return;

      let enemySlowMoFactor = 1.0;
      if (this.slowMoFrames > 0) {
        this.slowMoFrames--;
        enemySlowMoFactor = 0.3;
      }

      this.screenShake.update();
      this.particles.update();
      this.debrisManager.update();
      this.popupManager.update();

      this.player.update(this.keys, this.mousePos, this.arenaBounds, this.bullets, this.particles, this.screenShake, this.debrisManager);
      if (this.player.hp <= 0) { this.gameOver(); return; }

      this.crateManager.update(this.player, this.particles, this.uiManager, this.popupManager, (f) => this.triggerSlowMo(f));
      this.waveManager.update(this.enemies, this.player, this.enemyBullets, this.particles, this.uiManager);

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.update(this.arenaBounds, this.particles, this.enemies);

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
              this.player.comboFrames = 120;
              this.player.comboMultiplier = Math.min(5, 1 + ((this.player.killStreak / 4) | 0));

              const addedScore = e.type.scoreValue * this.player.comboMultiplier;
              this.uiManager.addScore(addedScore);

              this.popupManager.addPopup(e.x, e.y - 12, `+${addedScore}`, '#20dc8c');

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
        eb.update(this.arenaBounds, this.particles, null);

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
        e.update(this.player, this.arenaBounds, this.enemyBullets, this.particles, enemySlowMoFactor);

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
        this.renderer.drawPixelDottedLaser(
          Math.floor(this.player.x),
          Math.floor(this.player.y),
          Math.floor(this.mousePos.x),
          Math.floor(this.mousePos.y),
          '#00e6ff'
        );
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
      if (this.player) lights.push({ x: Math.floor(this.player.x), y: Math.floor(this.player.y), radius: 20, color: 'rgba(0, 230, 255, 0.25)' });
      if (this.crateManager && this.crateManager.activeCrate) {
        const c = this.crateManager.activeCrate;
        lights.push({ x: Math.floor(c.x), y: Math.floor(c.y), radius: 18, color: c.isGolden ? 'rgba(255, 220, 40, 0.45)' : 'rgba(0, 230, 255, 0.3)' });
      }
      for (let i = 0; i < this.bullets.length; i++) {
        const b = this.bullets[i];
        lights.push({ x: Math.floor(b.x), y: Math.floor(b.y), radius: 8, color: 'rgba(255, 255, 255, 0.2)' });
      }
      for (let i = 0; i < this.enemyBullets.length; i++) {
        const eb = this.enemyBullets[i];
        lights.push({ x: Math.floor(eb.x), y: Math.floor(eb.y), radius: 10, color: 'rgba(228, 16, 80, 0.35)' });
      }
      this.renderer.drawDynamicLighting(lights);

      if (this.state === GAME_STATES.PLAYING) {
        offCtx.strokeStyle = '#00e6ff';
        offCtx.lineWidth = 1;
        const cx = Math.floor(this.mousePos.x);
        const cy = Math.floor(this.mousePos.y);
        offCtx.strokeRect(cx - 3, cy - 3, 6, 6);
      }

      this.renderer.applyOrderedDithering();
      this.renderer.renderToScreen(this.mainCtx, this.mainCanvas.width, this.mainCanvas.height, this.screenShake);
    }

    loop() {
      this.update();
      this.render();
      requestAnimationFrame(() => this.loop());
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    new Game();
  });
})();