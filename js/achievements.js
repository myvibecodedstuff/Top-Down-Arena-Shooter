
export const ACHIEVEMENTS = [
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

export class AchievementManager {
  constructor(saveManager) {
    this.saveManager = saveManager;
    this.toastContainer = null;
    this.setupUI();
  }

  setupUI() {
    let container = document.getElementById('achievement-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'achievement-toast-container';
      container.style.cssText = `
        position: absolute;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 100;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    this.toastContainer = container;
  }

  unlock(achievementId) {
    const save = this.saveManager.data;
    if (!save.achievements.includes(achievementId)) {
      save.achievements.push(achievementId);
      this.saveManager.save();

      const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
      if (ach) {
        this.showToast(ach);
      }
    }
  }

  showToast(ach) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: #120e24;
      border: 3px solid #ffe600;
      color: #fff;
      padding: 12px 18px;
      border-radius: 6px;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      box-shadow: 0 0 20px rgba(255, 230, 0, 0.4), 4px 4px 0 #000;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: toastSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

    toast.innerHTML = `
      <div style="font-size: 24px;">${ach.icon}</div>
      <div>
        <div style="color: #ffe600; font-size: 9px; margin-bottom: 4px;">🏆 ACHIEVEMENT UNLOCKED!</div>
        <div style="color: #00f0ff; font-size: 11px;">${ach.title}</div>
        <div style="font-family:'VT323',monospace; font-size: 16px; color: #aaa; margin-top: 2px;">${ach.desc}</div>
      </div>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s';
      setTimeout(() => toast.remove(), 500);
    }, 3500);
  }
}