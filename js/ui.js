
export class UIManager {
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