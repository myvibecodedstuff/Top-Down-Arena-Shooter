
import { Bullet } from './weapons.js';
import { soundEngine } from './audio.js';

export const ENEMY_TYPES = {
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

export class Enemy {
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

export class WaveManager {
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