
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.muted = false;
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
      this.sfxGain.gain.value = 0.6;

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
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

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
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
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
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12);

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
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.4, now + idx * 0.05 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.12);
    });
  }

  playExplosion() {
    if (!this.initialized) return;
    this.resume();
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  playCrowdRoar() {
    if (!this.initialized) return;
    this.resume();
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.Q.value = 1.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  playAnnouncerVoice() {
    if (!this.initialized) return;
    this.resume();
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const freq = 120 + Math.random() * 80;
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.3, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.06);
    }
  }

  startBackgroundMusic() {
    if (!this.initialized) return;
    const bassline = [110, 110, 146.83, 110, 164.81, 130.81, 110, 123.47];
    let step = 0;

    setInterval(() => {
      if (this.muted || !this.initialized) return;
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

    this.activeCrate = {
      x,
      y,
      size: 14,
      bounceTimer: 0,
      pulse: 0
    };
  }

  update(player, particles, uiManager) {
    if (!this.activeCrate) {
      this.spawnCrate();
      return;
    }

    const crate = this.activeCrate;
    crate.bounceTimer += 0.08;
    crate.pulse = Math.sin(crate.bounceTimer) * 2;

    const dx = player.x - crate.x;
    const dy = player.y - crate.y;
    const dist = Math.hypot(dx, dy);

    if (dist < (player.size + crate.size) * 0.7) {
      this.cratesCollected++;
      soundEngine.playCratePickup();

      const weaponKeys = Object.keys(WEAPONS);
      let newKey = weaponKeys[Math.floor(Math.random() * weaponKeys.length)];
      if (weaponKeys.length > 1 && WEAPONS[newKey].id === player.currentWeapon.id) {
        const remaining = weaponKeys.filter(k => WEAPONS[k].id !== player.currentWeapon.id);
        newKey = remaining[Math.floor(Math.random() * remaining.length)];
      }

      const newWeapon = WEAPONS[newKey];
      player.equipWeapon(newWeapon);

      if (uiManager) {
        uiManager.showBanner(`CRATE #${this.cratesCollected}: ${newWeapon.name}!`, 1200);
        uiManager.addScore(100 * player.comboMultiplier);
      }

      if (particles) {
        for (let i = 0; i < 24; i++) {
          const angle = (Math.PI * 2 * i) / 24;
          const spd = 2 + Math.random() * 3;
          particles.addParticle(
            crate.x,
            crate.y,
            Math.cos(angle) * spd,
            Math.sin(angle) * spd,
            '#ffe600',
            3,
            25
          );
        }
      }

      this.spawnCrate();
    }
  }

  draw(ctx) {
    if (!this.activeCrate) return;

    const c = this.activeCrate;
    const drawY = c.y + c.pulse;

    const half = c.size / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(Math.round(c.x - half), Math.round(c.y + half - 2), c.size, 4);

    ctx.fillStyle = '#ff9900';
    ctx.fillRect(Math.round(c.x - half), Math.round(drawY - half), c.size, c.size);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(c.x - half) + 0.5, Math.round(drawY - half) + 0.5, c.size - 1, c.size - 1);

    ctx.fillStyle = '#ffffff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', Math.round(c.x), Math.round(drawY + 1));
  }
}

const ENEMY_TYPES = {
  SWARMER: {
    name: 'SWARMER BUG',
    hp: 20,
    speed: 1.8,
    size: 8,
    color: '#ff0055',
    scoreValue: 50,
    behavior: 'chase'
  },
  CHARGER: {
    name: 'CYBORG BULL',
    hp: 60,
    speed: 1.2,
    chargeSpeed: 4.5,
    size: 12,
    color: '#ff9900',
    scoreValue: 150,
    behavior: 'charge'
  },
  TURRET: {
    name: 'ARENA TURRET',
    hp: 45,
    speed: 0.5,
    size: 10,
    color: '#a855f7',
    scoreValue: 200,
    behavior: 'shoot'
  },
  TITAN: {
    name: 'MECHA TITAN',
    hp: 180,
    speed: 0.7,
    size: 16,
    color: '#00ff66',
    scoreValue: 400,
    behavior: 'heavy'
  },
  BOSS: {
    name: 'BROADCAST MEGABRAIN',
    hp: 800,
    speed: 0.6,
    size: 26,
    color: '#ffe600',
    scoreValue: 2500,
    behavior: 'boss'
  }
};

