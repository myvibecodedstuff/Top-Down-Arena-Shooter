
export const CHARACTERS = {
  COMMANDO: {
    id: 'COMMANDO',
    name: 'CYBER COMMANDO',
    title: 'THE BALANCED VETERAN',
    icon: '🎖️',
    unlocked: true,
    price: 0,
    hp: 100,
    speed: 2.2,
    dashCooldown: 45,
    startingWeapon: 'PISTOL',
    passiveDesc: '+10% Movement speed & balanced stats.',
    applyPassives: (player) => {
      player.speed = 2.4;
    }
  },
  SPEED_DEMON: {
    id: 'SPEED_DEMON',
    name: 'SPEED DEMON',
    title: 'HYPER-AGILE DODGER',
    icon: '⚡',
    unlocked: false,
    price: 500,
    hp: 75,
    speed: 2.8,
    dashCooldown: 25,
    startingWeapon: 'RAILGUN',
    passiveDesc: '-45% Dash cooldown & ultra fast speed. Starts with 75 HP.',
    applyPassives: (player) => {
      player.speed = 2.8;
      player.dashCooldownMax = 25;
    }
  },
  MECH_BRAWLER: {
    id: 'MECH_BRAWLER',
    name: 'MECH BRAWLER',
    title: 'ARMORED TANK',
    icon: '🛡️',
    unlocked: false,
    price: 800,
    hp: 150,
    speed: 1.8,
    dashCooldown: 55,
    startingWeapon: 'SHOTGUN',
    passiveDesc: '+50% Max HP (150 HP) & heavy knockback resistance.',
    applyPassives: (player) => {
      player.hp = 150;
      player.maxHp = 150;
      player.speed = 1.8;
    }
  },
  GLITCH_HACKER: {
    id: 'GLITCH_HACKER',
    name: 'GLITCH HACKER',
    title: 'TECH MANIPULATOR',
    icon: '👾',
    unlocked: false,
    price: 1200,
    hp: 90,
    speed: 2.3,
    dashCooldown: 40,
    startingWeapon: 'MISSILE',
    passiveDesc: 'Auto-launches homing glitch energy bolts every 4 seconds.',
    applyPassives: (player) => {
      player.glitchHacker = true;
    }
  },
  PYROMANIAC: {
    id: 'PYROMANIAC',
    name: 'PYROMANIAC',
    title: 'INFERNO SPECIALIST',
    icon: '🔥',
    unlocked: false,
    price: 1500,
    hp: 100,
    speed: 2.2,
    dashCooldown: 40,
    startingWeapon: 'FLAMETHROWER',
    passiveDesc: 'Leaves persistent flame trails on roll. Immune to hazard lava.',
    applyPassives: (player) => {
      player.pyroTrail = true;
    }
  },
  CASH_MAGNET: {
    id: 'CASH_MAGNET',
    name: 'CASH MAGNET',
    title: 'RATINGS MILLIONAIRE',
    icon: '💎',
    unlocked: false,
    price: 2000,
    hp: 85,
    speed: 2.3,
    dashCooldown: 40,
    startingWeapon: 'LIGHTNING',
    passiveDesc: '+100% Score & Cash gain. Crates drift towards player.',
    applyPassives: (player) => {
      player.cashMagnet = true;
    }
  }
};