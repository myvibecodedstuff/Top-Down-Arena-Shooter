
import { Renderer, ParticleSystem, ScreenShake } from './render.js';
import { Player } from './player.js';
import { CrateManager } from './crates.js';
import { WaveManager } from './enemies.js';
import { UIManager } from './ui.js';
import { soundEngine } from './audio.js';
import { setActivePalette } from './palette.js';

export const GAME_STATES = {
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