class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.hp = type.hp;
    this.maxHp = type.hp;
    this.speed = type.speed;
    this.size = type.size;
    this.color = type.color;
    this.dead = false;

    this.chargeTimer = 0;
    this.isCharging = false;
    this.chargeDirX = 0;
    this.chargeDirY = 0;
    this.shootTimer = 0;
    this.flashTimer = 0;
  }

  takeDamage(amount, particles, screenShake) {
    this.hp -= amount;
    this.flashTimer = 5;

    if (particles) {
      for (let i = 0; i < 4; i++) {
        const ang = Math.random() * Math.PI * 2;
        particles.addParticle(this.x, this.y, Math.cos(ang) * 1.5, Math.sin(ang) * 1.5, this.color, 2, 12);
      }
    }

    if (this.hp <= 0) {
      this.dead = true;
      soundEngine.playExplosion();
      if (screenShake) screenShake.addShake(3);

      if (particles) {
        for (let i = 0; i < 16; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 1 + Math.random() * 3;
          particles.addParticle(this.x, this.y, Math.cos(ang) * spd, Math.sin(ang) * spd, this.color, 3, 25);
        }
      }
    }
  }

  update(player, arenaBounds, enemyBullets, particles) {
    if (this.flashTimer > 0) this.flashTimer--;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

    switch (this.type.behavior) {
      case 'chase':
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        break;

      case 'charge':
        if (!this.isCharging) {
          this.chargeTimer++;
          this.x += (dx / dist) * this.speed;
          this.y += (dy / dist) * this.speed;

          if (this.chargeTimer > 90 && dist < 140) {
            this.isCharging = true;
            this.chargeDirX = dx / dist;
            this.chargeDirY = dy / dist;
            this.chargeTimer = 0;
          }
        } else {
          this.x += this.chargeDirX * this.type.chargeSpeed;
          this.y += this.chargeDirY * this.type.chargeSpeed;
          this.chargeTimer++;

          if (this.chargeTimer > 35) {
            this.isCharging = false;
            this.chargeTimer = 0;
          }
        }
        break;

      case 'shoot':
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        this.shootTimer++;
        if (this.shootTimer > 90) {
          this.shootTimer = 0;
          if (enemyBullets) {
            enemyBullets.push(new Bullet(this.x, this.y, (dx / dist) * 3, (dy / dist) * 3, { size: 4, damage: 15, color: '#ff0033' }, true));
          }
        }
        break;

      case 'heavy':
      case 'boss':
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        this.shootTimer++;
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
    const half = this.size / 2;

    ctx.fillStyle = this.flashTimer > 0 ? '#ffffff' : this.color;
    ctx.fillRect(Math.round(this.x - half), Math.round(this.y - half), this.size, this.size);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(this.x - half) + 0.5, Math.round(this.y - half) + 0.5, this.size - 1, this.size - 1);
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
      { x: arenaBounds.x + arenaBounds.w / 2, y: arenaBounds.y + 4, side: 'TOP' },
      { x: arenaBounds.x + arenaBounds.w / 2, y: arenaBounds.y + arenaBounds.h - 4, side: 'BOTTOM' },
      { x: arenaBounds.x + 4, y: arenaBounds.y + arenaBounds.h / 2, side: 'LEFT' },
      { x: arenaBounds.x + arenaBounds.w - 4, y: arenaBounds.y + arenaBounds.h / 2, side: 'RIGHT' }
    ];
  }

  startNextWave(uiManager) {
    this.waveActive = true;
    this.enemiesRemainingInWave = 8 + this.waveNumber * 6;

    if (uiManager) {
      soundEngine.playAnnouncerVoice();
      soundEngine.playCrowdRoar();
      const waveTitle = (this.waveNumber % 5 === 0) ? `WAVE ${this.waveNumber}: BOSS BATTLE!` : `WAVE ${this.waveNumber} - BEGIN!`;
      uiManager.showBanner(waveTitle, 2000);
    }
  }

  update(enemies, player, enemyBullets, particles, uiManager) {
    if (!this.waveActive) return;

    this.spawnTimer++;

    if (this.enemiesRemainingInWave > 0 && this.spawnTimer >= Math.max(25, 70 - this.waveNumber * 4)) {
      this.spawnTimer = 0;

      const door = this.spawnerDoors[Math.floor(Math.random() * this.spawnerDoors.length)];

      let type = ENEMY_TYPES.SWARMER;
      const r = Math.random();

      if (this.waveNumber % 5 === 0 && this.enemiesRemainingInWave === 1) {
        type = ENEMY_TYPES.BOSS;
      } else if (this.waveNumber >= 3 && r < 0.25) {
        type = ENEMY_TYPES.CHARGER;
      } else if (this.waveNumber >= 2 && r < 0.45) {
        type = ENEMY_TYPES.TURRET;
      } else if (this.waveNumber >= 4 && r < 0.6) {
        type = ENEMY_TYPES.TITAN;
      }

      enemies.push(new Enemy(door.x, door.y, type));
      this.enemiesRemainingInWave--;

      if (particles) {
        for (let i = 0; i < 8; i++) {
          particles.addParticle(door.x, door.y, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, '#ff0055', 2, 15);
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
      setTimeout(() => this.startNextWave(uiManager), 2500);
    }
  }

  drawDoors(ctx) {
    this.spawnerDoors.forEach(door => {
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(Math.round(door.x - 8), Math.round(door.y - 8), 16, 16);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(door.x - 4), Math.round(door.y - 4), 8, 8);
    });
  }
}

