
import { WEAPONS } from './weapons.js';
import { soundEngine } from './audio.js';

export class CrateManager {
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