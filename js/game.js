
(function() {
  'use strict';

  const SAVE_KEY = 'crate_arena_release_save_v1';

  class SaveManager {
    constructor() {
      this.data = this.load();
    }
    load() {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        try { return JSON.parse(raw); } catch (e) {}
      }
      return {
        cash: 0,
        highScore: 0,
        selectedCharacter: 'COMMANDO',
        unlockedCharacters: ['COMMANDO'],
        upgrades: { hpBonus: 0, speedBonus: 0, startingBomb: 0 },
        achievements: []
      };
    }
    save() {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    }
    addCash(amount) {
      this.data.cash += Math.floor(amount);
      this.save();
    }
    spendCash(amount) {
      if (this.data.cash >= amount) {
        this.data.cash -= amount;
        this.save();
        return true;
      }
      return false;
    }
  }
  const saveManager = new SaveManager();

  const ACHIEVEMENTS = [
    { id: 'FIRST_CRATE', title: 'BOX OPENER', desc: 'Collect your first Arcade Crate.', icon: '📦' },
    { id: 'CRATE_STREAK_10', title: 'CRATE HOARDER', desc: 'Collect 10 Crates in a single run.', icon: '🏆' },
    { id: 'RAMPAGE_5', title: 'RAMPAGE!', desc: 'Achieve a 5x Combo Multiplier.', icon: '🔥' },
    { id: 'WAVE_5_CLEAR', title: 'SEASON 1 SURVIVOR', desc: 'Clear Wave 5 and defeat the Megabrain Boss.', icon: '👑' },
    { id: 'SMART_BOMB_NUKER', title: 'TOTAL CARNAGE', desc: 'Destroy 8+ enemies with a single Smart Bomb.', icon: '💣' },
    { id: 'UNTOUCHABLE', title: 'FLAWLESS CONTESTANT', desc: 'Clear a Wave without taking any damage.', icon: '✨' },
    { id: 'BFG_DESTRUCTION', title: 'VOID ANNIHILATION', desc: 'Defeat a Boss with the BFG Void Cannon.', icon: '🌌' },
    { id: 'PERK_MASTER', title: 'FULLY SPONSORED', desc: 'Acquire 3 TV Sponsorship Perks in a single run.', icon: '⚡' },
    { id: 'BARREL_EXPLODER', title: 'DEMOLITION EXPERT', desc: 'Destroy 5 Explosive Barrels.', icon: '💥' },
    { id: 'BIG_SPENDER', title: 'ARMORY PATRON', desc: 'Purchase your first permanent upgrade in the Shop.', icon: '💎' },
    { id: 'OVERDRIVE_CHAMPION', title: 'AUDIENCE FAVORITE', desc: 'Trigger 100% Audience Hype Overdrive Mode.', icon: '🌟' },
    { id: 'HIGH_SCORER', title: 'TV SHOW LEGEND', desc: 'Score 10,000+ Points in a single show.', icon: '🥇' }
  ];

  class AchievementManager {
    constructor() {
      this.toastContainer = null;
      this.setupUI();
    }
    setupUI() {
      let container = document.getElementById('achievement-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'achievement-toast-container';
        container.style.cssText = 'position:absolute; bottom:20px; right:20px; display:flex; flex-direction:column; gap:10px; z-index:100; pointer-events:none;';
        document.body.appendChild(container);
      }
      this.toastContainer = container;
    }
    unlock(id) {
      if (!saveManager.data.achievements.includes(id)) {
        saveManager.data.achievements.push(id);
        saveManager.save();
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (ach) this.showToast(ach);
      }
    }
    showToast(ach) {
      const toast = document.createElement('div');
      toast.style.cssText = 'background:#120e24; border:3px solid #ffe600; color:#fff; padding:12px 18px; border-radius:6px; font-family:"Press Start 2P",monospace; font-size:10px; box-shadow:0 0 20px rgba(255,230,0,0.4), 4px 4px 0 #000; display:flex; align-items:center; gap:12px; animation:toastSlideIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275);';
      toast.innerHTML = `<div style="font-size:24px;">${ach.icon}</div><div><div style="color:#ffe600; font-size:9px; margin-bottom:4px;">🏆 ACHIEVEMENT UNLOCKED!</div><div style="color:#00f0ff; font-size:11px;">${ach.title}</div><div style="font-family:'VT323',monospace; font-size:16px; color:#aaa; margin-top:2px;">${ach.desc}</div></div>`;
      this.toastContainer.appendChild(toast);
      setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, 3500);
    }
  }
  const achievementManager = new AchievementManager();

  const CHARACTERS = {
    COMMANDO: { id: 'COMMANDO', name: 'CYBER COMMANDO', title: 'THE BALANCED VETERAN', icon: '🎖️', price: 0, hp: 100, speed: 2.2, dashCooldown: 45, startingWeapon: 'PISTOL', desc: '+10% Speed & balanced combat.' },
    SPEED_DEMON: { id: 'SPEED_DEMON', name: 'SPEED DEMON', title: 'HYPER-AGILE DODGER', icon: '⚡', price: 500, hp: 75, speed: 2.8, dashCooldown: 25, startingWeapon: 'RAILGUN', desc: '-45% Dash cooldown & ultra fast speed.' },
    MECH_BRAWLER: { id: 'MECH_BRAWLER', name: 'MECH BRAWLER', title: 'ARMORED TANK', icon: '🛡️', price: 800, hp: 150, speed: 1.8, dashCooldown: 55, startingWeapon: 'SHOTGUN', desc: '+50% Max HP (150 HP) & heavy knockback.' },
    GLITCH_HACKER: { id: 'GLITCH_HACKER', name: 'GLITCH HACKER', title: 'TECH MANIPULATOR', icon: '👾', price: 1200, hp: 90, speed: 2.3, dashCooldown: 40, startingWeapon: 'MISSILE', desc: 'Auto-launches homing glitch bolts every 4s.' },
    PYROMANIAC: { id: 'PYROMANIAC', name: 'PYROMANIAC', title: 'INFERNO SPECIALIST', icon: '🔥', price: 1500, hp: 100, speed: 2.2, dashCooldown: 40, startingWeapon: 'FLAMETHROWER', desc: 'Leaves persistent flame trails on roll.' },
    CASH_MAGNET: { id: 'CASH_MAGNET', name: 'CASH MAGNET', title: 'RATINGS MILLIONAIRE', icon: '💎', price: 2000, hp: 85, speed: 2.3, dashCooldown: 40, startingWeapon: 'LIGHTNING', desc: '+100% Cash gain & Crates drift to player.' }
  };

  const BAYER_4X4 = [
    [ 0/16,  8/16,  2/16, 10/16],
    [12/16,  4/16, 14/16,  6/16],
    [ 3/16, 11/16,  1/16,  9/16],
    [15/16,  7/16, 13/16,  5/16]
  ];

  const PALETTES = {
    CYBERPUNK: { name: 'CYBERPUNK NEON', colors: [[10, 8, 20],[24, 20, 48],[64, 28, 96],[140, 32, 110],[255, 0, 85],[255, 80, 140],[0, 180, 216],[0, 240, 255],[16, 185, 129],[52, 211, 153],[251, 191, 36],[255, 230, 0],[244, 244, 245]] },
    AMBER: { name: 'CRT AMBER', colors: [[8, 5, 0],[30, 18, 0],[75, 45, 0],[130, 78, 0],[190, 114, 0],[245, 150, 0],[255, 190, 40],[255, 235, 160]] },
    GAMEBOY: { name: 'GAMEBOY GREEN', colors: [[15, 56, 15],[48, 98, 48],[139, 172, 15],[155, 188, 15]] },
    VOID: { name: 'VOID MONOCHROME', colors: [[10, 10, 12],[35, 35, 40],[75, 75, 85],[130, 130, 145],[195, 195, 210],[250, 250, 255]] }
  };

  let activePaletteName = 'CYBERPUNK';
  function setActivePalette(name) { if (PALETTES[name]) activePaletteName = name; }

  function quantizeColor(r, g, b, x, y, paletteName = activePaletteName, ditherStrength = 0.25) {
    const palette = PALETTES[paletteName].colors;
    const ditherValue = BAYER_4X4[y % 4][x % 4] - 0.5;
    const offset = ditherValue * ditherStrength * 255;
    const dr = Math.min(255, Math.max(0, r + offset));
    const dg = Math.min(255, Math.max(0, g + offset));
    const db = Math.min(255, Math.max(0, b + offset));

    let closest = palette[0];
    let minDistance = Infinity;
    for (let i = 0; i < palette.length; i++) {
      const c = palette[i];
      const dist = 0.3 * (dr - c[0]) ** 2 + 0.59 * (dg - c[1]) ** 2 + 0.11 * (db - c[2]) ** 2;
      if (dist < minDistance) { minDistance = dist; closest = c; }
    }
    return closest;
  }

  class SoundEngine {
    constructor() {
      this.ctx = null; this.masterGain = null; this.musicGain = null; this.sfxGain = null; this.initialized = false;
    }
    init() {
      if (this.initialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain(); this.masterGain.gain.value = 0.5;
        this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.35;
        this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.65;
        this.musicGain.connect(this.masterGain); this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
        this.initialized = true;
        this.startBackgroundMusic();
      } catch (e) {}
    }
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

    playPistol() {
      if (!this.initialized) return; this.resume();
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
      osc.type = 'square'; osc.frequency.setValueAtTime(480 + (Math.random() - 0.5) * 40, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain); gain.connect(this.sfxGain); osc.start(); osc.stop(this.ctx.currentTime + 0.08);
    }
    playShotgun() {
      if (!this.initialized) return; this.resume();
      const bufferSize = this.ctx.sampleRate * 0.18; const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource(); noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(1400, this.ctx.currentTime); filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.18);
      const gain = this.ctx.createGain(); gain.gain.setValueAtTime(0.8, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);
      noise.connect(filter); filter.connect(gain); gain.connect(this.sfxGain); noise.start();
    }
    playLaser() {
      if (!this.initialized) return; this.resume();
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(950, this.ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain); gain.connect(this.sfxGain); osc.start(); osc.stop(this.ctx.currentTime + 0.12);
    }
    playCratePickup() {
      if (!this.initialized) return; this.resume();
      const now = this.ctx.currentTime; const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0, now + idx * 0.04); gain.gain.linearRampToValueAtTime(0.45, now + idx * 0.04 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.04 + 0.14);
        osc.connect(gain); gain.connect(this.sfxGain); osc.start(now + idx * 0.04); osc.stop(now + idx * 0.04 + 0.14);
      });
    }
    playExplosion(pitch = 1.0) {
      if (!this.initialized) return; this.resume();
      const bufferSize = this.ctx.sampleRate * 0.3; const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource(); noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(800 * pitch, this.ctx.currentTime); filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);
      const gain = this.ctx.createGain(); gain.gain.setValueAtTime(0.85, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      noise.connect(filter); filter.connect(gain); gain.connect(this.sfxGain); noise.start();
    }
    playCrowdRoar() {
      if (!this.initialized) return; this.resume();
      const bufferSize = this.ctx.sampleRate * 0.5; const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource(); noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.setValueAtTime(450, this.ctx.currentTime); filter.Q.value = 1.2;
      const gain = this.ctx.createGain(); gain.gain.setValueAtTime(0.01, this.ctx.currentTime); gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 0.12); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
      noise.connect(filter); filter.connect(gain); gain.connect(this.sfxGain); noise.start();
    }
    playAnnouncerVoice() {
      if (!this.initialized) return; this.resume();
      const now = this.ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(130 + Math.random() * 90, now + i * 0.07);
        gain.gain.setValueAtTime(0.32, now + i * 0.07); gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.07 + 0.06);
        osc.connect(gain); gain.connect(this.sfxGain); osc.start(now + i * 0.07); osc.stop(now + i * 0.07 + 0.06);
      }
    }
    playSmartBomb() {
      if (!this.initialized) return; this.resume();
      const now = this.ctx.currentTime; const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
      gain.gain.setValueAtTime(0.6, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain); gain.connect(this.sfxGain); osc.start(now); osc.stop(now + 0.5);
    }
    startBackgroundMusic() {
      if (!this.initialized) return;
      const bassline = [110, 110, 146.83, 110, 164.81, 130.81, 110, 123.47]; let step = 0;
      setInterval(() => {
        if (!this.initialized) return;
        const now = this.ctx.currentTime; const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(bassline[step % bassline.length], now);
        const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(450, now);
        gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.connect(filter); filter.connect(gain); gain.connect(this.musicGain);
        osc.start(now); osc.stop(now + 0.12); step++;
      }, 150);
    }
  }
  const soundEngine = new SoundEngine();

  const WEAPONS = {
    PISTOL: { id: 'PISTOL', name: 'DUAL PISTOLS', color: '#00f0ff', fireRate: 130, spread: 0.08, speed: 10, damage: 18, bulletsPerShot: 1, size: 3, recoil: 1.5, sound: () => soundEngine.playPistol() },
    SHOTGUN: { id: 'SHOTGUN', name: 'SUPER SHOTGUN', color: '#ffe600', fireRate: 340, spread: 0.38, speed: 8.5, damage: 16, bulletsPerShot: 8, size: 2.5, recoil: 6, sound: () => soundEngine.playShotgun() },
    PLASMA: { id: 'PLASMA', name: 'PLASMA RIFLE', color: '#ff0055', fireRate: 75, spread: 0.12, speed: 12, damage: 13, bulletsPerShot: 1, size: 4, recoil: 1, sound: () => soundEngine.playLaser() },
    RAILGUN: { id: 'RAILGUN', name: 'HYPER RAILGUN', color: '#00ff66', fireRate: 450, spread: 0.01, speed: 20, damage: 90, bulletsPerShot: 1, size: 4, recoil: 8, piercing: true, sound: () => soundEngine.playLaser() },
    SAWBLADE: { id: 'SAWBLADE', name: 'BOUNCING SAW', color: '#a855f7', fireRate: 280, spread: 0.1, speed: 7, damage: 40, bulletsPerShot: 1, size: 6, bouncing: true, bouncesLeft: 4, recoil: 3, sound: () => soundEngine.playShotgun() },
    MISSILE: { id: 'MISSILE', name: 'MICRO MISSILE', color: '#ff9900', fireRate: 240, spread: 0.2, speed: 6.5, damage: 45, bulletsPerShot: 2, size: 5, explosive: true, recoil: 4, homing: true, sound: () => soundEngine.playPistol() },
    FLAMETHROWER: { id: 'FLAMETHROWER', name: 'FLAMETHROWER', color: '#ff3300', fireRate: 50, spread: 0.4, speed: 5.5, damage: 8, bulletsPerShot: 2, size: 5, recoil: 0.3, flame: true, sound: () => soundEngine.playLaser() },
    LIGHTNING: { id: 'LIGHTNING', name: 'CHAIN LIGHTNING', color: '#33ffff', fireRate: 110, spread: 0.15, speed: 14, damage: 22, bulletsPerShot: 1, size: 3.5, recoil: 1, chain: true, sound: () => soundEngine.playLaser() },
    BFG: { id: 'BFG', name: 'BFG VOID CANNON', color: '#00ff66', fireRate: 600, spread: 0.05, speed: 3.5, damage: 150, bulletsPerShot: 1, size: 10, recoil: 10, piercing: true, bfg: true, sound: () => soundEngine.playExplosion(0.5) }
  };

  class Bullet {
    constructor(x, y, vx, vy, weapon, isEnemy = false) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.weapon = weapon;
      this.color = isEnemy ? '#ff0033' : weapon.color; this.size = weapon.size || 3;
      this.damage = weapon.damage || 10; this.piercing = weapon.piercing || false;
      this.bouncing = weapon.bouncing || false; this.bouncesLeft = weapon.bouncesLeft || 0;
      this.isEnemy = isEnemy; this.life = 0; this.maxLife = 120; this.dead = false;
    }
    update(arenaBounds, particles, dt, enemies) {
      if (this.weapon.homing && enemies && enemies.length > 0 && !this.isEnemy) {
        let closest = null; let minDist = 150;
        for (let e of enemies) { const d = Math.hypot(e.x - this.x, e.y - this.y); if (d < minDist) { minDist = d; closest = e; } }
        if (closest) {
          const targetAngle = Math.atan2(closest.y - this.y, closest.x - this.x);
          const currentAngle = Math.atan2(this.vy, this.vx);
          const newAngle = currentAngle + (targetAngle - currentAngle) * 0.12 * dt;
          const spd = Math.hypot(this.vx, this.vy);
          this.vx = Math.cos(newAngle) * spd; this.vy = Math.sin(newAngle) * spd;
        }
      }
      this.x += this.vx * dt; this.y += this.vy * dt; this.life += dt;
      if (this.life >= this.maxLife) this.dead = true;
      if (this.x <= arenaBounds.x || this.x >= arenaBounds.x + arenaBounds.w) {
        if (this.bouncing && this.bouncesLeft > 0) { this.vx *= -1; this.bouncesLeft--; } else this.dead = true;
      }
      if (this.y <= arenaBounds.y || this.y >= arenaBounds.y + arenaBounds.h) {
        if (this.bouncing && this.bouncesLeft > 0) { this.vy *= -1; this.bouncesLeft--; } else this.dead = true;
      }
      if (Math.random() < 0.4 && particles) particles.addParticle(this.x, this.y, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, this.color, 2, 10);
    }
    draw(ctx) { ctx.fillStyle = this.color; ctx.fillRect(Math.round(this.x - this.size / 2), Math.round(this.y - this.size / 2), this.size, this.size); }
  }

  class CrateManager {
    constructor(arenaBounds) { this.arenaBounds = arenaBounds; this.activeCrate = null; this.cratesCollected = 0; }
    spawnCrate() {
      const padding = 24;
      const x = this.arenaBounds.x + padding + Math.random() * (this.arenaBounds.w - padding * 2);
      const y = this.arenaBounds.y + padding + Math.random() * (this.arenaBounds.h - padding * 2);
      const isGolden = Math.random() < 0.25;
      this.activeCrate = { x, y, size: 14, bounceTimer: 0, pulse: 0, timerRing: 480, maxTimerRing: 480, isGolden };
    }
    update(player, particles, uiManager, dt, popups, hitFreeze, perkManager) {
      if (!this.activeCrate) { this.spawnCrate(); return; }
      const crate = this.activeCrate;
      crate.bounceTimer += 0.08 * dt; crate.pulse = Math.sin(crate.bounceTimer) * 2.5; crate.timerRing -= dt;

      if ((perkManager && perkManager.hasPerk('CRATE_MAGNET')) || player.cashMagnet) {
        const dx = player.x - crate.x; const dy = player.y - crate.y; const dist = Math.hypot(dx, dy);
        if (dist < 130) { crate.x += (dx / dist) * 1.6 * dt; crate.y += (dy / dist) * 1.6 * dt; }
      }

      const dx = player.x - crate.x; const dy = player.y - crate.y; const dist = Math.hypot(dx, dy);
      if (dist < (player.size + crate.size) * 0.7) {
        this.cratesCollected++; achievementManager.unlock('FIRST_CRATE');
        if (this.cratesCollected >= 10) achievementManager.unlock('CRATE_STREAK_10');
        soundEngine.playCratePickup(); if (hitFreeze) hitFreeze(40);

        const weaponKeys = Object.keys(WEAPONS);
        let newKey = crate.isGolden ? (Math.random() < 0.5 ? 'BFG' : 'RAILGUN') : weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
        const newWeapon = WEAPONS[newKey]; player.equipWeapon(newWeapon);

        let scoreGain = 100 * player.comboMultiplier;
        if (perkManager && perkManager.hasPerk('DOUBLE_CASH')) scoreGain *= 2;
        if (player.cashMagnet) scoreGain *= 2;
        if (crate.timerRing > 240) scoreGain += 100;

        saveManager.addCash(scoreGain * 0.1);
        if (uiManager) { uiManager.showBanner(`CRATE #${this.cratesCollected}: ${newWeapon.name}!`, 1200); uiManager.addScore(scoreGain); }
        if (popups) popups.addPopup(crate.x, crate.y - 10, `+${scoreGain}`, crate.isGolden ? '#ffe600' : '#00f0ff');
        if (particles) {
          for (let i = 0; i < 28; i++) {
            const angle = (Math.PI * 2 * i) / 28; const spd = 2 + Math.random() * 3.5;
            particles.addParticle(crate.x, crate.y, Math.cos(angle) * spd, Math.sin(angle) * spd, crate.isGolden ? '#ffe600' : '#00f0ff', 3, 25);
          }
        }
        this.spawnCrate();
      }
      if (crate.timerRing <= 0) this.spawnCrate();
    }
    draw(ctx) {
      if (!this.activeCrate) return;
      const c = this.activeCrate; const drawY = c.y + c.pulse; const half = c.size / 2;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.fillRect(Math.round(c.x - half), Math.round(c.y + half - 2), c.size, 4);
      ctx.fillStyle = c.isGolden ? '#ffe600' : '#ff9900'; ctx.fillRect(Math.round(c.x - half), Math.round(drawY - half), c.size, c.size);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(c.x - half) + 0.5, Math.round(drawY - half) + 0.5, c.size - 1, c.size - 1);
      ctx.fillStyle = '#ffffff'; ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(c.isGolden ? '★' : '?', Math.round(c.x), Math.round(drawY + 1));
      const ringPct = Math.max(0, c.timerRing / c.maxTimerRing); ctx.strokeStyle = c.isGolden ? '#ffe600' : '#00f0ff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(Math.round(c.x), Math.round(drawY), 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringPct); ctx.stroke();
    }
  }

  class DebrisManager {
    constructor() { this.casings = []; this.splatters = []; }
    addCasing(x, y, angle) {
      const ejectAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.4; const spd = 1.5 + Math.random() * 1.5;
      this.casings.push({ x, y, vx: Math.cos(ejectAngle) * spd, vy: Math.sin(ejectAngle) * spd, life: 180, color: '#ffe600' });
      if (this.casings.length > 50) this.casings.shift();
    }
    addSplatter(x, y, color) {
      this.splatters.push({ x, y, size: 3 + Math.random() * 3, color, life: 240 });
      if (this.splatters.length > 80) this.splatters.shift();
    }
    update(dt) {
      for (let i = this.casings.length - 1; i >= 0; i--) {
        const c = this.casings[i]; c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= Math.pow(0.85, dt); c.vy *= Math.pow(0.85, dt); c.life -= dt;
        if (c.life <= 0) this.casings.splice(i, 1);
      }
      for (let i = this.splatters.length - 1; i >= 0; i--) {
        const s = this.splatters[i]; s.life -= dt; if (s.life <= 0) this.splatters.splice(i, 1);
      }
    }
    draw(ctx) {
      for (let s of this.splatters) { ctx.fillStyle = s.color; ctx.globalAlpha = Math.max(0, s.life / 240) * 0.6; ctx.fillRect(Math.round(s.x - s.size / 2), Math.round(s.y - s.size / 2), s.size, s.size); }
      ctx.globalAlpha = 1.0;
      for (let c of this.casings) { ctx.fillStyle = c.color; ctx.globalAlpha = Math.max(0, c.life / 180); ctx.fillRect(Math.round(c.x), Math.round(c.y), 2, 1); }
      ctx.globalAlpha = 1.0;
    }
  }

  class PopupManager {
    constructor() { this.popups = []; }
    addPopup(x, y, text, color = '#ffffff') { this.popups.push({ x, y, text, color, vy: -0.8, life: 45 }); }
    update(dt) {
      for (let i = this.popups.length - 1; i >= 0; i--) {
        const p = this.popups[i]; p.y += p.vy * dt; p.life -= dt; if (p.life <= 0) this.popups.splice(i, 1);
      }
    }
    draw(ctx) {
      ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'center';
      for (let p of this.popups) {
        ctx.fillStyle = '#000000'; ctx.fillText(p.text, Math.round(p.x) + 1, Math.round(p.y) + 1);
        ctx.fillStyle = p.color; ctx.fillText(p.text, Math.round(p.x), Math.round(p.y));
      }
    }
  }

  class Player {
    constructor(x, y, charKey) {
      const charDef = CHARACTERS[charKey] || CHARACTERS.COMMANDO;
      this.x = x; this.y = y; this.size = 10;
      this.speed = charDef.speed;
      this.currentWeapon = WEAPONS[charDef.startingWeapon] || WEAPONS.PISTOL;
      this.aimAngle = 0; this.lastShotTime = 0;
      this.hp = charDef.hp + (saveManager.data.upgrades.hpBonus || 0) * 15;
      this.maxHp = this.hp;
      this.invulnerableTimer = 0; this.comboMultiplier = 1; this.comboTimer = 0; this.killStreak = 0;
      this.smartBombs = 1 + (saveManager.data.upgrades.startingBomb || 0);
      this.dashCooldownMax = charDef.dashCooldown;
      this.isDashing = false; this.dashTimer = 0; this.dashCooldown = 0; this.dashVx = 0; this.dashVy = 0;
      this.charDef = charDef;
    }
    equipWeapon(w) { this.currentWeapon = w; }
    takeDamage(amount, particles) {
      if (this.invulnerableTimer > 0 || this.isDashing) return false;
      this.hp -= amount; this.invulnerableTimer = 35; this.comboMultiplier = 1; this.comboTimer = 0;
      if (particles) {
        for (let i = 0; i < 12; i++) {
          const ang = Math.random() * Math.PI * 2;
          particles.addParticle(this.x, this.y, Math.cos(ang) * 2, Math.sin(ang) * 2, '#ff0033', 2.5, 20);
        }
      }
      return true;
    }
    update(keys, mousePos, arenaBounds, bullets, particles, screenShake, dt, debris, perkManager) {
      if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
      const cooldownCap = perkManager && perkManager.hasPerk('OVERCLOCK_DASH') ? this.dashCooldownMax * 0.6 : this.dashCooldownMax;
      if (this.dashCooldown > 0) this.dashCooldown -= dt;

      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) { this.comboMultiplier = 1; this.killStreak = 0; }
      }

      if (keys['Space'] || keys['ShiftLeft'] || keys['ShiftRight']) {
        if (!this.isDashing && this.dashCooldown <= 0) {
          let dx = 0, dy = 0;
          if (keys['KeyW'] || keys['ArrowUp']) dy -= 1; if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
          if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1; if (keys['KeyD'] || keys['ArrowRight']) dx += 1;
          if (dx !== 0 || dy !== 0) {
            const mag = Math.hypot(dx, dy); this.dashVx = (dx / mag) * 5.5; this.dashVy = (dy / mag) * 5.5;
            this.isDashing = true; this.dashTimer = 10; this.dashCooldown = cooldownCap;
          }
        }
      }

      if (this.isDashing) {
        this.x += this.dashVx * dt; this.y += this.dashVy * dt; this.dashTimer -= dt;
        if (this.dashTimer <= 0) this.isDashing = false;
        if (particles && Math.random() < 0.6) {
          particles.addParticle(this.x, this.y, 0, 0, this.charDef.id === 'PYROMANIAC' ? '#ff3300' : '#00f0ff', 3, 12);
        }
      } else {
        let moveX = 0, moveY = 0;
        if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1; if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1; if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;
        if (moveX !== 0 && moveY !== 0) { moveX *= 0.7071; moveY *= 0.7071; }
        this.x += moveX * this.speed * dt; this.y += moveY * this.speed * dt;
      }

      const pad = this.size / 2;
      this.x = Math.max(arenaBounds.x + pad, Math.min(arenaBounds.x + arenaBounds.w - pad, this.x));
      this.y = Math.max(arenaBounds.y + pad, Math.min(arenaBounds.y + arenaBounds.h - pad, this.y));

      if (mousePos) this.aimAngle = Math.atan2(mousePos.y - this.y, mousePos.x - this.x);
      const now = performance.now();
      if (mousePos && mousePos.isDown && now - this.lastShotTime >= this.currentWeapon.fireRate) {
        this.lastShotTime = now; this.fireWeapon(bullets, particles, screenShake, debris);
      }
    }
    fireWeapon(bullets, particles, screenShake, debris) {
      const w = this.currentWeapon; w.sound();
      if (screenShake && w.recoil > 2) screenShake.addShake(w.recoil * 0.8);
      if (debris) debris.addCasing(this.x, this.y, this.aimAngle);
      const count = w.bulletsPerShot || 1;
      for (let i = 0; i < count; i++) {
        const spreadAngle = (Math.random() - 0.5) * w.spread; const finalAngle = this.aimAngle + spreadAngle;
        const vx = Math.cos(finalAngle) * w.speed; const vy = Math.sin(finalAngle) * w.speed;
        bullets.push(new Bullet(this.x + Math.cos(this.aimAngle) * 6, this.y + Math.sin(this.aimAngle) * 6, vx, vy, w, false));
        if (particles) particles.addParticle(this.x + Math.cos(this.aimAngle) * 8, this.y + Math.sin(this.aimAngle) * 8, vx * 0.2 + (Math.random() - 0.5), vy * 0.2 + (Math.random() - 0.5), w.color, 2.5, 10);
      }
    }
    draw(ctx) {
      if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 3) % 2 === 0) return;
      const half = this.size / 2;
      ctx.fillStyle = this.isDashing ? '#00f0ff' : '#ffe600';
      ctx.fillRect(Math.round(this.x - half), Math.round(this.y - half), this.size, this.size);
      ctx.fillStyle = '#000000';
      const eyeX = this.x + Math.cos(this.aimAngle) * 3; const eyeY = this.y + Math.sin(this.aimAngle) * 3;
      ctx.fillRect(Math.round(eyeX - 1.5), Math.round(eyeY - 1.5), 3, 3);
      ctx.strokeStyle = this.currentWeapon.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(Math.round(this.x), Math.round(this.y));
      ctx.lineTo(Math.round(this.x + Math.cos(this.aimAngle) * 10), Math.round(this.y + Math.sin(this.aimAngle) * 10)); ctx.stroke();
    }
  }

  const ENEMY_TYPES = {
    SWARMER: { name: 'SWARMER BUG', hp: 20, speed: 1.8, size: 8, color: '#ff0055', scoreValue: 50, behavior: 'chase' },
    CHARGER: { name: 'CYBORG BULL', hp: 60, speed: 1.2, chargeSpeed: 4.5, size: 12, color: '#ff9900', scoreValue: 150, behavior: 'charge' },
    TURRET: { name: 'ARENA TURRET', hp: 45, speed: 0.5, size: 10, color: '#a855f7', scoreValue: 200, behavior: 'shoot' },
    TITAN: { name: 'MECHA TITAN', hp: 180, speed: 0.7, size: 16, color: '#00ff66', scoreValue: 400, behavior: 'heavy' },
    BOSS: { name: 'BROADCAST MEGABRAIN', hp: 850, speed: 0.6, size: 26, color: '#ffe600', scoreValue: 2500, behavior: 'boss' }
  };

  class Enemy {
    constructor(x, y, type) {
      this.x = x; this.y = y; this.type = type; this.hp = type.hp; this.maxHp = type.hp;
      this.speed = type.speed; this.size = type.size; this.color = type.color; this.dead = false;
      this.chargeTimer = 0; this.isCharging = false; this.chargeDirX = 0; this.chargeDirY = 0;
      this.shootTimer = 0; this.flashTimer = 0; this.squishX = 1; this.squishY = 1;
    }
    takeDamage(amount, particles, screenShake, debris, popups) {
      this.hp -= amount; this.flashTimer = 5; this.squishX = 1.3; this.squishY = 0.7;
      if (popups) popups.addPopup(this.x, this.y - 6, `-${amount}`, '#ff0055');
      if (particles) {
        for (let i = 0; i < 4; i++) {
          const ang = Math.random() * Math.PI * 2;
          particles.addParticle(this.x, this.y, Math.cos(ang) * 1.5, Math.sin(ang) * 1.5, this.color, 2, 12);
        }
      }
      if (this.hp <= 0) {
        this.dead = true; soundEngine.playExplosion(this.type.behavior === 'boss' ? 0.5 : 1.0);
        if (screenShake) screenShake.addShake(this.type.behavior === 'boss' ? 14 : 4);
        if (debris) debris.addSplatter(this.x, this.y, this.color);
        if (particles) {
          for (let i = 0; i < 20; i++) {
            const ang = Math.random() * Math.PI * 2; const spd = 1 + Math.random() * 3.5;
            particles.addParticle(this.x, this.y, Math.cos(ang) * spd, Math.sin(ang) * spd, this.color, 3, 28);
          }
        }
      }
    }
    update(player, arenaBounds, enemyBullets, particles, dt) {
      if (this.flashTimer > 0) this.flashTimer -= dt;
      this.squishX += (1 - this.squishX) * 0.2; this.squishY += (1 - this.squishY) * 0.2;
      const dx = player.x - this.x; const dy = player.y - this.y; const dist = Math.hypot(dx, dy) || 1;

      switch (this.type.behavior) {
        case 'chase': this.x += (dx / dist) * this.speed * dt; this.y += (dy / dist) * this.speed * dt; break;
        case 'charge':
          if (!this.isCharging) {
            this.chargeTimer += dt; this.x += (dx / dist) * this.speed * dt; this.y += (dy / dist) * this.speed * dt;
            if (this.chargeTimer > 90 && dist < 140) { this.isCharging = true; this.chargeDirX = dx / dist; this.chargeDirY = dy / dist; this.chargeTimer = 0; }
          } else {
            this.x += this.chargeDirX * this.type.chargeSpeed * dt; this.y += this.chargeDirY * this.type.chargeSpeed * dt; this.chargeTimer += dt;
            if (this.chargeTimer > 35) { this.isCharging = false; this.chargeTimer = 0; }
          }
          break;
        case 'shoot':
          this.x += (dx / dist) * this.speed * dt; this.y += (dy / dist) * this.speed * dt; this.shootTimer += dt;
          if (this.shootTimer > 90) {
            this.shootTimer = 0;
            if (enemyBullets) enemyBullets.push(new Bullet(this.x, this.y, (dx / dist) * 3, (dy / dist) * 3, { size: 4, damage: 15, color: '#ff0033' }, true));
          }
          break;
        case 'heavy':
        case 'boss':
          this.x += (dx / dist) * this.speed * dt; this.y += (dy / dist) * this.speed * dt; this.shootTimer += dt;
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
      const w = this.size * this.squishX; const h = this.size * this.squishY;
      ctx.fillStyle = this.flashTimer > 0 ? '#ffffff' : this.color; ctx.fillRect(Math.round(this.x - w / 2), Math.round(this.y - h / 2), w, h);
      ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(this.x - w / 2) + 0.5, Math.round(this.y - h / 2) + 0.5, w - 1, h - 1);
    }
  }

  class WaveManager {
    constructor(arenaBounds) {
      this.arenaBounds = arenaBounds; this.waveNumber = 1; this.waveActive = false; this.enemiesRemainingInWave = 0; this.spawnTimer = 0;
      this.spawnerDoors = [
        { x: arenaBounds.x + arenaBounds.w / 2, y: arenaBounds.y + 4 },
        { x: arenaBounds.x + arenaBounds.w / 2, y: arenaBounds.y + arenaBounds.h - 4 },
        { x: arenaBounds.x + 4, y: arenaBounds.y + arenaBounds.h / 2 },
        { x: arenaBounds.x + arenaBounds.w - 4, y: arenaBounds.y + arenaBounds.h / 2 }
      ];
    }
    startNextWave(uiManager) {
      this.waveActive = true; this.enemiesRemainingInWave = 8 + this.waveNumber * 6;
      if (uiManager) {
        soundEngine.playAnnouncerVoice(); soundEngine.playCrowdRoar();
        const waveTitle = (this.waveNumber % 5 === 0) ? `WAVE ${this.waveNumber}: BOSS BATTLE!` : `WAVE ${this.waveNumber} - BEGIN!`;
        uiManager.showBanner(waveTitle, 2000);
      }
    }
    update(enemies, player, enemyBullets, particles, uiManager, dt, onWaveComplete) {
      if (!this.waveActive) return;
      this.spawnTimer += dt;
      if (this.enemiesRemainingInWave > 0 && this.spawnTimer >= Math.max(25, 70 - this.waveNumber * 4)) {
        this.spawnTimer = 0;
        const door = this.spawnerDoors[Math.floor(Math.random() * this.spawnerDoors.length)];
        let type = ENEMY_TYPES.SWARMER; const r = Math.random();
        if (this.waveNumber % 5 === 0 && this.enemiesRemainingInWave === 1) type = ENEMY_TYPES.BOSS;
        else if (this.waveNumber >= 3 && r < 0.25) type = ENEMY_TYPES.CHARGER;
        else if (this.waveNumber >= 2 && r < 0.45) type = ENEMY_TYPES.TURRET;
        else if (this.waveNumber >= 4 && r < 0.6) type = ENEMY_TYPES.TITAN;

        enemies.push(new Enemy(door.x, door.y, type)); this.enemiesRemainingInWave--;
        if (particles) { for (let i = 0; i < 8; i++) particles.addParticle(door.x, door.y, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, '#ff0055', 2, 15); }
      }

      if (this.enemiesRemainingInWave === 0 && enemies.length === 0) {
        this.waveActive = false;
        if (this.waveNumber === 5) achievementManager.unlock('WAVE_5_CLEAR');
        this.waveNumber++;
        if (uiManager) { soundEngine.playCrowdRoar(); uiManager.showBanner(`WAVE CLEAR! +1000 BONUS`, 2000); uiManager.addScore(1000); }
        if (onWaveComplete) onWaveComplete();
      }
    }
    drawDoors(ctx) {
      this.spawnerDoors.forEach(door => {
        ctx.fillStyle = '#ff0055'; ctx.fillRect(Math.round(door.x - 8), Math.round(door.y - 8), 16, 16);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(door.x - 4), Math.round(door.y - 4), 8, 8);
      });
    }
  }

  class ScreenShake {
    constructor() { this.intensity = 0; this.offsetX = 0; this.offsetY = 0; }
    addShake(amount) { this.intensity = Math.min(18, this.intensity + amount); }
    update(dt) {
      if (this.intensity > 0.1) {
        this.offsetX = (Math.random() - 0.5) * this.intensity; this.offsetY = (Math.random() - 0.5) * this.intensity;
        this.intensity *= Math.pow(0.86, dt);
      } else { this.intensity = 0; this.offsetX = 0; this.offsetY = 0; }
    }
  }

  class ParticleSystem {
    constructor() { this.particles = []; }
    addParticle(x, y, vx, vy, color, size, life) { this.particles.push({ x, y, vx, vy, color, size, life, maxLife: life }); }
    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.95, dt); p.vy *= Math.pow(0.95, dt); p.life -= dt;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }
    draw(ctx) {
      for (let p of this.particles) { ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life / p.maxLife); ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size); }
      ctx.globalAlpha = 1.0;
    }
  }

  class Renderer {
    constructor(width = 360, height = 240) {
      this.width = width; this.height = height;
      this.offscreenCanvas = document.createElement('canvas'); this.offscreenCanvas.width = width; this.offscreenCanvas.height = height;
      this.offCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true }); this.offCtx.imageRendering = 'pixelated';
      this.ditherEnabled = true;
    }
    getContext() { return this.offCtx; }
    clear() { this.offCtx.fillStyle = '#05040a'; this.offCtx.fillRect(0, 0, this.width, this.height); }
    drawArenaGrid(arenaBounds) {
      const ctx = this.offCtx; ctx.fillStyle = '#0a0814'; ctx.fillRect(arenaBounds.x, arenaBounds.y, arenaBounds.w, arenaBounds.h);
      ctx.strokeStyle = '#18142a'; ctx.lineWidth = 1;
      for (let x = arenaBounds.x; x < arenaBounds.x + arenaBounds.w; x += 16) { ctx.beginPath(); ctx.moveTo(x, arenaBounds.y); ctx.lineTo(x, arenaBounds.y + arenaBounds.h); ctx.stroke(); }
      for (let y = arenaBounds.y; y < arenaBounds.y + arenaBounds.h; y += 16) { ctx.beginPath(); ctx.moveTo(arenaBounds.x, y); ctx.lineTo(arenaBounds.x + arenaBounds.w, y); ctx.stroke(); }
      ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 2; ctx.strokeRect(arenaBounds.x, arenaBounds.y, arenaBounds.w, arenaBounds.h);
    }
    drawDynamicLighting(lights) {
      const ctx = this.offCtx; ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (let l of lights) {
        const rad = l.radius || 16; const grad = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, rad);
        grad.addColorStop(0, l.color); grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(l.x, l.y, rad, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    applyOrderedDithering() {
      if (!this.ditherEnabled) return;
      const imgData = this.offCtx.getImageData(0, 0, this.width, this.height); const data = imgData.data;
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const idx = (y * this.width + x) * 4;
          const quantized = quantizeColor(data[idx], data[idx + 1], data[idx + 2], x, y, activePaletteName, 0.25);
          data[idx] = quantized[0]; data[idx + 1] = quantized[1]; data[idx + 2] = quantized[2];
        }
      }
      this.offCtx.putImageData(imgData, 0, 0);
    }
    renderToScreen(screenCtx, mainWidth, mainHeight, screenShake) {
      screenCtx.save(); screenCtx.clearRect(0, 0, mainWidth, mainHeight); screenCtx.imageSmoothingEnabled = false;
      if (screenShake) screenCtx.translate(screenShake.offsetX, screenShake.offsetY);
      screenCtx.drawImage(this.offscreenCanvas, 0, 0, this.width, this.height, 0, 0, mainWidth, mainHeight); screenCtx.restore();
    }
  }

  class UIManager {
    constructor() {
      this.score = 0; this.bannerElement = document.getElementById('broadcast-banner'); this.bannerTimer = null;
    }
    addScore(amount) {
      this.score += amount;
      if (this.score > saveManager.data.highScore) {
        saveManager.data.highScore = this.score; saveManager.save();
      }
      if (this.score >= 10000) achievementManager.unlock('HIGH_SCORER');
      this.updateHUD();
    }
    resetScore() { this.score = 0; this.updateHUD(); }
    showBanner(text, duration = 1800) {
      if (!this.bannerElement) return;
      if (this.bannerTimer) clearTimeout(this.bannerTimer);
      this.bannerElement.innerText = text; this.bannerElement.classList.add('active');
      this.bannerTimer = setTimeout(() => this.bannerElement.classList.remove('active'), duration);
    }
    updateHUD(player, waveManager, crateManager, hypeMeter) {
      const elScore = document.getElementById('ui-score'); const elHiScore = document.getElementById('ui-hiscore');
      const elCrates = document.getElementById('ui-crates'); const elWeapon = document.getElementById('ui-weapon');
      const elHp = document.getElementById('ui-hp'); const elWave = document.getElementById('ui-wave');
      const elSmartBomb = document.getElementById('ui-smartbomb');

      if (elScore) elScore.innerText = this.score.toString().padStart(6, '0');
      if (elHiScore) elHiScore.innerText = saveManager.data.highScore.toString().padStart(6, '0');
      if (elCrates && crateManager) elCrates.innerText = crateManager.cratesCollected;
      if (elWeapon && player) elWeapon.innerText = player.currentWeapon.name;
      if (elHp && player) elHp.innerText = `${Math.max(0, Math.ceil(player.hp))}%`;
      if (elWave && waveManager) elWave.innerText = `WAVE ${waveManager.waveNumber}`;
      if (elSmartBomb && player) elSmartBomb.innerText = player.smartBombs > 0 ? `READY x${player.smartBombs} [E]` : 'EMPTY';

      const comboInner = document.getElementById('combo-bar-inner');
      if (comboInner && player) comboInner.style.width = `${Math.min(100, (player.comboTimer / 120) * 100)}%`;

      const hypeInner = document.getElementById('hype-bar-inner');
      if (hypeInner && hypeMeter) hypeInner.style.width = `${Math.min(100, hypeMeter)}%`;
    }
  }

  const GAME_STATES = { TITLE: 'TITLE', CHAR_SELECT: 'CHAR_SELECT', SHOP: 'SHOP', PLAYING: 'PLAYING', SELECT_PERK: 'SELECT_PERK', PAUSED: 'PAUSED', GAMEOVER: 'GAMEOVER' };

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
      this.activePerks = new Set();
      this.smartBombWaves = [];
      this.barrels = [];
      this.bullets = [];
      this.enemyBullets = [];
      this.enemies = [];

      this.hypeMeter = 0;
      this.isOverdrive = false;
      this.overdriveTimer = 0;

      this.keys = {};
      this.mousePos = { x: 180, y: 120, isDown: false };
      this.lastTime = performance.now();
      this.freezeFrames = 0;

      this.bindEvents();
      this.setupUI();
      this.resizeCanvas();

      window.addEventListener('resize', () => this.resizeCanvas());
      requestAnimationFrame((time) => this.loop(time));
    }

    triggerHitFreeze(frames = 3) { this.freezeFrames = Math.max(this.freezeFrames, frames); }

    triggerSmartBomb() {
      if (this.player && this.player.smartBombs > 0 && this.state === GAME_STATES.PLAYING) {
        this.player.smartBombs--; soundEngine.playSmartBomb(); soundEngine.playCrowdRoar();
        this.screenShake.addShake(15); this.triggerHitFreeze(10);
        this.smartBombWaves.push({ x: this.player.x, y: this.player.y, radius: 4, maxRadius: 260, speed: 12 });
        this.uiManager.showBanner('MEGA SMART BOMB!', 1800);
        if (this.enemies.length >= 8) achievementManager.unlock('SMART_BOMB_NUKER');
      }
    }

    spawnBarrels() {
      this.barrels = [
        { x: this.arenaBounds.x + 30, y: this.arenaBounds.y + 30, size: 12, hp: 25, isMoney: false, flashTimer: 0 },
        { x: this.arenaBounds.x + this.arenaBounds.w - 30, y: this.arenaBounds.y + 30, size: 12, hp: 25, isMoney: false, flashTimer: 0 },
        { x: this.arenaBounds.x + 30, y: this.arenaBounds.y + this.arenaBounds.h - 30, size: 12, hp: 15, isMoney: true, flashTimer: 0 }
      ];
    }

    resizeCanvas() {
      const wrapper = document.getElementById('canvas-wrapper');
      if (wrapper) { this.mainCanvas.width = wrapper.clientWidth; this.mainCanvas.height = wrapper.clientHeight; }
    }

    bindEvents() {
      window.addEventListener('keydown', (e) => {
        this.keys[e.code] = true;

        if ((this.state === 'TITLE' || this.state === 'GAMEOVER' || (typeof GAME_STATES !== 'undefined' && (this.state === GAME_STATES.TITLE || this.state === GAME_STATES.GAMEOVER))) && (e.code === 'Space' || e.code === 'Enter')) {
          this.startGame();
        }
        if (e.code === 'KeyQ' && window.parent !== window) window.parent.postMessage('NAV_PREV', '*');
        if (e.code === 'KeyE' && window.parent !== window) window.parent.postMessage('NAV_NEXT', '*');
        if (e.code === 'KeyP' && this.state === GAME_STATES.PLAYING) this.togglePause();
        if (e.code === 'KeyE') this.triggerSmartBomb();
      });
      window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
      this.mainCanvas.addEventListener('mousemove', (e) => {
        const rect = this.mainCanvas.getBoundingClientRect();
        this.mousePos.x = (e.clientX - rect.left) * (this.renderer.width / rect.width);
        this.mousePos.y = (e.clientY - rect.top) * (this.renderer.height / rect.height);
      });
      this.mainCanvas.addEventListener('mousedown', (e) => {
        soundEngine.init();
        if (e.button === 0) this.mousePos.isDown = true;
        if (e.button === 2) { e.preventDefault(); this.triggerSmartBomb(); }
      });
      this.mainCanvas.addEventListener('contextmenu', (e) => e.preventDefault());
      window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mousePos.isDown = false; });
    }

    setupUI() {
      document.getElementById('btn-start')?.addEventListener('click', () => this.startGame());
      document.getElementById('btn-restart')?.addEventListener('click', () => this.startGame());
      document.getElementById('btn-resume')?.addEventListener('click', () => this.togglePause());

      document.getElementById('btn-charselect')?.addEventListener('click', () => this.showCharSelect());
      document.getElementById('btn-charselect-back')?.addEventListener('click', () => this.hideOverlayScreen('screen-charselect'));

      document.getElementById('btn-shop')?.addEventListener('click', () => this.showShop());
      document.getElementById('btn-shop-back')?.addEventListener('click', () => this.hideOverlayScreen('screen-shop'));

      document.querySelectorAll('.palette-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active'); setActivePalette(e.target.getAttribute('data-palette'));
        });
      });
    }

    hideOverlayScreen(screenId) {
      document.getElementById(screenId)?.classList.add('hidden');
      document.getElementById('screen-title')?.classList.remove('hidden');
      this.state = GAME_STATES.TITLE;
    }

    showCharSelect() {
      this.state = GAME_STATES.CHAR_SELECT;
      document.getElementById('screen-title')?.classList.add('hidden');
      const container = document.getElementById('char-grid-container');
      const screen = document.getElementById('screen-charselect');
      if (!container || !screen) return;

      container.innerHTML = '';
      Object.keys(CHARACTERS).forEach(key => {
        const char = CHARACTERS[key];
        const isUnlocked = saveManager.data.unlockedCharacters.includes(key);
        const isSelected = saveManager.data.selectedCharacter === key;

        const card = document.createElement('div');
        card.className = `char-card ${!isUnlocked ? 'locked' : ''} ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
          <div class="char-icon">${char.icon}</div>
          <div class="char-name">${char.name}</div>
          <div class="char-title">${char.title}</div>
          <div class="char-desc">${char.desc}</div>
          <div style="font-size:9px; color:${isUnlocked ? '#00ff66' : '#ffe600'}; margin-top:4px;">
            ${isSelected ? '✓ ACTIVE' : (isUnlocked ? 'SELECT' : `UNLOCK: $${char.price}`)}
          </div>
        `;
        card.addEventListener('click', () => {
          if (isUnlocked) {
            saveManager.data.selectedCharacter = key; saveManager.save();
            this.showCharSelect();
          } else if (saveManager.spendCash(char.price)) {
            saveManager.unlockCharacter(key); saveManager.data.selectedCharacter = key; saveManager.save();
            soundEngine.playCratePickup(); this.showCharSelect();
          }
        });
        container.appendChild(card);
      });
      screen.classList.remove('hidden');
    }

    showShop() {
      this.state = GAME_STATES.SHOP;
      document.getElementById('screen-title')?.classList.add('hidden');
      const container = document.getElementById('shop-items-container');
      const cashDisplay = document.getElementById('shop-cash-display');
      const screen = document.getElementById('screen-shop');
      if (!container || !screen) return;

      if (cashDisplay) cashDisplay.innerText = saveManager.data.cash;
      container.innerHTML = '';

      const upgrades = [
        { type: 'hpBonus', name: 'MAX HP +15%', baseCost: 400, desc: 'Increases Contestant Starting Health.' },
        { type: 'speedBonus', name: 'SPEED +10%', baseCost: 500, desc: 'Permanently boosts player run speed.' },
        { type: 'startingBomb', name: 'EXTRA SMART BOMB', baseCost: 750, desc: 'Start every show with +1 Smart Bomb.' }
      ];

      upgrades.forEach(u => {
        const lvl = saveManager.data.upgrades[u.type] || 0;
        const cost = u.baseCost * (lvl + 1);
        const card = document.createElement('div');
        card.className = 'shop-card';
        card.innerHTML = `
          <h3>${u.name} (LVL ${lvl}/3)</h3>
          <p>${u.desc}</p>
          <button class="shop-btn">${lvl >= 3 ? 'MAXED' : `BUY: $${cost}`}</button>
        `;
        card.querySelector('button')?.addEventListener('click', () => {
          if (lvl < 3 && saveManager.spendCash(cost)) {
            saveManager.data.upgrades[u.type] = lvl + 1; saveManager.save();
            soundEngine.playCratePickup(); achievementManager.unlock('BIG_SPENDER');
            this.showShop();
          }
        });
        container.appendChild(card);
      });
      screen.classList.remove('hidden');
    }

    showPerkSelection() {
      this.state = GAME_STATES.SELECT_PERK;
      const perkContainer = document.getElementById('perk-cards-container');
      const perkScreen = document.getElementById('screen-perks');
      if (!perkContainer || !perkScreen) return;

      perkContainer.innerHTML = ''; soundEngine.playAnnouncerVoice();
      const perksList = [
        { id: 'OVERCLOCK_DASH', icon: '⚡', name: 'OVERCLOCKED DASH', desc: '-40% Dash cooldown & fiery spark trails!' },
        { id: 'CRATE_MAGNET', icon: '🧲', name: 'CRATE MAGNET', desc: 'Crates drift automatically towards your player!' },
        { id: 'EJECTOR_PULSE', icon: '💥', name: 'EJECTOR PULSE', desc: 'Swapping weapons emits a shockwave pulse!' },
        { id: 'VAMPIRIC_KILLS', icon: '🩸', name: 'VAMPIRIC SPONSOR', desc: 'Defeating enemies restores +1% Contestant HP!' },
        { id: 'DOUBLE_CASH', icon: '💰', name: 'GOLDEN SPONSORSHIP', desc: '+100% Score & Prize drops from all crates!' }
      ];
      const choices = perksList.sort(() => 0.5 - Math.random()).slice(0, 3);

      choices.forEach(p => {
        const card = document.createElement('div'); card.className = 'perk-card';
        card.innerHTML = `<div class="perk-icon">${p.icon}</div><div class="perk-title">${p.name}</div><div class="perk-desc">${p.desc}</div>`;
        card.addEventListener('click', () => {
          this.activePerks.add(p.id); soundEngine.playCratePickup();
          if (this.activePerks.size >= 3) achievementManager.unlock('PERK_MASTER');
          perkScreen.classList.add('hidden'); this.state = GAME_STATES.PLAYING;
          this.waveManager.startNextWave(this.uiManager);
        });
        perkContainer.appendChild(card);
      });
      perkScreen.classList.remove('hidden');
    }

    startGame() {
      soundEngine.init();
      this.player = new Player(180, 120, saveManager.data.selectedCharacter);
      this.crateManager = new CrateManager(this.arenaBounds);
      this.waveManager = new WaveManager(this.arenaBounds);
      this.activePerks = new Set(); this.smartBombWaves = []; this.bullets = []; this.enemyBullets = []; this.enemies = [];
      this.particles = new ParticleSystem(); this.debrisManager = new DebrisManager(); this.popupManager = new PopupManager();
      this.spawnBarrels(); this.uiManager.resetScore();
      this.hypeMeter = 0; this.isOverdrive = false; this.overdriveTimer = 0;

      document.getElementById('screen-title')?.classList.add('hidden');
      document.getElementById('screen-gameover')?.classList.add('hidden');
      document.getElementById('screen-pause')?.classList.add('hidden');
      document.getElementById('screen-perks')?.classList.add('hidden');
      document.getElementById('screen-charselect')?.classList.add('hidden');
      document.getElementById('screen-shop')?.classList.add('hidden');

      this.state = GAME_STATES.PLAYING;
      this.waveManager.startNextWave(this.uiManager);
      this.lastTime = performance.now();
    }

    togglePause() {
      if (this.state === GAME_STATES.PLAYING) {
        this.state = GAME_STATES.PAUSED; document.getElementById('screen-pause')?.classList.remove('hidden');
      } else if (this.state === GAME_STATES.PAUSED) {
        this.state = GAME_STATES.PLAYING; document.getElementById('screen-pause')?.classList.add('hidden');
        this.lastTime = performance.now();
      }
    }

    gameOver() {
      this.state = GAME_STATES.GAMEOVER;
      soundEngine.playExplosion(); soundEngine.playAnnouncerVoice();
      document.getElementById('final-score').innerText = this.uiManager.score;
      document.getElementById('final-crates').innerText = this.crateManager.cratesCollected;
      document.getElementById('screen-gameover')?.classList.remove('hidden');
    }

    update(dt) {
      if (this.state !== GAME_STATES.PLAYING) return;
      if (this.freezeFrames > 0) { this.freezeFrames -= dt; return; }

      if (this.isOverdrive) {
        this.overdriveTimer -= dt;
        if (this.overdriveTimer <= 0) {
          this.isOverdrive = false; this.hypeMeter = 0;
          document.getElementById('game-container')?.classList.remove('overdrive-active');
        }
      } else if (this.hypeMeter >= 100) {
        this.isOverdrive = true; this.overdriveTimer = 480;
        soundEngine.playCrowdRoar(); soundEngine.playAnnouncerVoice();
        achievementManager.unlock('OVERDRIVE_CHAMPION');
        this.uiManager.showBanner('100% OVERDRIVE UNLEASHED! x10 SCORE!', 2200);
        document.getElementById('game-container')?.classList.add('overdrive-active');
      }

      this.screenShake.update(dt); this.particles.update(dt); this.debrisManager.update(dt); this.popupManager.update(dt);
      const perkHelper = { hasPerk: (id) => this.activePerks.has(id) };

      this.player.update(this.keys, this.mousePos, this.arenaBounds, this.bullets, this.particles, this.screenShake, dt, this.debrisManager, perkHelper);
      if (this.player.hp <= 0) { this.gameOver(); return; }

      this.crateManager.update(this.player, this.particles, this.uiManager, dt, this.popupManager, (f) => this.triggerHitFreeze(f), perkHelper);

      this.waveManager.update(this.enemies, this.player, this.enemyBullets, this.particles, this.uiManager, dt, () => {
        if (this.activePerks.has('SMART_BOMB_CHARGER')) this.player.smartBombs++;
        setTimeout(() => this.showPerkSelection(), 1500);
      });

      for (let i = this.smartBombWaves.length - 1; i >= 0; i--) {
        const w = this.smartBombWaves[i]; w.radius += w.speed * dt;
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (Math.abs(Math.hypot(e.x - w.x, e.y - w.y) - w.radius) < 20) {
            e.takeDamage(500, this.particles, this.screenShake, this.debrisManager, this.popupManager);
            if (e.dead) this.enemies.splice(j, 1);
          }
        }
        if (w.radius >= w.maxRadius) this.smartBombWaves.splice(i, 1);
      }

      for (let i = this.barrels.length - 1; i >= 0; i--) {
        const b = this.barrels[i]; if (b.flashTimer > 0) b.flashTimer -= dt;
      }

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i]; b.update(this.arenaBounds, this.particles, dt, this.enemies);

        for (let k = this.barrels.length - 1; k >= 0; k--) {
          const bar = this.barrels[k];
          if (Math.hypot(b.x - bar.x, b.y - bar.y) < (b.size + bar.size) * 0.6) {
            bar.hp -= b.damage; bar.flashTimer = 5; if (!b.piercing) b.dead = true;
            if (bar.hp <= 0) {
              soundEngine.playExplosion(bar.isMoney ? 1.5 : 0.8); this.screenShake.addShake(8);
              achievementManager.unlock('BARREL_EXPLODER');
              this.popupManager.addPopup(bar.x, bar.y - 8, bar.isMoney ? '+500 PRIZE!' : 'BOOM!', bar.isMoney ? '#ffe600' : '#ff0033');
              if (bar.isMoney) this.uiManager.addScore(500);
              for (let e of this.enemies) { if (Math.hypot(e.x - bar.x, e.y - bar.y) < 60) e.takeDamage(120, this.particles, this.screenShake, this.debrisManager, this.popupManager); }
              this.barrels.splice(k, 1);
            }
            break;
          }
        }

        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (Math.hypot(b.x - e.x, b.y - e.y) < (b.size + e.size) * 0.6) {
            e.takeDamage(b.damage, this.particles, this.screenShake, this.debrisManager, this.popupManager);
            if (!b.piercing) b.dead = true;

            if (e.dead) {
              this.triggerHitFreeze(2); this.player.killStreak++; this.player.comboTimer = 120;
              this.player.comboMultiplier = Math.min(5, 1 + Math.floor(this.player.killStreak / 4));
              if (this.player.comboMultiplier >= 5) achievementManager.unlock('RAMPAGE_5');
              if (b.weapon.id === 'BFG') achievementManager.unlock('BFG_DESTRUCTION');

              this.hypeMeter = Math.min(100, this.hypeMeter + 4);
              let addedScore = e.type.scoreValue * (this.isOverdrive ? 10 : this.player.comboMultiplier);
              if (this.activePerks.has('DOUBLE_CASH') || this.player.cashMagnet) addedScore *= 2;
              this.uiManager.addScore(addedScore); saveManager.addCash(addedScore * 0.05);

              this.popupManager.addPopup(e.x, e.y - 12, `+${addedScore}`, '#00ff66');
              if (this.player.killStreak % 5 === 0) {
                soundEngine.playCrowdRoar(); this.uiManager.showBanner(`RAMPAGE! ${this.player.comboMultiplier}X MULTIPLIER!`, 1200);
              }
              this.enemies.splice(j, 1);
            }
            break;
          }
        }
        if (b.dead) this.bullets.splice(i, 1);
      }

      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const eb = this.enemyBullets[i]; eb.update(this.arenaBounds, this.particles, dt, null);
        if (Math.hypot(eb.x - this.player.x, eb.y - this.player.y) < (eb.size + this.player.size) * 0.6) {
          if (!this.isOverdrive && this.player.takeDamage(eb.damage, this.particles)) {
            this.triggerHitFreeze(4); this.screenShake.addShake(6); soundEngine.playExplosion();
          }
          eb.dead = true;
        }
        if (eb.dead) this.enemyBullets.splice(i, 1);
      }

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i]; e.update(this.player, this.arenaBounds, this.enemyBullets, this.particles, dt);
        if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < (e.size + this.player.size) * 0.6) {
          if (!this.isOverdrive && this.player.takeDamage(15, this.particles)) {
            this.triggerHitFreeze(5); this.screenShake.addShake(8); soundEngine.playExplosion();
          }
        }
      }

      this.uiManager.updateHUD(this.player, this.waveManager, this.crateManager, this.hypeMeter);
    }

    render() {
      const offCtx = this.renderer.getContext(); this.renderer.clear();
      this.renderer.drawArenaGrid(this.arenaBounds); this.debrisManager.draw(offCtx);
      if (this.waveManager) this.waveManager.drawDoors(offCtx);

      for (let b of this.barrels) {
        const half = b.size / 2; offCtx.fillStyle = b.flashTimer > 0 ? '#ffffff' : (b.isMoney ? '#ffe600' : '#ff0033');
        offCtx.fillRect(Math.round(b.x - half), Math.round(b.y - half), b.size, b.size);
        offCtx.strokeStyle = '#000000'; offCtx.lineWidth = 1; offCtx.strokeRect(Math.round(b.x - half) + 0.5, Math.round(b.y - half) + 0.5, b.size - 1, b.size - 1);
        offCtx.fillStyle = '#ffffff'; offCtx.font = '7px "Press Start 2P"'; offCtx.textAlign = 'center'; offCtx.textBaseline = 'middle';
        offCtx.fillText(b.isMoney ? '$' : '!', Math.round(b.x), Math.round(b.y + 1));
      }
      if (this.crateManager) this.crateManager.draw(offCtx);

      for (let w of this.smartBombWaves) {
        offCtx.strokeStyle = '#00f0ff'; offCtx.lineWidth = 3; offCtx.beginPath();
        offCtx.arc(Math.round(w.x), Math.round(w.y), Math.round(w.radius), 0, Math.PI * 2); offCtx.stroke();
      }

      if (this.player && this.state === GAME_STATES.PLAYING) {
        offCtx.strokeStyle = 'rgba(255, 0, 85, 0.25)'; offCtx.lineWidth = 1; offCtx.beginPath();
        offCtx.moveTo(Math.round(this.player.x), Math.round(this.player.y)); offCtx.lineTo(Math.round(this.mousePos.x), Math.round(this.mousePos.y)); offCtx.stroke();
      }

      for (let i = 0; i < this.enemies.length; i++) this.enemies[i].draw(offCtx);
      for (let i = 0; i < this.bullets.length; i++) this.bullets[i].draw(offCtx);
      for (let i = 0; i < this.enemyBullets.length; i++) this.enemyBullets[i].draw(offCtx);
      if (this.player && (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED)) this.player.draw(offCtx);

      this.particles.draw(offCtx); this.popupManager.draw(offCtx);

      const lights = [];
      if (this.player) lights.push({ x: this.player.x, y: this.player.y, radius: 24, color: 'rgba(0, 240, 255, 0.25)' });
      if (this.crateManager && this.crateManager.activeCrate) {
        const c = this.crateManager.activeCrate; lights.push({ x: c.x, y: c.y, radius: 22, color: c.isGolden ? 'rgba(255, 230, 0, 0.4)' : 'rgba(0, 240, 255, 0.3)' });
      }
      for (let b of this.bullets) lights.push({ x: b.x, y: b.y, radius: 10, color: 'rgba(255, 255, 255, 0.2)' });
      for (let eb of this.enemyBullets) lights.push({ x: eb.x, y: eb.y, radius: 12, color: 'rgba(255, 0, 85, 0.35)' });
      this.renderer.drawDynamicLighting(lights);

      if (this.state === GAME_STATES.PLAYING) {
        offCtx.strokeStyle = '#00f0ff'; offCtx.lineWidth = 1; const cx = Math.round(this.mousePos.x); const cy = Math.round(this.mousePos.y);
        offCtx.strokeRect(cx - 3, cy - 3, 6, 6);
      }

      this.renderer.applyOrderedDithering();
      this.renderer.renderToScreen(this.mainCtx, this.mainCanvas.width, this.mainCanvas.height, this.screenShake);
    }

    loop(currentTime) {
      const elapsedSeconds = (currentTime - this.lastTime) / 1000; this.lastTime = currentTime;
      const dt = Math.min(elapsedSeconds * 60, 3.0);
      this.update(dt); this.render();
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  window.addEventListener('DOMContentLoaded', () => { new Game(); });
})();