const GAME_STATES = {
  TITLE: 'TITLE',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER'
};

class Game {
  constructor() {
    this.state = GAME_STATES.TITLE;

    this.mainCanvas = document.getElementById('game-canvas');
    this.mainCtx = this.mainCanvas.getContext('2d');

    this.renderer = new Renderer(360, 240);

    this.arenaBounds = {
      x: 10,
      y: 10,
      w: 340,
      h: 220
    };

    this.particles = new ParticleSystem();
    this.screenShake = new ScreenShake();
    this.uiManager = new UIManager();

    this.player = null;
    this.crateManager = null;
    this.waveManager = null;
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];

    this.keys = {};
    this.mousePos = { x: 180, y: 120, isDown: false };

    this.bindEvents();
    this.setupUI();
    this.resizeCanvas();

    window.addEventListener('resize', () => this.resizeCanvas());

    requestAnimationFrame((time) => this.loop(time));
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
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.mainCanvas.addEventListener('mousemove', (e) => {
      const rect = this.mainCanvas.getBoundingClientRect();
      const scaleX = this.renderer.width / rect.width;
      const scaleY = this.renderer.height / rect.height;

      this.mousePos.x = (e.clientX - rect.left) * scaleX;
      this.mousePos.y = (e.clientY - rect.top) * scaleY;
    });

