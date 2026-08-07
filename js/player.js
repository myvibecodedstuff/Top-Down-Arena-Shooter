
import { Bullet, WEAPONS } from './weapons.js';

export class Player {
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