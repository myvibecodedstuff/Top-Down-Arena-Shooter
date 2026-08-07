
const SAVE_KEY = 'crate_arena_v1_save';

export class SaveManager {
  constructor() {
    this.data = this.load();
  }

  load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.warn('Failed to parse save data:', e);
      }
    }
    return {
      cash: 0,
      highScore: 0,
      unlockedCharacters: ['COMMANDO'],
      unlockedWeapons: ['PISTOL', 'SHOTGUN', 'PLASMA', 'RAILGUN', 'SAWBLADE', 'MISSILE'],
      upgrades: {
        hpBonus: 0,
        speedBonus: 0,
        startingBomb: 0
      },
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

  unlockCharacter(charId) {
    if (!this.data.unlockedCharacters.includes(charId)) {
      this.data.unlockedCharacters.push(charId);
      this.save();
    }
  }

  isCharacterUnlocked(charId) {
    return this.data.unlockedCharacters.includes(charId);
  }

  buyUpgrade(type, cost) {
    if (this.spendCash(cost)) {
      this.data.upgrades[type] = (this.data.upgrades[type] || 0) + 1;
      this.save();
      return true;
    }
    return false;
  }
}

export const UPGRADES = {
  hpBonus: { name: 'MAX HP +15%', max: 3, baseCost: 400 },
  speedBonus: { name: 'SPEED +10%', max: 3, baseCost: 500 },
  startingBomb: { name: 'EXTRA SMART BOMB', max: 2, baseCost: 750 }
};