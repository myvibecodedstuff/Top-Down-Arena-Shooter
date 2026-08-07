
export class Barrel {
  constructor(x, y, isMoney = false) {
    this.x = x;
    this.y = y;
    this.size = 12;
    this.isMoney = isMoney;
    this.hp = isMoney ? 15 : 25;
    this.color = isMoney ? '#ffe600' : '#ff0033';
    this.flashTimer = 0;
    this.dead = false;
  }

  takeDamage(amount, particles, soundEngine, popups) {
    this.hp -= amount;
    this.flashTimer = 5;

    if (particles) {
      for (let i = 0; i < 4; i++) {
        const ang = Math.random() * Math.PI * 2;
        particles.addParticle(this.x, this.y, Math.cos(ang) * 1.5, Math.sin(ang) * 1.5, this.color, 2, 10);
      }
    }

    if (this.hp <= 0) {
      this.dead = true;
      if (soundEngine) soundEngine.playExplosion(this.isMoney ? 1.5 : 0.8);

      if (popups) {
        popups.addPopup(this.x, this.y - 8, this.isMoney ? '+500 PRIZE!' : 'BOOM!', this.color);
      }

      if (particles) {
        for (let i = 0; i < 24; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 1.5 + Math.random() * 3.5;
          particles.addParticle(this.x, this.y, Math.cos(ang) * spd, Math.sin(ang) * spd, this.color, 3, 24);
        }
      }
    }
  }

  update(dt) {
    if (this.flashTimer > 0) this.flashTimer -= dt;
  }

  draw(ctx) {
    const half = this.size / 2;
    ctx.fillStyle = this.flashTimer > 0 ? '#ffffff' : this.color;
    ctx.fillRect(Math.round(this.x - half), Math.round(this.y - half), this.size, this.size);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(this.x - half) + 0.5, Math.round(this.y - half) + 0.5, this.size - 1, this.size - 1);

    ctx.fillStyle = '#ffffff';
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.isMoney ? '$' : '!', Math.round(this.x), Math.round(this.y + 1));
  }
}

export class SmartBombWave {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 4;
    this.maxRadius = 240;
    this.speed = 12;
    this.dead = false;
  }

  update(dt, enemies, particles, soundEngine, screenShake, popups) {
    this.radius += this.speed * dt;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const dist = Math.hypot(e.x - this.x, e.y - this.y);
      if (Math.abs(dist - this.radius) < 16) {
        e.takeDamage(500, particles, screenShake, null, popups);
        if (e.dead) enemies.splice(i, 1);
      }
    }

    if (particles && Math.random() < 0.8) {
      for (let i = 0; i < 6; i++) {
        const ang = Math.random() * Math.PI * 2;
        particles.addParticle(
          this.x + Math.cos(ang) * this.radius,
          this.y + Math.sin(ang) * this.radius,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          '#00f0ff',
          3,
          15
        );
      }
    }

    if (this.radius >= this.maxRadius) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(Math.round(this.x), Math.round(this.y), Math.round(this.radius), 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(Math.round(this.x), Math.round(this.y), Math.max(1, Math.round(this.radius - 4)), 0, Math.PI * 2);
    ctx.stroke();
  }
}