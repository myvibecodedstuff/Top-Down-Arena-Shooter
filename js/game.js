
(function() {
  'use strict';

  function fastRemove(arr, index) {
    const last = arr.pop();
    if (index < arr.length) arr[index] = last;
  }

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
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

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.7;

        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
        this.initialized = true;
      } catch (e) {
        console.warn("Audio Context init failed:", e);
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    playPistol() {
      if (!this.initialized) return;
      this.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    }

    playShotgun() {
      if (!this.initialized) return;
      this.resume();
      const bufferSize = (this.ctx.sampleRate * 0.15) | 0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

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
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    }

    playRocket() {
      if (!this.initialized) return;
      this.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    }

    playPickup() {
      if (!this.initialized) return;
      this.resume();
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);
        gain.gain.setValueAtTime(0.4, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.03 + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now + idx * 0.03);
        osc.stop(now + idx * 0.03 + 0.1);
      });
    }

    playExplosion() {
      if (!this.initialized) return;
      this.resume();
      const bufferSize = (this.ctx.sampleRate * 0.25) | 0;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start();
    }
  }

  const soundEngine = new SoundEngine();

  const WEAPONS = [
    {
      name: 'DUAL PISTOLS', color: '#00f0ff',
      fireRate: 90, spread: 0.06, speed: 11.0, damage: 20,
      bullets: 1, size: 3, recoil: 0.5,
      sound: () => soundEngine.playPistol()
    },
    {
      name: 'HEAVY SHOTGUN', color: '#ffcc00',
      fireRate: 280, spread: 0.45, speed: 8.5, damage: 18,
      bullets: 10, size: 3, recoil: 2.5, knockback: 5.0,
      sound: () => soundEngine.playShotgun()
    },
    {
      name: 'BOUNCING DISC', color: '#d828a0',
      fireRate: 200, spread: 0.08, speed: 7.5, damage: 40,
      bullets: 1, size: 6, bouncing: true, bouncesLeft: 5, piercing: true, recoil: 1.0,
      sound: () => soundEngine.playShotgun()
    },
    {
      name: 'ROCKET LAUNCHER', color: '#ff6e00',
      fireRate: 350, spread: 0.15, speed: 6.5, damage: 100,
      bullets: 1, size: 6, explosive: true, recoil: 3.5,
      sound: () => soundEngine.playRocket()
    },
    {
      name: 'DEATH BEAM', color: '#ff3366',
      fireRate: 50, spread: 0.02, speed: 16.0, damage: 25,
      bullets: 1, size: 4, piercing: true, recoil: 0.8,
      sound: () => soundEngine.playLaser()
    }
  ];

  class Bullet {
    constructor(x, y, vx, vy, weapon) {
      this.x = x; this.y = y;
      this.vx = vx; this.vy = vy;
      this.weapon = weapon;
      this.color = weapon.color;
      this.size = weapon.size || 3;
      this.damage = weapon.damage || 10;
      this.piercing = weapon.piercing || false;
      this.bouncing = weapon.bouncing || false;
      this.bouncesLeft = weapon.bouncesLeft || 0;
      this.explosive = weapon.explosive || false;
      this.lifeFrames = 0; this.maxLife = 120;
      this.dead = false;
    }

    update(bounds, particles, dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.lifeFrames += dt;

      if (this.lifeFrames >= this.maxLife) this.dead = true;

      const px = Math.floor(this.x);
      const py = Math.floor(this.y);

      if (px <= bounds.x || px >= bounds.x + bounds.w) {
        if (this.bouncing && this.bouncesLeft > 0) {
          this.vx *= -1; this.bouncesLeft--;
        } else this.dead = true;
      }

      if (py <= bounds.y || py >= bounds.y + bounds.h) {
        if (this.bouncing && this.bouncesLeft > 0) {
          this.vy *= -1; this.bouncesLeft--;
        } else this.dead = true;
      }

      if (Math.random() < 0.4 && particles) {
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
    constructor(bounds) {
      this.bounds = bounds;
      this.activeCrate = null;
      this.cratesCollected = 0;
    }

    spawnCrate() {
      const pad = 24;
      const x = Math.floor(this.bounds.x + pad + Math.random() * (this.bounds.w - pad * 2));
      const y = Math.floor(this.bounds.y + pad + Math.random() * (this.bounds.h - pad * 2));
      this.activeCrate = { x, y, size: 12, timer: 0, pulseY: 0 };
    }

    update(player, particles, popups, game, dt) {
      if (!this.activeCrate) { this.spawnCrate(); return; }

      const c = this.activeCrate;
      c.timer += dt;
      c.pulseY = Math.floor(Math.sin(c.timer * 0.1) * 2.0);

      const dx = player.x - c.x;
      const dy = player.y - c.y;
      const dist = Math.hypot(dx, dy);

      if (dist < (player.size + c.size) * 0.7) {
        this.cratesCollected++;
        soundEngine.playPickup();

        player.hp = Math.min(100, player.hp + 20);
        game.escalatePower();

        const newWeapon = WEAPONS[(Math.random() * WEAPONS.length) | 0];
        player.equipWeapon(newWeapon);

        const scoreGain = 100 * game.powerLevel;
        game.addScore(scoreGain);

        if (popups) popups.addPopup(c.x, c.y - 10, `+${scoreGain}`, '#ffcc00');

        if (particles) {
          for (let i = 0; i < 24; i++) {
            const ang = (Math.PI * 2 * i) / 24;
            const spd = 2 + Math.random() * 3;
            particles.addParticle(c.x, c.y, Math.cos(ang) * spd, Math.sin(ang) * spd, '#ffcc00', 2, 20);
          }
        }

        this.spawnCrate();
      }
    }

    draw(ctx) {
      if (!this.activeCrate) return;
      const c = this.activeCrate;
      const cx = Math.floor(c.x);
      const drawY = Math.floor(c.y + c.pulseY);
      const half = c.size >> 1;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(cx - half, Math.floor(c.y) + half - 1, c.size, 3);

      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(cx - half, drawY - half, c.size, c.size);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - half + 1, drawY - half + 1, c.size - 2, 1);
      ctx.fillRect(cx - half + 1, drawY - half + 1, 1, c.size - 2);

      ctx.fillStyle = '#000000';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📦', cx, drawY + 1);
    }
  }

  class DebrisManager {
    constructor() { this.corpses = []; }
    addCorpse(x, y, color, size) {
      this.corpses.push({ x: Math.floor(x), y: Math.floor(y), color, size, life: 300 });
      if (this.corpses.length > 200) this.corpses.shift();
    }
    update(dt) {
      for (let i = this.corpses.length - 1; i >= 0; i--) {
        const c = this.corpses[i];
        c.life -= dt;
        if (c.life <= 0) fastRemove(this.corpses, i);
      }
    }
    draw(ctx) {
      for (let i = 0; i < this.corpses.length; i++) {
        const c = this.corpses[i];
        const sz = c.size;
        ctx.fillStyle = c.color;
        ctx.globalAlpha = Math.max(0, c.life / 300) * 0.7;
        ctx.fillRect(c.x - (sz >> 1), c.y - (sz >> 1), sz, sz - 2);
      }
      ctx.globalAlpha = 1.0;
    }
  }

  class PopupManager {
    constructor() { this.popups = []; }
    addPopup(x, y, text, color = '#ffffff') {
      this.popups.push({ x: Math.floor(x), y: Math.floor(y), text, color, life: 40 });
    }
    update(dt) {
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const p = this.popups[i];
        p.y -= 0.3 * dt;
        p.life -= dt;
        if (p.life <= 0) fastRemove(this.popups, i);
      }
    }
    draw(ctx) {
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      for (let i = 0; i < this.popups.length; i++) {
        const p = this.popups[i];
        ctx.fillStyle = '#000000';
        ctx.fillText(p.text, Math.floor(p.x) + 1, Math.floor(p.y) + 1);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, Math.floor(p.x), Math.floor(p.y));
      }
    }
  }

  class Player {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.size = 10;
      this.speed = 2.5;
      this.currentWeapon = WEAPONS[0];
      this.aimAngle = 0;
      this.lastShotTime = 0;
      this.hp = 100;
      this.invuln = 0;
    }

    equipWeapon(w) { this.currentWeapon = w; }

    takeDamage(amount, particles, screenShake) {
      if (this.invuln > 0) return false;
      this.hp -= amount;
      this.invuln = 45;
      if (screenShake) screenShake.addShake(5);
      if (particles) {
        for (let i = 0; i < 14; i++) {
          const ang = Math.random() * Math.PI * 2;
          particles.addParticle(this.x, this.y, Math.cos(ang) * 2.5, Math.sin(ang) * 2.5, '#ff3366', 2.5, 18);
        }
      }
      return true;
    }

    update(keys, mousePos, bounds, bullets, particles, screenShake, dt) {
      if (this.invuln > 0) this.invuln -= dt;

      let moveX = 0, moveY = 0;
      if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

      if (moveX !== 0 && moveY !== 0) { moveX *= 0.7071; moveY *= 0.7071; }

      this.x += moveX * this.speed * dt;
      this.y += moveY * this.speed * dt;

      const pad = this.size / 2;
      this.x = Math.max(bounds.x + pad, Math.min(bounds.x + bounds.w - pad, this.x));
      this.y = Math.max(bounds.y + pad, Math.min(bounds.y + bounds.h - pad, this.y));

      if (mousePos) {
        this.aimAngle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
      }

      const now = performance.now();
      if (mousePos && mousePos.isDown && now - this.lastShotTime >= this.currentWeapon.fireRate) {
        this.lastShotTime = now;
        this.fireWeapon(bullets, particles, screenShake);
      }
    }

    fireWeapon(bullets, particles, screenShake) {
      const w = this.currentWeapon;
      w.sound();

      if (screenShake && w.recoil > 1) screenShake.addShake(w.recoil * 0.5);

      const count = w.bullets || 1;
      for (let i = 0; i < count; i++) {
        const spreadAngle = (Math.random() - 0.5) * w.spread;
        const finalAngle = this.aimAngle + spreadAngle;
        const vx = Math.cos(finalAngle) * w.speed;
        const vy = Math.sin(finalAngle) * w.speed;

        bullets.push(new Bullet(
          this.x + Math.cos(this.aimAngle) * 6,
          this.y + Math.sin(this.aimAngle) * 6,
          vx, vy, w
        ));
      }
    }

    draw(ctx, powerLevel) {
      if (this.invuln > 0 && (((this.invuln / 3) | 0) % 2 === 0)) return;

      const px = Math.floor(this.x);
      const py = Math.floor(this.y);

      ctx.fillStyle = '#ffcc00';
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

      ctx.fillStyle = '#ffcc00';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('★'.repeat(Math.min(5, powerLevel)), px, py - 7);
    }
  }

  class Enemy {
    constructor(x, y, speedMult = 1.0) {
      this.x = x; this.y = y;
      this.hp = 16;
      this.speed = (1.2 + Math.random() * 0.4) * speedMult;
      this.size = 8;
      this.color = '#ff3366';
      this.dead = false;
      this.flashFrames = 0;
    }

    takeDamage(amount, particles, screenShake, debris, popups, hitstopCallback) {
      this.hp -= amount;
      this.flashFrames = 4;

      if (popups) popups.addPopup(this.x, this.y - 6, `-${amount}`, '#ff3366');

      if (this.hp <= 0) {
        this.dead = true;
        soundEngine.playExplosion();
        if (screenShake) screenShake.addShake(3);
        if (hitstopCallback) hitstopCallback(3);

        if (debris) debris.addCorpse(this.x, this.y, this.color, this.size);

        if (particles) {
          for (let i = 0; i < 14; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 1 + Math.random() * 3.5;
            particles.addParticle(this.x, this.y, Math.cos(ang) * spd, Math.sin(ang) * spd, this.color, 2, 18);
          }
        }
      }
    }

    update(player, bounds, dt) {
      if (this.flashFrames > 0) this.flashFrames -= dt;

      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;

      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;

      const pad = this.size / 2;
      this.x = Math.max(bounds.x + pad, Math.min(bounds.x + bounds.w - pad, this.x));
      this.y = Math.max(bounds.y + pad, Math.min(bounds.y + bounds.h - pad, this.y));
    }

    draw(ctx) {
      const ex = Math.floor(this.x);
      const ey = Math.floor(this.y);
      const half = this.size >> 1;

      ctx.fillStyle = this.flashFrames > 0 ? '#ffffff' : this.color;
      ctx.fillRect(ex - half, ey - half, this.size, this.size);

      ctx.fillStyle = '#000000';
      ctx.fillRect(ex - 2, ey - 2, 4, 4);
    }
  }

  class ScreenShake {
    constructor() { this.intensity = 0; this.offsetX = 0; this.offsetY = 0; }
    addShake(amount) { this.intensity = Math.min(8, this.intensity + amount); }
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
      this.particles.push({ x: Math.floor(x), y: Math.floor(y), vx, vy, color, size: Math.floor(size), life, maxLife: life });
      if (this.particles.length > 200) fastRemove(this.particles, 0);
    }
    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) fastRemove(this.particles, i);
      }
    }
    draw(ctx) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      }
      ctx.globalAlpha = 1.0;
    }
  }

  class Renderer {
    constructor(w = 320, h = 224) {
      this.width = w; this.height = h;
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = w;
      this.offscreenCanvas.height = h;
      this.offCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
      this.offCtx.imageRendering = 'pixelated';
    }

    getContext() { return this.offCtx; }

    clear() {
      this.offCtx.fillStyle = '#080418';
      this.offCtx.fillRect(0, 0, this.width, this.height);
    }

    drawArena(bounds) {
      const ctx = this.offCtx;
      ctx.fillStyle = '#1c0d38';
      ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);

      ctx.strokeStyle = '#3d1a68'; ctx.lineWidth = 1;
      for (let x = bounds.x; x < bounds.x + bounds.w; x += 16) {
        ctx.beginPath(); ctx.moveTo(x, bounds.y); ctx.lineTo(x, bounds.y + bounds.h); ctx.stroke();
      }
      for (let y = bounds.y; y < bounds.y + bounds.h; y += 16) {
        ctx.beginPath(); ctx.moveTo(bounds.x, y); ctx.lineTo(bounds.x + bounds.w, y); ctx.stroke();
      }

      ctx.strokeStyle = '#d828a0'; ctx.lineWidth = 2;
      ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);
    }

    drawHUD(game) {
      const ctx = this.offCtx;
      ctx.font = '8px "Press Start 2P"';
      ctx.textBaseline = 'top';

      ctx.fillStyle = '#ffcc00';
      ctx.textAlign = 'left';
      ctx.fillText(`🏆${game.score.toString().padStart(6, '0')}`, 10, 4);

      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`PWR: ${'★'.repeat(game.powerLevel)}`, 120, 4);

      const hpPct = Math.max(0, Math.ceil(game.player ? game.player.hp : 100));
      ctx.fillStyle = hpPct > 30 ? '#00ffaa' : '#ff3366';
      ctx.textAlign = 'right';
      ctx.fillText(`❤️${hpPct}%`, 310, 4);
    }

    drawTitleScreen() {
      const ctx = this.offCtx;
      ctx.fillStyle = 'rgba(8, 4, 24, 0.94)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.font = '12px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#ffcc00';
      ctx.fillText('CRATE ARENA', 160, 65);

      ctx.fillStyle = '#d828a0';
      ctx.font = '8px "Press Start 2P"';
      ctx.fillText('MORE POWER = MORE RESPONSIBILITY', 160, 95);

      if (((performance.now() / 400) | 0) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PRESS SPACE / CLICK TO START', 160, 150);
      }
    }

    drawGameOverScreen(score) {
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

    renderToScreen(screenCtx, mainW, mainH, screenShake) {
      screenCtx.save();
      screenCtx.fillStyle = '#000000';
      screenCtx.fillRect(0, 0, mainW, mainH);
      screenCtx.imageSmoothingEnabled = false;

      const shakeX = screenShake ? Math.floor(screenShake.offsetX) : 0;
      const shakeY = screenShake ? Math.floor(screenShake.offsetY) : 0;

      screenCtx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height, shakeX, shakeY, mainW, mainH);
      screenCtx.restore();
    }
  }

  const STATES = { TITLE: 'TITLE', PLAYING: 'PLAYING', GAMEOVER: 'GAMEOVER' };

  class Game {
    constructor() {
      this.state = STATES.TITLE;
      this.mainCanvas = document.getElementById('game-canvas');
      this.mainCtx = this.mainCanvas.getContext('2d');

      this.renderer = new Renderer(320, 224);
      this.arenaBounds = { x: 8, y: 16, w: 304, h: 192 };

      this.particles = new ParticleSystem();
      this.screenShake = new ScreenShake();
      this.debris = new DebrisManager();
      this.popups = new PopupManager();

      this.player = null;
      this.crateManager = null;
      this.bullets = [];
      this.enemies = [];

      this.keys = {};
      this.mousePos = { x: 160, y: 112, isDown: false };

      this.score = 0;
      this.powerLevel = 1;
      this.spawnTimer = 0;
      this.hitstopFrames = 0;

      this.lastTime = performance.now();

      this.bindEvents();
      this.resizeCanvas();

      window.addEventListener('resize', () => this.resizeCanvas());
      requestAnimationFrame((t) => this.loop(t));
    }

    addScore(amt) { this.score += amt; }

    escalatePower() {
      if (this.powerLevel < 5) this.powerLevel++;
    }

    triggerHitstop(frames = 3) {
      this.hitstopFrames = Math.max(this.hitstopFrames, frames);
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

        if ((this.state === 'TITLE' || this.state === 'GAMEOVER' || this.state === 'TITLE' || this.state === 'GAMEOVER') && (e.code === 'Space' || e.code === 'Enter')) {
          this.startGame();
        }
        if (e.code === 'KeyQ' && window.parent !== window) window.parent.postMessage('NAV_PREV', '*');
        if (e.code === 'KeyE' && window.parent !== window) window.parent.postMessage('NAV_NEXT', '*');
        if ((this.state === STATES.TITLE || this.state === STATES.GAMEOVER) && (e.code === 'Space' || e.code === 'Enter')) {
          this.startGame();
        }
      });

      window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

      this.mainCanvas.addEventListener('mousemove', (e) => {
        const rect = this.mainCanvas.getBoundingClientRect();
        this.mousePos.x = Math.floor((e.clientX - rect.left) * (320 / rect.width));
        this.mousePos.y = Math.floor((e.clientY - rect.top) * (224 / rect.height));
      });

      this.mainCanvas.addEventListener('mousedown', (e) => {
        soundEngine.init();
        if (e.button === 0) {
          this.mousePos.isDown = true;
          if (this.state === STATES.TITLE || this.state === STATES.GAMEOVER) {
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
      this.bullets.length = 0;
      this.enemies.length = 0;
      this.particles = new ParticleSystem();
      this.debris = new DebrisManager();
      this.popups = new PopupManager();

      this.score = 0;
      this.powerLevel = 1;
      this.spawnTimer = 0;
      this.hitstopFrames = 0;
      this.lastTime = performance.now();

      this.state = STATES.PLAYING;
    }

    gameOver() {
      this.state = STATES.GAMEOVER;
      soundEngine.playExplosion();
    }

    update(dt) {
      if (this.state !== STATES.PLAYING) return;

      if (this.hitstopFrames > 0) {
        this.hitstopFrames -= dt;
        return;
      }

      this.screenShake.update(dt);
      this.particles.update(dt);
      this.debris.update(dt);
      this.popups.update(dt);

      this.player.update(this.keys, this.mousePos, this.arenaBounds, this.bullets, this.particles, this.screenShake, dt);
      if (this.player.hp <= 0) { this.gameOver(); return; }

      this.crateManager.update(this.player, this.particles, this.popups, this, dt);

      this.spawnTimer += dt;
      const spawnInterval = Math.max(12, 60 - this.powerLevel * 9);
      if (this.spawnTimer >= spawnInterval) {
        this.spawnTimer = 0;
        const doors = [
          { x: 160, y: 20 }, { x: 160, y: 204 },
          { x: 12, y: 112 }, { x: 308, y: 112 }
        ];
        const door = doors[(Math.random() * doors.length) | 0];
        const speedMult = 1.0 + (this.powerLevel - 1) * 0.22;
        this.enemies.push(new Enemy(door.x, door.y, speedMult));
      }

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.update(this.arenaBounds, this.particles, dt);

        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (Math.hypot(b.x - e.x, b.y - e.y) < (b.size + e.size) * 0.6) {
            e.takeDamage(b.damage, this.particles, this.screenShake, this.debris, this.popups, (f) => this.triggerHitstop(f));

            if (!b.piercing) b.dead = true;

            if (e.dead) {
              this.addScore(50 * this.powerLevel);
              fastRemove(this.enemies, j);
            }
            break;
          }
        }
        if (b.dead) fastRemove(this.bullets, i);
      }

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        e.update(this.player, this.arenaBounds, dt);

        if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < (e.size + this.player.size) * 0.6) {
          if (this.player.takeDamage(12, this.particles, this.screenShake)) {
            soundEngine.playExplosion();
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

      this.renderer.drawArena(this.arenaBounds);
      this.debris.draw(offCtx);

      if (this.crateManager) this.crateManager.draw(offCtx);

      for (let i = 0; i < this.enemies.length; i++) this.enemies[i].draw(offCtx);
      for (let i = 0; i < this.bullets.length; i++) this.bullets[i].draw(offCtx);
      if (this.player && this.state === STATES.PLAYING) this.player.draw(offCtx, this.powerLevel);

      this.particles.draw(offCtx);
      this.popups.draw(offCtx);

      if (this.state === STATES.PLAYING) {
        offCtx.strokeStyle = '#00f0ff';
        offCtx.lineWidth = 1;
        offCtx.strokeRect(Math.floor(this.mousePos.x) - 3, Math.floor(this.mousePos.y) - 3, 6, 6);
      }

      this.renderer.drawHUD(this);
      offCtx.restore();

      if (this.state === STATES.TITLE) this.renderer.drawTitleScreen();
      else if (this.state === STATES.GAMEOVER) this.renderer.drawGameOverScreen(this.score);

      this.renderer.renderToScreen(this.mainCtx, this.mainCanvas.width, this.mainCanvas.height, this.screenShake);
    }

    loop(t) {
      const dt = Math.min((t - this.lastTime) / 1000 * 60, 3.0);
      this.lastTime = t;
      this.update(dt);
      this.render();
      requestAnimationFrame((time) => this.loop(time));
    }
  }

  window.addEventListener('DOMContentLoaded', () => new Game());
})();