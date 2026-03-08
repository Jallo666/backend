export const TILE   = 32;
export const COLS   = 21;
export const ROWS   = 15;
export const W      = COLS * TILE;
export const H      = ROWS * TILE;
export const HUD    = 132;
export const FACE_H = 10;

export const T = { WALL: 0, FLOOR: 1, STAIRS: 2 };

export const ENEMIES = [
  { name: "Slime",    maxHp: 8,  atk: 2,  color: "#2daa3d", xp: 10  },
  { name: "Skeleton", maxHp: 15, atk: 4,  color: "#9898b8", xp: 25  },
  { name: "Orc",      maxHp: 25, atk: 7,  color: "#7a3a10", xp: 45  },
  { name: "Dragon",   maxHp: 50, atk: 12, color: "#cc2222", xp: 100 },
];

export const BOSS_TYPES = [
  { name: "GOLEM",  maxHp: 80,  atk: 10, color: "#445577", xp: 200 },
  { name: "LICH",   maxHp: 65,  atk: 16, color: "#882299", xp: 350 },
  { name: "DEMONE", maxHp: 120, atk: 22, color: "#aa0000", xp: 600 },
];

export const GEM_TYPES = [
  { color: "#cc2222", label: "Rubino",   value: 1  },
  { color: "#22cc44", label: "Smeraldo", value: 3  },
  { color: "#2266ee", label: "Zaffiro",  value: 8  },
  { color: "#9922cc", label: "Ametista", value: 20 },
  { color: "#d4a820", label: "Topazio",  value: 50 },
];

export const SPELLS = [
  { id: "heal",      name: "CURA",    icon: "💚", cost: 18, desc: "Recupera HP",   fc: "rgba(50,200,80,0.35)",   unlockAt: 1 },
  { id: "ice",       name: "GELO",    icon: "❄",  cost: 15, desc: "Stordisce",     fc: "rgba(100,220,255,0.35)", unlockAt: 3 },
  { id: "fire",      name: "FIAMMA",  icon: "🔥", cost: 20, desc: "Singolo forte", fc: "rgba(255,100,30,0.4)",   unlockAt: 5 },
  { id: "lightning", name: "FULMINE", icon: "⚡", cost: 25, desc: "AOE",           fc: "rgba(100,160,255,0.4)",  unlockAt: 8 },
];