    this.mainCanvas.addEventListener('mousedown', (e) => {
      soundEngine.init();
      if (e.button === 0) this.mousePos.isDown = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mousePos.isDown = false;
    });
  }

  setupUI() {
    const btnStart = document.getElementById('btn-start');
    const btnRestart = document.getElementById('btn-restart');
    const btnResume = document.getElementById('btn-resume');

    if (btnStart) btnStart.addEventListener('click', () => this.startGame());
    if (btnRestart) btnRestart.addEventListener('click', () => this.startGame());
    if (btnResume) btnResume.addEventListener('click', () => this.togglePause());

    document.querySelectorAll('.palette-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const palette = e.target.getAttribute('data-palette');
        setActivePalette(palette);
      });
    });
  }

  startGame() {
    soundEngine.init();

    this.player = new Player(180, 120);
    this.crateManager = new CrateManager(this.arenaBounds);
    this.waveManager = new WaveManager(this.arenaBounds);
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.particles = new ParticleSystem();
    this.uiManager.resetScore();

    document.getElementById('screen-title').classList.add('hidden');
    document.getElementById('screen-gameover').classList.add('hidden');
    document.getElementById('screen-pause').classList.add('hidden');

    this.state = GAME_STATES.PLAYING;
    this.waveManager.startNextWave(this.uiManager);
  }

  togglePause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.state = GAME_STATES.PAUSED;
      document.getElementById('screen-pause').classList.remove('hidden');
    } else if (this.state === GAME_STATES.PAUSED) {
      this.state = GAME_STATES.PLAYING;
      document.getElementById('screen-pause').classList.add('hidden');
    }
  }

  gameOver() {
    this.state = GAME_STATES.GAMEOVER;
    soundEngine.playExplosion();
    soundEngine.playAnnouncerVoice();

    document.getElementById('final-score').innerText = this.uiManager.score;
    document.getElementById('final-crates').innerText = this.crateManager.cratesCollected;
    document.getElementById('screen-gameover').classList.remove('hidden');
  }

  update() {
    if (this.state !== GAME_STATES.PLAYING) return;

    this.screenShake.update();
    this.particles.update();

    this.player.update(this.keys, this.mousePos, this.arenaBounds, this.bullets, this.particles, this.screenShake);

    if (this.player.hp <= 0) {
      this.gameOver();
      return;
    }

    this.crateManager.update(this.player, this.particles, this.uiManager);

    this.waveManager.update(this.enemies, this.player, this.enemyBullets, this.particles, this.uiManager);

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(this.arenaBounds, this.particles);

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        const dist = Math.hypot(b.x - e.x, b.y - e.y);

        if (dist < (b.size + e.size) * 0.6) {
          e.takeDamage(b.damage, this.particles, this.screenShake);

          if (!b.piercing) b.dead = true;

          if (e.dead) {
            this.uiManager.addScore(e.type.scoreValue * this.player.comboMultiplier);
            this.enemies.splice(j, 1);
          }
          break;
        }
      }

      if (b.dead) {
        this.bullets.splice(i, 1);
      }
    }

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.update(this.arenaBounds, this.particles);

      const dist = Math.hypot(eb.x - this.player.x, eb.y - this.player.y);
      if (dist < (eb.size + this.player.size) * 0.6) {
        if (this.player.takeDamage(eb.damage, this.particles)) {
          this.screenShake.addShake(6);
          soundEngine.playExplosion();
        }
        eb.dead = true;
      }

      if (eb.dead) {
        this.enemyBullets.splice(i, 1);
      }
    }

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      e.update(this.player, this.arenaBounds, this.enemyBullets, this.particles);

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

    if (this.waveManager) {
      this.waveManager.drawDoors(offCtx);
    }

    if (this.crateManager) {
      this.crateManager.draw(offCtx);
    }

    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].draw(offCtx);
    }

    for (let i = 0; i < this.bullets.length; i++) {
      this.bullets[i].draw(offCtx);
    }
    for (let i = 0; i < this.enemyBullets.length; i++) {
      this.enemyBullets[i].draw(offCtx);
    }

    if (this.player && (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED)) {
      this.player.draw(offCtx);
    }

    this.particles.draw(offCtx);

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

const BAYER_4X4 = [
  [ 0/16,  8/16,  2/16, 10/16],
  [12/16,  4/16, 14/16,  6/16],
  [ 3/16, 11/16,  1/16,  9/16],
  [15/16,  7/16, 13/16,  5/16]
];

const BAYER_8X8 = [
  [ 0/64, 32/64,  8/64, 40/64,  2/64, 34/64, 10/64, 42/64],
  [48/64, 16/64, 56/64, 24/64, 50/64, 18/64, 58/64, 26/64],
  [12/64, 44/64,  4/64, 36/64, 14/64, 46/64,  6/64, 38/64],
  [60/64, 28/64, 52/64, 20/64, 62/64, 30/64, 54/64, 22/64],
  [ 3/64, 35/64, 11/64, 43/64,  1/64, 33/64,  9/64, 41/64],
  [51/64, 19/64, 59/64, 27/64, 49/64, 17/64, 57/64, 25/64],
  [15/64, 47/64,  7/64, 39/64, 13/64, 45/64,  5/64, 37/64],
  [63/64, 31/64, 55/64, 23/64, 61/64, 29/64, 53/64, 21/64]
];

