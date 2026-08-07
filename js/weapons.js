
import { soundEngine } from './audio.js';

export const WEAPONS = {
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

export class Bullet {
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