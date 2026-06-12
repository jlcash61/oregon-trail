export const landmarks = [
  { name: "Independence", miles: 0 },
  { name: "Kansas River", miles: 102 },
  { name: "Fort Kearny", miles: 315 },
  { name: "Chimney Rock", miles: 554 },
  { name: "Fort Laramie", miles: 640 },
  { name: "Independence Rock", miles: 830 },
  { name: "South Pass", miles: 932 },
  { name: "Fort Bridger", miles: 1065 },
  { name: "Snake River", miles: 1348 },
  { name: "The Dalles", miles: 1700 },
  { name: "Oregon City", miles: 2000 }
];

export const riverCrossings = [
  {
    id: "kansas",
    name: "Kansas River",
    miles: 102,
    depth: "3.2 ft",
    width: "620 ft",
    toll: 8
  },
  {
    id: "snake",
    name: "Snake River",
    miles: 1348,
    depth: "5.6 ft",
    width: "910 ft",
    toll: 18
  }
];

export const paceConfig = {
  careful: { label: "Careful", miles: [10, 16], food: 10, stress: -2, wagon: -1 },
  steady: { label: "Steady", miles: [15, 24], food: 12, stress: 1, wagon: -2 },
  fast: { label: "Fast", miles: [22, 34], food: 16, stress: 4, wagon: -4 }
};

export const weather = [
  { label: "Clear", travel: 1, risk: 0 },
  { label: "Hot", travel: 0.94, risk: 3 },
  { label: "Rain", travel: 0.82, risk: 6 },
  { label: "Storm", travel: 0.58, risk: 12 },
  { label: "Cold", travel: 0.88, risk: 5 }
];

export const professions = {
  carpenter: { role: "Carpenter", cash: 80, food: 620, medicine: 4, ammo: 18, parts: 5, wagon: 100, huntBonus: 0, repairBonus: 12 },
  doctor: { role: "Doctor", cash: 70, food: 600, medicine: 7, ammo: 16, parts: 3, wagon: 96, huntBonus: 0, repairBonus: 0 },
  hunter: { role: "Hunter", cash: 65, food: 560, medicine: 4, ammo: 28, parts: 3, wagon: 96, huntBonus: 35, repairBonus: 0 },
  merchant: { role: "Merchant", cash: 125, food: 580, medicine: 4, ammo: 18, parts: 3, wagon: 96, huntBonus: 0, repairBonus: 0 }
};

export const loadouts = {
  balanced: { food: 0, medicine: 0, ammo: 0, parts: 0, wagon: 0, cash: 0 },
  food: { food: 180, medicine: -1, ammo: -4, parts: -1, wagon: -4, cash: -20 },
  tools: { food: -90, medicine: 2, ammo: 2, parts: 3, wagon: 8, cash: -15 }
};

export const traits = {
  trailwise: { label: "Trailwise", text: "Lowers travel event risk." },
  cook: { label: "Cook", text: "Reduces daily food waste." },
  medic: { label: "Medic", text: "Improves rest recovery." },
  steady: { label: "Steady", text: "Protects morale on hard days." },
  sharpshot: { label: "Sharpshot", text: "Adds an extra hunting shot." },
  mechanic: { label: "Mechanic", text: "Improves wagon repairs." }
};

export const companionTraits = ["mechanic", "cook", "trailwise"];