const PALETTES = {
  CYBERPUNK: {
    name: 'CYBERPUNK NEON',
    colors: [
      [10, 8, 20],
      [24, 20, 48],
      [64, 28, 96],
      [140, 32, 110],
      [255, 0, 85],
      [255, 80, 140],
      [0, 180, 216],
      [0, 240, 255],
      [16, 185, 129],
      [52, 211, 153],
      [251, 191, 36],
      [255, 230, 0],
      [244, 244, 245],
    ]
  },
  AMBER: {
    name: 'CRT AMBER',
    colors: [
      [8, 5, 0],
      [30, 18, 0],
      [75, 45, 0],
      [130, 78, 0],
      [190, 114, 0],
      [245, 150, 0],
      [255, 190, 40],
      [255, 235, 160]
    ]
  },
  GAMEBOY: {
    name: 'GAMEBOY GREEN',
    colors: [
      [15, 56, 15],
      [48, 98, 48],
      [139, 172, 15],
      [155, 188, 15]
    ]
  },
  VOID: {
    name: 'VOID MONOCHROME',
    colors: [
      [10, 10, 12],
      [35, 35, 40],
      [75, 75, 85],
      [130, 130, 145],
      [195, 195, 210],
      [250, 250, 255]
    ]
  }
};

let activePaletteName = 'CYBERPUNK';

function setActivePalette(name) {
  if (PALETTES[name]) {
    activePaletteName = name;
  }
}

function quantizeColor(r, g, b, x, y, paletteName = activePaletteName, ditherStrength = 0.35) {
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
    if (dist < minDistance) {
      minDistance = dist;
      closest = c;
    }
  }

  return closest;
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 10;
    this.speed = 2.2;
    this.currentWeapon = WEAPONS.PISTOL;

    this.vx = 0;
    this.vy = 0;
    this.aimAngle = 0;
    this.lastShotTime = 0;

    this.hp = 100;
    this.maxHp = 100;
    this.invulnerableTimer = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;

    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashVx = 0;
    this.dashVy = 0;
  }

  equipWeapon(weapon) {
    this.currentWeapon = weapon;
  }

  takeDamage(amount, particles) {
    if (this.invulnerableTimer > 0 || this.isDashing) return false;

    this.hp -= amount;
    this.invulnerableTimer = 35;
    this.comboMultiplier = 1;

    if (particles) {
      for (let i = 0; i < 12; i++) {
        const ang = Math.random() * Math.PI * 2;
        particles.addParticle(this.x, this.y, Math.cos(ang) * 2, Math.sin(ang) * 2, '#ff0033', 2.5, 20);
      }
    }

    return true;
  }

  update(keys, mousePos, arenaBounds, bullets, particles, screenShake) {
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;
    if (this.dashCooldown > 0) this.dashCooldown--;

    if (keys['Space'] || keys['ShiftLeft'] || keys['ShiftRight']) {
      if (!this.isDashing && this.dashCooldown <= 0) {
        let dx = 0;
        let dy = 0;
        if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

        if (dx !== 0 || dy !== 0) {
          const mag = Math.hypot(dx, dy);
          this.dashVx = (dx / mag) * 5.5;
          this.dashVy = (dy / mag) * 5.5;
          this.isDashing = true;
          this.dashTimer = 10;
          this.dashCooldown = 45;
        }
      }
    }

    if (this.isDashing) {
      this.x += this.dashVx;
      this.y += this.dashVy;
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }

      if (particles && Math.random() < 0.6) {
        particles.addParticle(this.x, this.y, 0, 0, '#00f0ff', 3, 12);
      }
    } else {
      let moveX = 0;
      let moveY = 0;
      if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }

      this.x += moveX * this.speed;
      this.y += moveY * this.speed;
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
      this.fireWeapon(bullets, particles, screenShake);
    }
  }

  fireWeapon(bullets, particles, screenShake) {
    const w = this.currentWeapon;
    w.sound();

    if (screenShake && w.recoil > 2) {
      screenShake.addShake(w.recoil * 0.8);
    }

    const count = w.bulletsPerShot || 1;
    for (let i = 0; i < count; i++) {
      const spreadAngle = (Math.random() - 0.5) * w.spread;
      const finalAngle = this.aimAngle + spreadAngle;
      const vx = Math.cos(finalAngle) * w.speed;
      const vy = Math.sin(finalAngle) * w.speed;

      const bullet = new Bullet(
        this.x + Math.cos(this.aimAngle) * 6,
        this.y + Math.sin(this.aimAngle) * 6,
        vx,
        vy,
        w,
        false
      );
      bullets.push(bullet);

      if (particles) {
        particles.addParticle(
          this.x + Math.cos(this.aimAngle) * 8,
          this.y + Math.sin(this.aimAngle) * 8,
          vx * 0.2 + (Math.random() - 0.5),
          vy * 0.2 + (Math.random() - 0.5),
          w.color,
          2.5,
          10
        );
      }
    }
  }

  draw(ctx) {
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 3) % 2 === 0) {
      return;
    }

    const half = this.size / 2;

    ctx.fillStyle = this.isDashing ? '#00f0ff' : '#ffe600';
    ctx.fillRect(Math.round(this.x - half), Math.round(this.y - half), this.size, this.size);

    ctx.fillStyle = '#000000';
    const eyeX = this.x + Math.cos(this.aimAngle) * 3;
    const eyeY = this.y + Math.sin(this.aimAngle) * 3;
    ctx.fillRect(Math.round(eyeX - 1.5), Math.round(eyeY - 1.5), 3, 3);

    ctx.strokeStyle = this.currentWeapon.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.round(this.x), Math.round(this.y));
    ctx.lineTo(
      Math.round(this.x + Math.cos(this.aimAngle) * 10),
      Math.round(this.y + Math.sin(this.aimAngle) * 10)
    );
    ctx.stroke();
  }
}

