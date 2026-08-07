
export const PERKS = {
  OVERCLOCK_DASH: {
    id: 'OVERCLOCK_DASH',
    name: '⚡ OVERCLOCKED DASH',
    desc: '-40% Dash cooldown & leaves a trail of fiery sparks!',
    icon: '⚡'
  },
  CRATE_MAGNET: {
    id: 'CRATE_MAGNET',
    name: '🧲 CRATE MAGNET',
    desc: 'Crates automatically drift towards you across the arena.',
    icon: '🧲'
  },
  EJECTOR_PULSE: {
    id: 'EJECTOR_PULSE',
    name: '💥 EJECTOR PULSE',
    desc: 'Swapping weapons emits a shockwave that knocks back enemies.',
    icon: '💥'
  },
  VAMPIRIC_KILLS: {
    id: 'VAMPIRIC_KILLS',
    name: '🩸 VAMPIRIC SPONSOR',
    desc: 'Defeating enemies restores 1% Contestant HP.',
    icon: '🩸'
  },
  DOUBLE_CASH: {
    id: 'DOUBLE_CASH',
    name: '💰 GOLDEN SPONSORSHIP',
    desc: '+100% Score & Prize drops from all crates and barrels.',
    icon: '💰'
  },
  SMART_BOMB_CHARGER: {
    id: 'SMART_BOMB_CHARGER',
    name: '💣 NUKER SPONSOR',
    desc: 'Gain 1 extra Smart Bomb charge per wave clear.',
    icon: '💣'
  }
};

export class PerkManager {
  constructor() {
    this.activePerks = new Set();
  }

  reset() {
    this.activePerks.clear();
  }

  addPerk(perkId) {
    this.activePerks.add(perkId);
  }

  hasPerk(perkId) {
    return this.activePerks.has(perkId);
  }

  getRandomChoices(count = 3) {
    const keys = Object.keys(PERKS).filter(k => !this.activePerks.has(k));
    const shuffled = keys.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(k => PERKS[k]);
  }
}