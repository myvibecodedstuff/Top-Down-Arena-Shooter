
(function() {
  'use strict';

  const MEGA_PALETTE = [
    [8, 4, 24],
    [28, 13, 56],
    [61, 26, 104],
    [122, 40, 168],
    [216, 40, 160],
    [255, 51, 102],
    [0, 240, 255],
    [0, 255, 170],
    [255, 204, 0],
    [255, 110, 0],
    [150, 220, 255],
    [255, 255, 255]
  ];

  function fastRemove(arr, index) {
    const last = arr.pop();
    if (index < arr.length) arr[index] = last;
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
      osc.frequency.setValueAtTime(520 + (Math.random() - 0.5) * 40, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
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
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.16);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
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
      osc.frequency.setValueAtTime(960, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.10);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
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
      const notes = [587.33, 739.99, 880.00, 1174.66];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.4, now + idx * 0.04 + 0.01);
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
      filter.frequency.setValueAtTime(850 * pitchMultiplier, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.28);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.28);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start();
    }

    playVentSteam() {
      if (!this.initialized) return;
      this.resume();
      const bufferSize = (this.ctx.sampleRate * 0.12) | 0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2200, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

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
      gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.10);
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
        gain.gain.setValueAtTime(0.28, now + i * 0.07);
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

        gain.gain.setValueAtTime(0.12, now);
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

  const POWER_TIERS = [
    { level: 1, stars: '★', multiplier: 1, maxHeat: 30, relaysNeeded: 0 },
    { level: 2, stars: '★★', multiplier: 2, maxHeat: 50, relaysNeeded: 1 },
    { level: 3, stars: '★★★', multiplier: 4, maxHeat: 75, relaysNeeded: 2 },
    { level: 4, stars: '★★★★', multiplier: 8, maxHeat: 90, relaysNeeded: 3 },
    { level: 5, stars: '★★★★★', multiplier: 16, maxHeat: 100, relaysNeeded: 3 }
  ];

  const WEAPONS = {
    PISTOL: {
      id: 'PISTOL', color: '#00f0ff',
      fireRate: 100, spread: 0.08, speed: 10.0, damage: 18,
      bulletsPerShot: 1, size: 3, recoil: 0.5, heatCost: 0.2,
      tierRequired: 1,
      sound: () => soundEngine.playPistol()
    },
    SHOTGUN: {
      id: 'SHOTGUN', color: '#ffcc00',
      fireRate: 300, spread: 0.42, speed: 8.0, damage: 18,
      bulletsPerShot: 10, size: 2.5, recoil: 2.0, knockback: 4.5, heatCost: 1.8,
      tierRequired: 2,
      sound: () => soundEngine.playShotgun()
    },
    PLASMA: {
      id: 'PLASMA', color: '#ff3366',
      fireRate: 60, spread: 0.12, speed: 11.5, damage: 16,
      bulletsPerShot: 1, size: 4, recoil: 0.8, piercing: true, heatCost: 0.8,
      tierRequired: 2,
      sound: () => soundEngine.playLaser()
    },
    RAILGUN: {
      id: 'RAILGUN', color: '#00ffaa',
      fireRate: 380, spread: 0.01, speed: 22.0, damage: 120,
      bulletsPerShot: 1, size: 4, recoil: 3.0, piercing: true, knockback: 6, heatCost: 3.5,
      tierRequired: 3,
      sound: () => soundEngine.playLaser()
    },
    SAWBLADE: {
      id: 'SAWBLADE', color: '#d828a0',
      fireRate: 230, spread: 0.1, speed: 7.5, damage: 35,
      bulletsPerShot: 2, size: 6, bouncing: true, bouncesLeft: 6, recoil: 1.2, piercing: true, heatCost: 2.2,
      tierRequired: 3,
      sound: () => soundEngine.playShotgun()
    },
    MISSILE: {
      id: 'MISSILE', color: '#ff6e00',
      fireRate: 200, spread: 0.25, speed: 7.0, damage: 60,
      bulletsPerShot: 3, size: 5, explosive: true, recoil: 1.8, homing: true, heatCost: 2.8,
      tierRequired: 4,
      sound: () => soundEngine.playPistol()
    },
    SINGULARITY: {
      id: 'SINGULARITY', color: '#d828a0',
      fireRate: 140, spread: 0.35, speed: 8.5, damage: 90,
      bulletsPerShot: 4, size: 6, explosive: true, recoil: 2.5, piercing: true, heatCost: 4.0,
      tierRequired: 5,
      sound: () => soundEngine.playExplosion()
    }
  };

  class Bullet {
    constructor(x, y, vx, vy, weapon, isEnemy = false) {
      this.x = x; this.y = y;
      this.vx = vx; this.vy = vy;
      this.weapon = weapon;
      this.color = isEnemy ? '#ff3366' : weapon.color;
      this.size = weapon.size || 3;
      this.damage = weapon.damage || 10;
      this.piercing = weapon.piercing || false;
      this.bouncing = weapon.bouncing || false;
      this.bouncesLeft = weapon.bouncesLeft || 0;
      this.isEnemy = isEnemy;
      this.lifeFrames = 0; this.maxLifeFrames = 120;
      this.dead = false;
    }

    update(arenaBounds, particles, dt, enemies) {
      if (this.weapon.homing && enemies && enemies.length > 0 && !this.isEnemy) {
        let closest = null;
        let minDistSq = 160 * 160;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          const dSq = (e.x - this.x) * (e.x - this.x) + (e.y - this.y) * (e.y - this.y);
          if (dSq < minDistSq) { minDistSq = dSq; closest = e; }
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
      this.lifeFrames += dt;

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

  class RelayCrystal {
    constructor(x, y, id) {
      this.x = x; this.y = y; this.id = id;
      this.hp = 120; this.maxHp = 120;
      this.size = 14;
      this.flashFrames = 0;
      this.pulseTimer = 0;
      this.dead = false;
    }

    takeDamage(amount, particles) {
      this.hp -= amount;
      this.flashFrames = 4;
      if (particles) {
        for (let i = 0; i < 6; i++) {
          const ang = Math.random() * Math.PI * 2;
          particles.addParticle(this.x, this.y, Math.cos(ang) * 2, Math.sin(ang) * 2, '#00f0ff', 2, 12);
        }
      }
      if (this.hp <= 0) {
        this.dead = true;
        soundEngine.playExplosion();
      }
    }

    update(dt) {
      if (this.flashFrames > 0) this.flashFrames -= dt;
      this.pulseTimer += 0.1 * dt;
    }

    draw(ctx, ventPad) {
      const cx = Math.floor(this.x);
      const cy = Math.floor(this.y + Math.sin(this.pulseTimer) * 1.5);
      const half = this.size >> 1;

      if (ventPad) {
        const isDamaged = this.hp < 40 || this.flashFrames > 0;
        ctx.strokeStyle = isDamaged ? 'rgba(255, 51, 102, 0.55)' : 'rgba(0, 240, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(Math.floor(ventPad.x), Math.floor(ventPad.y));
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(cx - half, Math.floor(this.y) + half - 2, this.size, 3);

      ctx.fillStyle = this.flashFrames > 0 ? '#ffffff' : (this.hp < 40 ? '#ff3366' : '#00f0ff');
      ctx.beginPath();
      ctx.moveTo(cx, cy - half);
      ctx.lineTo(cx + half, cy);
      ctx.lineTo(cx - half, cy + half);
      ctx.lineTo(cx - half, cy);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      const hpPct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = '#1c0d38';
      ctx.fillRect(cx - half, cy - half - 5, this.size, 3);
      ctx.fillStyle = hpPct > 0.3 ? '#00ffaa' : '#ff3366';
      ctx.fillRect(cx - half, cy - half - 5, Math.floor(this.size * hpPct), 3);
    }
  }

  class CrateManager {
    constructor(arenaBounds) {
      this.arenaBounds = arenaBounds;
      this.activeCrate = null;
      this.spawnCooldown = 300;
      this.cratesCollected = 0;
    }

    spawnCrate() {
      const padding = 24;
      const x = Math.floor(this.arenaBounds.x + padding + Math.random() * (this.arenaBounds.w - padding * 2));
      const y = Math.floor(this.arenaBounds.y + padding + Math.random() * (this.arenaBounds.h - padding * 2));
      const isGolden = Math.random() < 0.25;

      this.activeCrate = {
        x, y,
        size: 12,
        frameTimer: 0,
        pulseY: 0,
        isGolden
      };
    }

    update(player, particles, dt, popups, triggerSlowMo, game) {
      if (!this.activeCrate) {
        this.spawnCooldown -= dt;
        if (this.spawnCooldown <= 0) {
          this.spawnCrate();
          this.spawnCooldown = 360;
        }
        return;
      }

      const crate = this.activeCrate;
      crate.frameTimer += dt;
      crate.pulseY = Math.floor(Math.sin(crate.frameTimer * 0.08) * 2.0);

      const dx = player.x - crate.x;
      const dy = player.y - crate.y;
      const dist = Math.hypot(dx, dy);

      if (dist < (player.size + crate.size) * 0.7) {
        this.cratesCollected++;
        soundEngine.playCratePickup();

        if (triggerSlowMo) triggerSlowMo(35);

        player.hp = Math.min(player.maxHp, player.hp + 15);
        if (popups) popups.addPopup(player.x, player.y - 12, '+15 HP', '#00ffaa');

        game.increasePowerTier();

        const availableWeapons = Object.values(WEAPONS).filter(w => w.tierRequired <= game.currentPowerTier.level);
        let newWeapon = availableWeapons[(Math.random() * availableWeapons.length) | 0];
        player.equipWeapon(newWeapon);

        let scoreGain = 100 * game.currentPowerTier.multiplier;
        game.addScore(scoreGain);

        if (popups) {
          popups.addPopup(crate.x, crate.y - 10, `+${scoreGain}`, crate.isGolden ? '#ffcc00' : '#00f0ff');
        }

        if (particles) {
          const pColor = crate.isGolden ? '#ffcc00' : '#00f0ff';
          for (let i = 0; i < 28; i++) {
            const angle = (Math.PI * 2 * i) / 28;
            const spd = 2 + Math.random() * 3.5;
            particles.addParticle(crate.x, crate.y, Math.cos(angle) * spd, Math.sin(angle) * spd, pColor, 2, 22);
          }
        }

        this.activeCrate = null;
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

      ctx.fillStyle = c.isGolden ? '#ffcc00' : '#7a28a8';
      ctx.fillRect(cx - half, drawY - half, c.size, c.size);

      ctx.fillStyle = c.isGolden ? '#ffffff' : '#d828a0';
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
      ctx.fillText(c.isGolden ? '★' : '⚡', cx, drawY + 1);
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
        color: '#ffcc00'
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

    update(dt) {
      for (let i = this.casings.length - 1; i >= 0; i--) {
        const c = this.casings[i];
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vx *= Math.pow(0.85, dt);
        c.vy *= Math.pow(0.85, dt);
        c.lifeFrames -= dt;
        if (c.lifeFrames <= 0) fastRemove(this.casings, i);
      }
      for (let i = 0; i < this.corpses.length; i++) {
        const corpse = this.corpses[i];
        corpse.lifeFrames -= dt;
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

    update(dt) {
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const p = this.popups[i];
        p.frameTickCounter += dt;

        if ((Math.floor(p.frameTickCounter) % 3) === 0) {
          p.y -= 0.35 * dt;
        }

        p.lifeFrames -= dt;
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
      this.speed = 2.4;
      this.currentWeapon = WEAPONS.PISTOL;
      this.aimAngle = 0;
      this.lastShotTime = 0;
      this.hp = 100;
      this.maxHp = 100;
      this.invulnerableFrames = 0;
      this.weaponJammedTimer = 0;

      this.isDashing = false;
      this.dashFrames = 0;
      this.dashCooldownFrames = 0;
      this.dashVx = 0; this.dashVy = 0;
    }

    equipWeapon(w) { this.currentWeapon = w; }

    takeDamage(amount, particles, screenShake) {
      if (this.invulnerableFrames > 0 || this.isDashing) return false;
      this.hp -= amount;
      this.invulnerableFrames = 50;

      if (screenShake) screenShake.addShake(5);

      if (particles) {
        for (let i = 0; i < 16; i++) {
          const ang = Math.random() * Math.PI * 2;
          particles.addParticle(this.x, this.y, Math.cos(ang) * 2.5, Math.sin(ang) * 2.5, '#ff3366', 2.5, 20);
        }
      }
      return true;
    }

    update(keys, mousePos, arenaBounds, bullets, particles, screenShake, dt, debris, game) {
      if (this.invulnerableFrames > 0) this.invulnerableFrames -= dt;
      if (this.dashCooldownFrames > 0) this.dashCooldownFrames -= dt;
      if (this.weaponJammedTimer > 0) this.weaponJammedTimer -= dt;

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
            this.dashCooldownFrames = 30;
          }
        }
      }

      if (this.isDashing) {
        this.x += this.dashVx * dt; this.y += this.dashVy * dt;
        this.dashFrames -= dt;
        if (this.dashFrames <= 0) this.isDashing = false;
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
        const dx = mousePos.x - this.x;
        const dy = mousePos.y - this.y;
        this.aimAngle = Math.atan2(dy, dx);
      }

      const now = performance.now();
      if (mousePos && mousePos.isDown && this.weaponJammedTimer <= 0 && now - this.lastShotTime >= this.currentWeapon.fireRate) {
        this.lastShotTime = now;
        this.fireWeapon(bullets, particles, screenShake, debris, game);
      }
    }

    fireWeapon(bullets, particles, screenShake, debris, game) {
      const w = this.currentWeapon;
      w.sound();

      if (game) game.addReactorHeat(w.heatCost || 1.0);

      if (screenShake && w.recoil > 2) screenShake.addShake(w.recoil * 0.4);

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

    draw(ctx, powerTier) {
      if (this.invulnerableFrames > 0 && (((this.invulnerableFrames / 3) | 0) % 2 === 0)) return;

      const px = Math.floor(this.x);
      const py = Math.floor(this.y);

      ctx.fillStyle = this.isDashing ? '#00f0ff' : (this.weaponJammedTimer > 0 ? '#ff3366' : '#ffcc00');
      ctx.fillRect(px - 4, py - 4, 8, 8);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 2, py - 2, 4, 4);

      ctx.fillStyle = '#00f0ff';
      const eyeX = Math.floor(this.x + Math.cos(this.aimAngle) * 3);
      const eyeY = Math.floor(this.y + Math.sin(this.aimAngle) * 3);
      ctx.fillRect(eyeX - 1, eyeY - 1, 3, 2);

      ctx.fillStyle = this.currentWeapon.color;
      ctx.fillRect(
        Math.floor(this.x + Math.cos(this.aimAngle) * 4) - 1,
        Math.floor(this.y + Math.sin(this.aimAngle) * 4) - 1,
        3, 3
      );

      if (powerTier) {
        ctx.fillStyle = '#ffcc00';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(powerTier.stars, px, py - 7);
      }
    }
  }

  const ENEMY_TYPES = {
    SWARMER: { name: 'SWARMER BUG', hp: 14, speed: 1.2, size: 7, color: '#ff3366', scoreValue: 40, behavior: 'chase' },
    CHARGER: { name: 'CYBORG BULL', hp: 45, speed: 0.95, chargeSpeed: 3.2, size: 11, color: '#ff6e00', scoreValue: 120, behavior: 'charge' },
    TURRET: { name: 'ARENA TURRET', hp: 30, speed: 0.35, size: 10, color: '#7a28a8', scoreValue: 160, behavior: 'shoot' },
    TITAN: { name: 'MECHA TITAN', hp: 120, speed: 0.4, size: 15, color: '#00ffaa', scoreValue: 350, behavior: 'heavy' },
    BOSS: { name: 'BROADCAST MEGABRAIN', hp: 600, speed: 0.4, size: 26, color: '#ffcc00', scoreValue: 2000, behavior: 'boss' }
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
      this.targetCrystal = null;
    }

    takeDamage(amount, particles, screenShake, debris, popups, knockbackDirX = 0, knockbackDirY = 0, knockbackMag = 0) {
      this.hp -= amount;
      this.flashFrames = 5;

      if (knockbackMag > 0) {
        this.vx += knockbackDirX * knockbackMag;
        this.vy += knockbackDirY * knockbackMag;
      }

      if (popups) {
        popups.addPopup(this.x, this.y - 6, `-${amount}`, '#ff3366');
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
        if (screenShake) screenShake.addShake(this.type.behavior === 'boss' ? 8 : 2);

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

    update(player, arenaBounds, enemyBullets, particles, dt, slowMoFactor = 1.0, relays = []) {
      if (this.flashFrames > 0) this.flashFrames -= dt;

      const effectiveSpeed = this.speed * slowMoFactor;

      this.x += this.vx * slowMoFactor * dt;
      this.y += this.vy * slowMoFactor * dt;
      this.vx *= Math.pow(0.82, dt);
      this.vy *= Math.pow(0.82, dt);

      this.ageFrames += dt;
      if (!this.isEnraged && this.ageFrames > 550) {
        this.isEnraged = true;
        this.speed *= 1.8;
        this.color = '#ff3366';
      }

      let targetX = player.x;
      let targetY = player.y;

      if (relays.length > 0 && Math.random() < 0.4) {
        if (!this.targetCrystal || this.targetCrystal.dead) {
          this.targetCrystal = relays[(Math.random() * relays.length) | 0];
        }
        if (this.targetCrystal && !this.targetCrystal.dead) {
          targetX = this.targetCrystal.x;
          targetY = this.targetCrystal.y;
        }
      }

      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.hypot(dx, dy) || 1;

      switch (this.type.behavior) {
        case 'chase':
          this.x += (dx / dist) * effectiveSpeed * dt;
          this.y += (dy / dist) * effectiveSpeed * dt;
          break;

        case 'charge':
          if (!this.isCharging) {
            this.chargeFrames += dt;
            this.x += (dx / dist) * effectiveSpeed * dt;
            this.y += (dy / dist) * effectiveSpeed * dt;
            if (this.chargeFrames > 90 && dist < 140) {
              this.isCharging = true;
              this.chargeDirX = dx / dist; this.chargeDirY = dy / dist;
              this.chargeFrames = 0;
            }
          } else {
            this.x += this.chargeDirX * (this.type.chargeSpeed * slowMoFactor) * dt;
            this.y += this.chargeDirY * (this.type.chargeSpeed * slowMoFactor) * dt;
            this.chargeFrames += dt;
            if (this.chargeFrames > 35) { this.isCharging = false; this.chargeFrames = 0; }
          }
          break;

        case 'shoot':
          this.x += (dx / dist) * effectiveSpeed * dt;
          this.y += (dy / dist) * effectiveSpeed * dt;
          this.shootFrames += dt;
          if (this.shootFrames > 110) {
            this.shootFrames = 0;
            if (enemyBullets) {
              enemyBullets.push(new Bullet(this.x, this.y, (dx / dist) * 2.8, (dy / dist) * 2.8, { size: 4, damage: 12, color: '#ff3366' }, true));
            }
          }
          break;

        case 'heavy':
        case 'boss':
          this.x += (dx / dist) * effectiveSpeed * dt;
          this.y += (dy / dist) * effectiveSpeed * dt;
          this.shootFrames += dt;
          if (this.shootFrames > (this.type.behavior === 'boss' ? 50 : 130)) {
            this.shootFrames = 0;
            if (enemyBullets) {
              const shots = this.type.behavior === 'boss' ? 8 : 4;
              for (let i = 0; i < shots; i++) {
                const ang = (Math.PI * 2 * i) / shots + Math.atan2(dy, dx);
                enemyBullets.push(new Bullet(this.x, this.y, Math.cos(ang) * 2.2, Math.sin(ang) * 2.2, { size: 4, damage: 10, color: '#ff3366' }, true));
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

      ctx.fillStyle = this.flashFrames > 0 ? '#ffffff' : (this.isEnraged ? '#ff3366' : this.color);
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
        { x: arenaBounds.x + arenaBounds.w / 2, y: arenaBounds.y + 4, flashTimer: 0 },
        { x: arenaBounds.x + arenaBounds.w / 2, y: arenaBounds.y + arenaBounds.h - 4, flashTimer: 0 },
        { x: arenaBounds.x + 4, y: arenaBounds.y + arenaBounds.h / 2, flashTimer: 0 },
        { x: arenaBounds.x + arenaBounds.w - 4, y: arenaBounds.y + arenaBounds.h / 2, flashTimer: 0 }
      ];
    }

    startNextWave() {
      this.waveActive = true;
      this.enemiesRemainingInWave = 10 + this.waveNumber * 4;
      soundEngine.playAnnouncerVoice();
      soundEngine.playCrowdRoar();
    }

    update(enemies, player, enemyBullets, particles, dt) {
      if (!this.waveActive) return;
      this.spawnTimerFrames += dt;

      for (let d of this.spawnerDoors) {
        if (d.flashTimer > 0) d.flashTimer -= dt;
      }

      const spawnThreshold = Math.max(18, 50 - this.waveNumber * 2);

      if (this.spawnTimerFrames >= spawnThreshold - 15) {
        for (let d of this.spawnerDoors) d.flashTimer = 10;
      }

      if (this.enemiesRemainingInWave > 0 && this.spawnTimerFrames >= spawnThreshold) {
        this.spawnTimerFrames = 0;

        const spawnClusterCount = Math.min(this.enemiesRemainingInWave, 2 + ((this.waveNumber / 3) | 0));
        const door = this.spawnerDoors[(Math.random() * this.spawnerDoors.length) | 0];
        door.flashTimer = 15;

        for (let c = 0; c < spawnClusterCount; c++) {
          let type = ENEMY_TYPES.SWARMER;
          const r = Math.random();

          if (this.waveNumber % 5 === 0 && this.enemiesRemainingInWave === 1) type = ENEMY_TYPES.BOSS;
          else if (this.waveNumber >= 3 && r < 0.20) type = ENEMY_TYPES.CHARGER;
          else if (this.waveNumber >= 2 && r < 0.35) type = ENEMY_TYPES.TURRET;
          else if (this.waveNumber >= 4 && r < 0.50) type = ENEMY_TYPES.TITAN;

          const offsetX = (Math.random() - 0.5) * 12;
          const offsetY = (Math.random() - 0.5) * 12;
          enemies.push(new Enemy(door.x + offsetX, door.y + offsetY, type));
          this.enemiesRemainingInWave--;
        }

        if (particles) {
          for (let i = 0; i < 6; i++) {
            particles.addParticle(door.x, door.y, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, '#ff3366', 2, 12);
          }
        }
      }

      if (this.enemiesRemainingInWave === 0 && enemies.length === 0) {
        this.waveActive = false;
        this.waveNumber++;
        soundEngine.playCrowdRoar();
        setTimeout(() => this.startNextWave(), 2000);
      }
    }

    drawDoors(ctx) {
      for (let i = 0; i < this.spawnerDoors.length; i++) {
        const door = this.spawnerDoors[i];
        const dx = Math.floor(door.x);
        const dy = Math.floor(door.y);
        ctx.fillStyle = door.flashTimer > 0 ? '#ffffff' : '#ff3366';
        ctx.fillRect(dx - 6, dy - 6, 12, 12);
        ctx.fillStyle = door.flashTimer > 0 ? '#ffcc00' : '#ffffff';
        ctx.fillRect(dx - 3, dy - 3, 6, 6);
      }
    }
  }

  class ScreenShake {
    constructor() { this.intensity = 0; this.offsetX = 0; this.offsetY = 0; }
    addShake(amount) { this.intensity = Math.min(6, this.intensity + amount); }
    update(dt) {
      if (this.intensity > 0.1) {
        this.offsetX = Math.floor((Math.random() - 0.5) * this.intensity);
        this.offsetY = Math.floor((Math.random() - 0.5) * this.intensity);
        this.intensity *= Math.pow(0.85, dt);
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
    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= Math.pow(0.95, dt); p.vy *= Math.pow(0.95, dt);
        p.lifeFrames -= dt;
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
    constructor(width = 320, height = 224) {
      this.width = width; this.height = height;
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = width;
      this.offscreenCanvas.height = height;
      this.offCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
      this.offCtx.imageRendering = 'pixelated';
    }

    getContext() { return this.offCtx; }

    clear() {
      this.offCtx.fillStyle = '#080418';
      this.offCtx.fillRect(0, 0, this.width, this.height);
    }

    drawArenaGrid(arenaBounds, ventPad, reactorHeat) {
      const ctx = this.offCtx;
      ctx.fillStyle = '#1c0d38';
      ctx.fillRect(arenaBounds.x, arenaBounds.y, arenaBounds.w, arenaBounds.h);

      ctx.strokeStyle = '#3d1a68'; ctx.lineWidth = 1;
      for (let x = arenaBounds.x; x < arenaBounds.x + arenaBounds.w; x += 16) {
        ctx.beginPath(); ctx.moveTo(x, arenaBounds.y); ctx.lineTo(x, arenaBounds.y + arenaBounds.h); ctx.stroke();
      }
      for (let y = arenaBounds.y; y < arenaBounds.y + arenaBounds.h; y += 16) {
        ctx.beginPath(); ctx.moveTo(arenaBounds.x, y); ctx.lineTo(arenaBounds.x + arenaBounds.w, y); ctx.stroke();
      }

      if (ventPad) {
        const vx = Math.floor(ventPad.x);
        const vy = Math.floor(ventPad.y);
        const vSize = ventPad.size;

        const isHot = reactorHeat > 50;
        ctx.fillStyle = isHot ? '#ff3366' : '#ff6e00';
        ctx.fillRect(vx - (vSize >> 1), vy - (vSize >> 1), vSize, vSize);

        ctx.fillStyle = isHot ? '#ffcc00' : '#ffffff';
        ctx.fillRect(vx - (vSize >> 1) + 2, vy - (vSize >> 1) + 2, vSize - 4, vSize - 4);

        if (isHot) {
          ctx.fillStyle = '#ff3366';
          ctx.font = '8px "Press Start 2P"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('▲', vx, vy);
        }
      }

      ctx.strokeStyle = '#d828a0'; ctx.lineWidth = 2;
      ctx.strokeRect(arenaBounds.x, arenaBounds.y, arenaBounds.w, arenaBounds.h);
    }

    drawInEngineHUD(game) {
      const ctx = this.offCtx;
      ctx.font = '8px "Press Start 2P"';
      ctx.textBaseline = 'top';

      ctx.fillStyle = '#ffcc00';
      ctx.textAlign = 'left';
      ctx.fillText(`🏆${game.score.toString().padStart(6, '0')}`, 10, 4);

      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`${game.currentPowerTier.stars}`, 130, 4);

      const hpPct = Math.max(0, Math.ceil(game.player ? game.player.hp : 100));
      ctx.fillStyle = hpPct > 30 ? '#00ffaa' : '#ff3366';
      ctx.textAlign = 'right';
      ctx.fillText(`❤️${hpPct}%`, 310, 4);

      const heatPct = Math.min(1.0, game.reactorHeat / 100);
      const barW = 140;
      const barX = (320 - barW) >> 1;
      const barY = 212;

      ctx.fillStyle = '#000000';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, 8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX - 1, barY - 1, barW + 2, 8);

      ctx.fillStyle = heatPct > 0.8 ? '#ff3366' : (heatPct > 0.5 ? '#ff6e00' : '#ffcc00');
      ctx.fillRect(barX, barY, Math.floor(barW * heatPct), 6);
    }

    drawInEngineTitleScreen() {
      const ctx = this.offCtx;
      ctx.fillStyle = 'rgba(8, 4, 24, 0.94)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.font = '11px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#ffcc00';
      ctx.fillText('CRATE ARENA', 160, 65);

      ctx.fillStyle = '#d828a0';
      ctx.font = '8px "Press Start 2P"';
      ctx.fillText('POWER & RESPONSIBILITY', 160, 88);

      ctx.fillStyle = '#00f0ff';
      ctx.fillText('SEGA MEGA DRIVE 16-BIT', 160, 110);

      if (((performance.now() / 400) | 0) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PRESS SPACE / CLICK TO PLAY', 160, 160);
      }
    }

    drawInEnginePauseScreen() {
      const ctx = this.offCtx;
      ctx.fillStyle = 'rgba(8, 4, 24, 0.85)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.font = '12px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText('PAUSED', 160, 112);
    }

    drawInEngineGameOverScreen(score) {
      const ctx = this.offCtx;
      ctx.fillStyle = 'rgba(8, 4, 24, 0.94)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.font = '12px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ff3366';
      ctx.fillText('GAME OVER', 160, 70);

      ctx.font = '8px "Press Start 2P"';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`SCORE: ${score}`, 160, 110);

      if (((performance.now() / 400) | 0) % 2 === 0) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('PRESS SPACE TO RESTART', 160, 160);
      }
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

    renderToScreen(screenCtx, mainWidth, mainHeight, screenShake) {
      screenCtx.save();
      screenCtx.fillStyle = '#000000';
      screenCtx.fillRect(0, 0, mainWidth, mainHeight);
      screenCtx.imageSmoothingEnabled = false;

      const shakeX = screenShake ? Math.floor(screenShake.offsetX) : 0;
      const shakeY = screenShake ? Math.floor(screenShake.offsetY) : 0;

      screenCtx.drawImage(
        this.offscreenCanvas,
        0, 0, this.width, this.height,
        shakeX, shakeY, mainWidth, mainHeight
      );
      screenCtx.restore();
    }
  }

  const GAME_STATES = { TITLE: 'TITLE', PLAYING: 'PLAYING', PAUSED: 'PAUSED', GAMEOVER: 'GAMEOVER' };

  class Game {
    constructor() {
      this.state = GAME_STATES.TITLE;
      this.mainCanvas = document.getElementById('game-canvas');
      this.mainCtx = this.mainCanvas.getContext('2d');

      this.renderer = new Renderer(320, 224);
      this.arenaBounds = { x: 8, y: 16, w: 304, h: 192 };
      this.ventPad = { x: 160, y: 112, size: 24 };

      this.particles = new ParticleSystem();
      this.screenShake = new ScreenShake();
      this.debrisManager = new DebrisManager();
      this.popupManager = new PopupManager();

      this.player = null;
      this.crateManager = null;
      this.waveManager = null;
      this.bullets = [];
      this.enemyBullets = [];
      this.enemies = [];
      this.relays = [];

      this.keys = {};
      this.mousePos = { x: 160, y: 112, isDown: false };

      this.score = 0;
      this.powerTierIndex = 0;
      this.powerTierTimer = 0;
      this.reactorHeat = 0;
      this.meltdownTimer = 0;

      this.lastTime = performance.now();
      this.slowMoFrames = 0;

      this.bindEvents();
      this.resizeCanvas();

      window.addEventListener('resize', () => this.resizeCanvas());
      requestAnimationFrame((time) => this.loop(time));
    }

    get currentPowerTier() {
      return POWER_TIERS[this.powerTierIndex];
    }

    addScore(amount) {
      this.score += amount;
    }

    increasePowerTier() {
      if (this.powerTierIndex < POWER_TIERS.length - 1) {
        this.powerTierIndex++;
        this.powerTierTimer = 480;
        this.syncRelayCrystals();
      }
    }

    decreasePowerTier() {
      if (this.powerTierIndex > 0) {
        this.powerTierIndex--;
        this.powerTierTimer = 480;
        this.popupManager.addPopup(this.player.x, this.player.y - 12, 'POWER DECAY', '#ff6e00');
        const availableWeapons = Object.values(WEAPONS).filter(w => w.tierRequired <= this.currentPowerTier.level);
        this.player.equipWeapon(availableWeapons[(Math.random() * availableWeapons.length) | 0]);
      }
    }

    syncRelayCrystals() {
      const targetCount = this.currentPowerTier.relaysNeeded;
      const currentActive = this.relays.filter(r => !r.dead).length;

      if (targetCount > currentActive) {
        const positions = [
          { x: 44, y: 36 },
          { x: 276, y: 36 },
          { x: 160, y: 170 }
        ];
        for (let i = currentActive; i < targetCount; i++) {
          const pos = positions[i % positions.length];
          this.relays.push(new RelayCrystal(pos.x, pos.y, i));
          this.popupManager.addPopup(pos.x, pos.y - 12, '💎', '#00f0ff');
        }
      }
    }

    addReactorHeat(amount) {
      this.reactorHeat = Math.min(100, this.reactorHeat + amount);
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
        if (e.code === 'KeyQ' && window.parent !== window) window.parent.postMessage('NAV_PREV', '*');
        if (e.code === 'KeyE' && window.parent !== window) window.parent.postMessage('NAV_NEXT', '*');

        if (e.code === 'KeyP' && this.state === GAME_STATES.PLAYING) {
          this.togglePause();
        }

        if ((this.state === 'TITLE' || this.state === 'GAMEOVER' || (typeof GAME_STATES !== 'undefined' && (this.state === GAME_STATES.TITLE || this.state === GAME_STATES.GAMEOVER))) && (e.code === 'Space' || e.code === 'Enter')) {
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
          if (this.state === GAME_STATES.TITLE || this.state === GAME_STATES.GAMEOVER) {
            this.startGame();
          }
        }
      });

      window.addEventListener('mouseup', (e) => {
        if (e.button === 0) this.mousePos.isDown = false;
      });
    }

    startGame() {
      soundEngine.init();
      this.player = new Player(160, 112);
      this.crateManager = new CrateManager(this.arenaBounds);
      this.waveManager = new WaveManager(this.arenaBounds);
      this.bullets.length = 0;
      this.enemyBullets.length = 0;
      this.enemies.length = 0;
      this.relays.length = 0;
      this.particles = new ParticleSystem();
      this.debrisManager = new DebrisManager();
      this.popupManager = new PopupManager();

      this.score = 0;
      this.powerTierIndex = 0;
      this.powerTierTimer = 0;
      this.reactorHeat = 0;
      this.meltdownTimer = 0;
      this.slowMoFrames = 0;
      this.lastTime = performance.now();

      this.state = GAME_STATES.PLAYING;
      this.waveManager.startNextWave();
    }

    togglePause() {
      if (this.state === GAME_STATES.PLAYING) {
        this.state = GAME_STATES.PAUSED;
      } else if (this.state === GAME_STATES.PAUSED) {
        this.state = GAME_STATES.PLAYING;
        this.lastTime = performance.now();
      }
    }

    gameOver() {
      this.state = GAME_STATES.GAMEOVER;
      soundEngine.playExplosion();
      soundEngine.playAnnouncerVoice();
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

      if (this.powerTierIndex > 0) {
        this.powerTierTimer -= dt;
        if (this.powerTierTimer <= 0) {
          this.decreasePowerTier();
        }
      }

      this.player.update(this.keys, this.mousePos, this.arenaBounds, this.bullets, this.particles, this.screenShake, dt, this.debrisManager, this);
      if (this.player.hp <= 0) { this.gameOver(); return; }

      const distToVent = Math.hypot(this.player.x - this.ventPad.x, this.player.y - this.ventPad.y);
      if (distToVent < this.ventPad.size / 2) {
        if (this.reactorHeat > 0) {
          this.reactorHeat = Math.max(0, this.reactorHeat - 0.65 * dt);
          soundEngine.playVentSteam();
          for (let i = 0; i < 3; i++) {
            this.particles.addParticle(
              this.ventPad.x + (Math.random() - 0.5) * 16,
              this.ventPad.y + (Math.random() - 0.5) * 16,
              (Math.random() - 0.5) * 0.5, -2.2, '#00f0ff', 3, 16
            );
          }
        }
      }

      if (this.reactorHeat >= 100) {
        this.meltdownTimer += dt;
        if (this.meltdownTimer >= 25) {
          this.meltdownTimer = 0;
          this.player.takeDamage(4, this.particles, this.screenShake);
          this.popupManager.addPopup(this.player.x, this.player.y - 10, '🔥 -4', '#ff3366');
        }
      } else {
        this.meltdownTimer = 0;
      }

      for (let i = this.relays.length - 1; i >= 0; i--) {
        const r = this.relays[i];
        r.update(dt);
        if (r.dead) {
          this.popupManager.addPopup(r.x, r.y - 10, '💔', '#ff3366');
          this.player.weaponJammedTimer = 60;
          this.player.takeDamage(8, this.particles, this.screenShake);
          fastRemove(this.relays, i);
        }
      }

      this.crateManager.update(this.player, this.particles, dt, this.popupManager, (f) => this.triggerSlowMo(f), this);
      this.waveManager.update(this.enemies, this.player, this.enemyBullets, this.particles, dt);

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
              const addedScore = e.type.scoreValue * this.currentPowerTier.multiplier;
              this.addScore(addedScore);
              this.popupManager.addPopup(e.x, e.y - 12, `+${addedScore}`, '#00ffaa');
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
          if (this.player.takeDamage(eb.damage, this.particles, this.screenShake)) {
            soundEngine.playExplosion();
          }
          eb.dead = true;
        }

        for (let r of this.relays) {
          if (!r.dead && Math.hypot(eb.x - r.x, eb.y - r.y) < (eb.size + r.size) * 0.6) {
            r.takeDamage(eb.damage, this.particles);
            eb.dead = true;
          }
        }

        if (eb.dead) fastRemove(this.enemyBullets, i);
      }

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        e.update(this.player, this.arenaBounds, this.enemyBullets, this.particles, dt, enemySlowMoFactor, this.relays);

        const distPlayer = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (distPlayer < (e.size + this.player.size) * 0.6) {
          if (this.player.takeDamage(12, this.particles, this.screenShake)) {
            soundEngine.playExplosion();
          }
        }

        for (let r of this.relays) {
          if (!r.dead && Math.hypot(e.x - r.x, e.y - r.y) < (e.size + r.size) * 0.6) {
            r.takeDamage(8 * dt, this.particles);
          }
        }
      }
    }

    render() {
      const offCtx = this.renderer.getContext();
      this.renderer.clear();

      offCtx.save();
      if (this.screenShake && this.screenShake.intensity > 0.1) {
        offCtx.translate(Math.floor(this.screenShake.offsetX), Math.floor(this.screenShake.offsetY));
      }

      this.renderer.drawArenaGrid(this.arenaBounds, this.ventPad, this.reactorHeat);
      this.debrisManager.draw(offCtx);

      if (this.waveManager) this.waveManager.drawDoors(offCtx);
      if (this.crateManager) this.crateManager.draw(offCtx);
      for (let r of this.relays) if (!r.dead) r.draw(offCtx, this.ventPad);

      if (this.player && (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED)) {
        this.renderer.drawPixelDottedLaser(
          Math.floor(this.player.x),
          Math.floor(this.player.y),
          Math.floor(this.mousePos.x),
          Math.floor(this.mousePos.y),
          this.player.weaponJammedTimer > 0 ? '#ff3366' : '#00f0ff'
        );
      }

      for (let i = 0; i < this.enemies.length; i++) this.enemies[i].draw(offCtx);
      for (let i = 0; i < this.bullets.length; i++) this.bullets[i].draw(offCtx);
      for (let i = 0; i < this.enemyBullets.length; i++) this.enemyBullets[i].draw(offCtx);
      if (this.player && (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED)) {
        this.player.draw(offCtx, this.currentPowerTier);
      }

      this.particles.draw(offCtx);
      this.popupManager.draw(offCtx);

      const lights = [];
      if (this.player) lights.push({ x: Math.floor(this.player.x), y: Math.floor(this.player.y), radius: 20, color: 'rgba(0, 240, 255, 0.25)' });
      if (this.ventPad) lights.push({ x: Math.floor(this.ventPad.x), y: Math.floor(this.ventPad.y), radius: 24, color: this.reactorHeat > 50 ? 'rgba(255, 51, 102, 0.45)' : 'rgba(255, 110, 0, 0.35)' });
      for (let r of this.relays) {
        if (!r.dead) lights.push({ x: Math.floor(r.x), y: Math.floor(r.y), radius: 18, color: 'rgba(0, 240, 255, 0.35)' });
      }
      if (this.crateManager && this.crateManager.activeCrate) {
        const c = this.crateManager.activeCrate;
        lights.push({ x: Math.floor(c.x), y: Math.floor(c.y), radius: 18, color: c.isGolden ? 'rgba(255, 204, 0, 0.45)' : 'rgba(0, 240, 255, 0.3)' });
      }
      for (let i = 0; i < this.bullets.length; i++) {
        const b = this.bullets[i];
        lights.push({ x: Math.floor(b.x), y: Math.floor(b.y), radius: 8, color: 'rgba(255, 255, 255, 0.2)' });
      }
      for (let i = 0; i < this.enemyBullets.length; i++) {
        const eb = this.enemyBullets[i];
        lights.push({ x: Math.floor(eb.x), y: Math.floor(eb.y), radius: 10, color: 'rgba(255, 51, 102, 0.35)' });
      }
      this.renderer.drawDynamicLighting(lights);

      if (this.state === GAME_STATES.PLAYING) {
        offCtx.strokeStyle = '#00f0ff';
        offCtx.lineWidth = 1;
        const cx = Math.floor(this.mousePos.x);
        const cy = Math.floor(this.mousePos.y);
        offCtx.strokeRect(cx - 3, cy - 3, 6, 6);
      }

      this.renderer.drawInEngineHUD(this);

      offCtx.restore();

      if (this.state === GAME_STATES.TITLE) this.renderer.drawInEngineTitleScreen();
      else if (this.state === GAME_STATES.PAUSED) this.renderer.drawInEnginePauseScreen();
      else if (this.state === GAME_STATES.GAMEOVER) this.renderer.drawInEngineGameOverScreen(this.score);

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