class ScreenShake {
  constructor() {
    this.intensity = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  addShake(amount) {
    this.intensity = Math.min(15, this.intensity + amount);
  }

  update() {
    if (this.intensity > 0.1) {
      this.offsetX = (Math.random() - 0.5) * this.intensity;
      this.offsetY = (Math.random() - 0.5) * this.intensity;
      this.intensity *= 0.88;
    } else {
      this.intensity = 0;
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  addParticle(x, y, vx, vy, color, size, life) {
    this.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      size,
      life,
      maxLife: life
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), p.size, p.size);
    }
    ctx.globalAlpha = 1.0;
  }
}

class Renderer {
  constructor(width = 320, height = 240) {
    this.width = width;
    this.height = height;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    this.offCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    this.offCtx.imageRendering = 'pixelated';

    this.ditherEnabled = true;
  }

  getCanvas() {
    return this.offscreenCanvas;
  }

  getContext() {
    return this.offCtx;
  }

  clear() {
    this.offCtx.fillStyle = '#05040a';
    this.offCtx.fillRect(0, 0, this.width, this.height);
  }

  drawArenaGrid(arenaBounds) {
    const ctx = this.offCtx;

    ctx.fillStyle = '#0a0814';
    ctx.fillRect(arenaBounds.x, arenaBounds.y, arenaBounds.w, arenaBounds.h);

    ctx.strokeStyle = '#18142a';
    ctx.lineWidth = 1;

    const tileSize = 16;
    for (let x = arenaBounds.x; x < arenaBounds.x + arenaBounds.w; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, arenaBounds.y);
      ctx.lineTo(x, arenaBounds.y + arenaBounds.h);
      ctx.stroke();
    }

    for (let y = arenaBounds.y; y < arenaBounds.y + arenaBounds.h; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(arenaBounds.x, y);
      ctx.lineTo(arenaBounds.x + arenaBounds.w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 2;
    ctx.strokeRect(arenaBounds.x, arenaBounds.y, arenaBounds.w, arenaBounds.h);
  }

  applyOrderedDithering() {
    if (!this.ditherEnabled) return;

    const imgData = this.offCtx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const quantized = quantizeColor(r, g, b, x, y, activePaletteName, 0.25);

        data[idx] = quantized[0];
        data[idx + 1] = quantized[1];
        data[idx + 2] = quantized[2];
      }
    }

    this.offCtx.putImageData(imgData, 0, 0);
  }

  renderToScreen(screenCtx, mainWidth, mainHeight, screenShake) {
    screenCtx.save();
    screenCtx.clearRect(0, 0, mainWidth, mainHeight);

    screenCtx.imageSmoothingEnabled = false;

    if (screenShake) {
      screenCtx.translate(screenShake.offsetX, screenShake.offsetY);
    }

    screenCtx.drawImage(
      this.offscreenCanvas,
      0, 0, this.width, this.height,
      0, 0, mainWidth, mainHeight
    );

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

  resetScore() {
    this.score = 0;
    this.updateHUD();
  }

  showBanner(text, duration = 1800) {
    if (!this.bannerElement) return;

    if (this.bannerTimer) clearTimeout(this.bannerTimer);

    this.bannerElement.innerText = text;
    this.bannerElement.classList.add('active');

    this.bannerTimer = setTimeout(() => {
      this.bannerElement.classList.remove('active');
    }, duration);
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
    if (elHp && player) elHp.innerText = `${Math.max(0, player.hp)}%`;
    if (elWave && waveManager) elWave.innerText = `WAVE ${waveManager.waveNumber}`;
  }
}

const WEAPONS = {
  PISTOL: {
    id: 'PISTOL',
    name: 'DUAL PISTOLS',
    color: '#00f0ff',
    fireRate: 140,
    spread: 0.08,
    speed: 10,
    damage: 18,
    bulletsPerShot: 1,
    size: 3,
    recoil: 1.5,
    sound: () => soundEngine.playPistol()
  },
  SHOTGUN: {
    id: 'SHOTGUN',
    name: 'HEAVY SHOTGUN',
    color: '#ffe600',
    fireRate: 350,
    spread: 0.35,
    speed: 8.5,
    damage: 14,
    bulletsPerShot: 6,
    size: 2.5,
    recoil: 5,
    sound: () => soundEngine.playShotgun()
  },
  PLASMA: {
    id: 'PLASMA',
    name: 'PLASMA RIFLE',
    color: '#ff0055',
    fireRate: 80,
    spread: 0.12,
    speed: 12,
    damage: 12,
    bulletsPerShot: 1,
    size: 4,
    recoil: 1,
    sound: () => soundEngine.playLaser()
  },
  LASER: {
    id: 'LASER',
    name: 'HYPER LASER',
    color: '#00ff66',
    fireRate: 60,
    spread: 0.02,
    speed: 15,
    damage: 10,
    bulletsPerShot: 1,
    size: 3,
    recoil: 0.5,
    piercing: true,
    sound: () => soundEngine.playLaser()
  },
  SAWBLADE: {
    id: 'SAWBLADE',
    name: 'BOUNCING SAW',
    color: '#a855f7',
    fireRate: 300,
    spread: 0.1,
    speed: 7,
    damage: 35,
    bulletsPerShot: 1,
    size: 6,
    bouncing: true,
    bouncesLeft: 3,
    recoil: 3,
    sound: () => soundEngine.playShotgun()
  },
  MISSILE: {
    id: 'MISSILE',
    name: 'MICRO MISSILE',
    color: '#ff9900',
    fireRate: 250,
    spread: 0.2,
    speed: 6.5,
    damage: 40,
    bulletsPerShot: 2,
    size: 5,
    explosive: true,
    recoil: 4,
    sound: () => soundEngine.playPistol()
  }
};

class Bullet {
  constructor(x, y, vx, vy, weapon, isEnemy = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.weapon = weapon;
    this.color = isEnemy ? '#ff0033' : weapon.color;
    this.size = weapon.size || 3;
    this.damage = weapon.damage || 10;
    this.piercing = weapon.piercing || false;
    this.bouncing = weapon.bouncing || false;
    this.bouncesLeft = weapon.bouncesLeft || 0;
    this.explosive = weapon.explosive || false;
    this.isEnemy = isEnemy;
    this.life = 0;
    this.maxLife = 120;
    this.dead = false;
  }

  update(arenaBounds, particles) {
    this.x += this.vx;
    this.y += this.vy;
    this.life++;

    if (this.life >= this.maxLife) {
      this.dead = true;
    }

    if (this.x <= arenaBounds.x || this.x >= arenaBounds.x + arenaBounds.w) {
      if (this.bouncing && this.bouncesLeft > 0) {
        this.vx *= -1;
        this.bouncesLeft--;
      } else {
        this.dead = true;
      }
    }

    if (this.y <= arenaBounds.y || this.y >= arenaBounds.y + arenaBounds.h) {
      if (this.bouncing && this.bouncesLeft > 0) {
        this.vy *= -1;
        this.bouncesLeft--;
      } else {
        this.dead = true;
      }
    }

    if (Math.random() < 0.4 && particles) {
      particles.addParticle(this.x, this.y, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, this.color, 2, 10);
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.round(this.x - this.size / 2), Math.round(this.y - this.size / 2), this.size, this.size);
  }
}