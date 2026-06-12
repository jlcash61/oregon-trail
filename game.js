import {
  companionTraits,
  landmarks,
  loadouts,
  paceConfig,
  professions,
  riverCrossings,
  traits,
  weather
} from "./src/data.js";
import { els } from "./src/dom.js";
import { createEventScene } from "./src/scenes/eventScene.js";
import { createHuntScene } from "./src/scenes/huntScene.js";
import { createRiverScene } from "./src/scenes/riverScene.js";
import { createTradeScene } from "./src/scenes/tradeScene.js";
import { startTrailMap } from "./src/trailMap.js";
import { clamp, formatDate, randomInt } from "./src/utils.js";

const events = [
  {
    text: "A broken axle slowed the wagon.",
    apply: (s) => {
      s.wagon -= randomInt(10, 18);
      return "Wagon condition fell.";
    }
  },
  {
    text: "The party found wild berries near the creek.",
    apply: (s) => {
      s.food += randomInt(18, 36);
      s.morale += 4;
      return "Food and morale improved.";
    }
  },
  {
    text: "A river crossing soaked part of the food stores.",
    apply: (s) => {
      s.food -= randomInt(24, 50);
      return "Some food was lost.";
    }
  },
  {
    text: "A trader offered spare medicine for cash.",
    apply: (s) => {
      if (s.cash >= 15) {
        s.cash -= 15;
        s.medicine += 1;
        return "Bought one medicine kit.";
      }
      s.morale -= 3;
      return "Could not afford the medicine.";
    }
  },
  {
    text: "Hard miles left everyone worn down.",
    apply: (s) => {
      damageRandomMember(s, randomInt(7, 15));
      s.morale -= 3;
      return "A party member lost health.";
    }
  }
];

let state;
let huntScene;
let riverScene;
let tradeScene;
let eventScene;

function freshState() {
  return {
    started: false,
    day: 1,
    date: new Date(1848, 3, 1),
    miles: 0,
    food: 620,
    medicine: 4,
    ammo: 18,
    parts: 3,
    wagon: 100,
    morale: 78,
    cash: 80,
    pace: "steady",
    profession: "carpenter",
    pendingRiver: null,
    scouted: false,
    crossedRivers: [],
    tutorialRiverUsed: false,
    weather: weather[0],
    over: false,
    party: [
      { name: "Clara", role: "Navigator", health: 100 },
      { name: "Elias", role: "Carpenter", health: 100 },
      { name: "Mabel", role: "Cook", health: 100 },
      { name: "Jonas", role: "Scout", health: 100 }
    ],
    log: ["Your wagon leaves Independence with hope, supplies, and a long road west."]
  };
}

function startGame(event) {
  event.preventDefault();
  const chosenProfession = professions[els.profession.value];
  const chosenLoadout = loadouts[els.loadout.value];
  const names = [els.leaderName.value, els.companionOne.value, els.companionTwo.value, els.companionThree.value]
    .map((name) => name.trim())
    .map((name, index) => name || ["Clara", "Elias", "Mabel", "Jonas"][index]);

  state = freshState();
  state.started = true;
  state.profession = els.profession.value;
  state.cash = chosenProfession.cash + chosenLoadout.cash;
  state.food = chosenProfession.food + chosenLoadout.food;
  state.medicine = chosenProfession.medicine + chosenLoadout.medicine;
  state.ammo = chosenProfession.ammo + chosenLoadout.ammo;
  state.parts = chosenProfession.parts + chosenLoadout.parts;
  state.wagon = chosenProfession.wagon + chosenLoadout.wagon;
  state.party = [
    { name: names[0], role: chosenProfession.role, trait: professionTrait(els.profession.value), health: 100 },
    { name: names[1], role: "Trail Hand", trait: companionTraits[0], health: 100 },
    { name: names[2], role: "Cook", trait: companionTraits[1], health: 100 },
    { name: names[3], role: "Scout", trait: companionTraits[2], health: 100 }
  ];
  state.log = [
    `${names[0]} leads the wagon out of Independence.`,
    `You are traveling as a ${chosenProfession.role.toLowerCase()} with a ${els.loadout.options[els.loadout.selectedIndex].text.toLowerCase()}.`
  ];
  normalize();
  render();
  saveGame(false);
}

function saveGame(showMessage = true) {
  if (!state.started || state.over) return;
  localStorage.setItem("modernOregonTrailSave", JSON.stringify(state));
  if (showMessage) {
    addLog("Game saved at the trail journal.");
    render();
  }
}

function loadGame() {
  const saved = localStorage.getItem("modernOregonTrailSave");
  if (!saved) {
    addLog("No saved journey found yet.");
    render();
    return;
  }

  try {
    stopScenes();
    state = JSON.parse(saved);
    state.date = new Date(state.date);
    state.weather = weather.find((item) => item.label === state.weather.label) || weather[0];
    state.ammo = Number.isFinite(state.ammo) ? state.ammo : 18;
    state.parts = Number.isFinite(state.parts) ? state.parts : 3;
    state.scouted = Boolean(state.scouted);
    state.party = state.party.map((member, index) => ({
      ...member,
      trait: member.trait || [professionTrait(state.profession), ...companionTraits][index] || "trailwise"
    }));
    state.started = true;
    state.over = false;
    els.modal.hidden = true;
    els.actionScene.hidden = true;
    addLog("Loaded your saved journey.");
    render();
    if (state.pendingRiver) {
      const river = riverCrossings.find((item) => item.id === state.pendingRiver);
      if (river) riverScene.showChoice(river);
    }
  } catch {
    localStorage.removeItem("modernOregonTrailSave");
    addLog("The saved journey could not be loaded.");
    render();
  }
}

function livingParty() {
  return state.party.filter((member) => member.health > 0);
}

function professionTrait(profession) {
  if (profession === "doctor") return "medic";
  if (profession === "hunter") return "sharpshot";
  if (profession === "merchant") return "steady";
  return "mechanic";
}

function hasLivingTrait(trait) {
  return state.party.some((member) => member.health > 0 && member.trait === trait);
}

function damageRandomMember(s, amount) {
  const candidates = s.party.filter((member) => member.health > 0);
  if (!candidates.length) return;
  const member = candidates[randomInt(0, candidates.length - 1)];
  member.health = clamp(member.health - amount, 0, 100);
}

function addLog(message) {
  state.log.push(message);
  state.log = state.log.slice(-12);
}

function advanceDays(days) {
  state.day += days;
  state.date.setDate(state.date.getDate() + days);
}

function consumeFood(multiplier = 1) {
  const cookBonus = hasLivingTrait("cook") ? 0.88 : 1;
  state.food -= Math.ceil(livingParty().length * paceConfig[state.pace].food * multiplier * cookBonus);
  if (state.food < 0) {
    state.food = 0;
    state.morale -= 8;
    state.party.forEach((member) => {
      if (member.health > 0) member.health = clamp(member.health - randomInt(5, 12), 0, 100);
    });
    addLog("Food ran out. Hunger damaged the whole party.");
  }
}

function setWeather() {
  const roll = Math.random();
  if (roll > 0.88) state.weather = weather[randomInt(2, weather.length - 1)];
  else if (roll > 0.68) state.weather = weather[1];
  else state.weather = weather[0];
}

function currentLandmark() {
  return landmarks.reduce((best, item) => (state.miles >= item.miles ? item : best), landmarks[0]);
}

function nextLandmark() {
  return landmarks.find((item) => item.miles > state.miles) || landmarks[landmarks.length - 1];
}

function travel() {
  if (!state.started || state.over || state.pendingRiver) return;
  setWeather();
  const pace = paceConfig[state.pace];
  const miles = Math.round(randomInt(pace.miles[0], pace.miles[1]) * state.weather.travel);
  const previousMiles = state.miles;
  state.miles = clamp(state.miles + miles, 0, 2000);
  state.wagon += pace.wagon;
  state.morale += pace.stress;
  consumeFood(1);
  advanceDays(1);

  const scoutBonus = hasLivingTrait("trailwise") ? -5 : 0;
  const moraleBonus = hasLivingTrait("steady") && state.morale < 45 ? -4 : 0;
  const scoutingBonus = state.scouted ? -12 : 0;
  const risk = 12 + state.weather.risk + (state.pace === "fast" ? 10 : 0) + (state.wagon < 35 ? 8 : 0) + scoutBonus + moraleBonus + scoutingBonus;
  addLog(`Traveled ${miles} miles through ${state.weather.label.toLowerCase()} weather.`);
  if (state.scouted) {
    addLog("The scout's route notes helped the wagon avoid the worst ground.");
    state.scouted = false;
  }

  if (Math.random() * 100 < risk) {
    const event = events[randomInt(0, events.length - 1)];
    addLog(`${event.text} ${event.apply(state)}`);
  }

  const river = riverCrossings.find((item) => previousMiles < item.miles && state.miles >= item.miles && !state.crossedRivers.includes(item.id));
  if (river) {
    state.miles = river.miles;
    state.pendingRiver = river.id;
    addLog(`Reached ${river.name}. The wagon must cross before continuing.`);
    normalize();
    render();
    riverScene.showChoice(river);
    return;
  }

  normalize();
  checkEnd();
  if (!state.over && Math.random() > 0.72) {
    render();
    eventScene.showRandom();
    return;
  }
  render();
  saveGame(false);
}

function hunt() {
  if (!state.started || state.over || state.pendingRiver) return;
  if (state.ammo <= 0) {
    addLog("The party has no ammunition for hunting.");
    state.morale -= 2;
    normalize();
    render();
    return;
  }
  huntScene.show();
}

function rest() {
  if (!state.started || state.over) return;
  const days = randomInt(2, 3);
  state.party.forEach((member) => {
    const medicBonus = hasLivingTrait("medic") ? 6 : 0;
    if (member.health > 0) member.health = clamp(member.health + randomInt(8, 16) + medicBonus, 0, 100);
  });
  state.morale += 7;
  advanceDays(days);
  consumeFood(days * 0.7);
  addLog(`Rested ${days} days. Health and morale improved.`);
  normalize();
  checkEnd();
  render();
  saveGame(false);
}

function repair() {
  if (!state.started || state.over || state.pendingRiver) return;
  if (state.parts <= 0) {
    const patched = randomInt(3, 8);
    state.wagon += patched;
    state.morale -= 5;
    advanceDays(1);
    consumeFood(0.45);
    addLog(`No spare parts remained. The party made a rough patch worth ${patched}%.`);
    normalize();
    checkEnd();
    render();
    saveGame(false);
    return;
  }
  const traitBonus = hasLivingTrait("mechanic") ? 8 : 0;
  const repaired = randomInt(12, 24) + professions[state.profession].repairBonus + traitBonus;
  state.parts -= 1;
  state.wagon += repaired;
  state.morale -= 2;
  advanceDays(1);
  consumeFood(0.55);
  addLog(`Used one spare part and repaired the wagon by ${repaired}%.`);
  normalize();
  checkEnd();
  render();
  saveGame(false);
}

function trade() {
  if (!state.started || state.over || state.pendingRiver) return;
  tradeScene.show();
}

function scout() {
  if (!state.started || state.over || state.pendingRiver) return;
  state.scouted = true;
  state.morale += hasLivingTrait("trailwise") ? 1 : -1;
  advanceDays(1);
  consumeFood(0.35);
  addLog(hasLivingTrait("trailwise")
    ? "The scout found a safer line for tomorrow's travel."
    : "The party spent time scouting a safer line for tomorrow's travel.");
  normalize();
  checkEnd();
  render();
  saveGame(false);
}

function normalize() {
  state.food = clamp(state.food, 0, 900);
  state.medicine = clamp(state.medicine, 0, 8);
  state.ammo = clamp(state.ammo, 0, 40);
  state.parts = clamp(state.parts, 0, 8);
  state.wagon = clamp(state.wagon, 0, 100);
  state.morale = clamp(state.morale, 0, 100);

  if (state.wagon <= 0) {
    state.party.forEach((member) => {
      if (member.health > 0) member.health = clamp(member.health - randomInt(8, 15), 0, 100);
    });
    state.wagon = 12;
    addLog("The wagon nearly collapsed. The party patched it together at a cost.");
  }

  if (state.medicine > 0) {
    const sick = state.party.find((member) => member.health > 0 && member.health < 35);
    if (sick) {
      state.medicine -= 1;
      sick.health = clamp(sick.health + randomInt(18, 28), 0, 100);
      addLog(`${sick.name} used medicine and recovered some strength.`);
    }
  }
}

function checkEnd() {
  if (state.miles >= 2000) {
    state.over = true;
    showModal("Arrival", "Oregon City reached", `You arrived on ${formatDate(state.date)} with ${livingParty().length} party members, ${Math.round(state.food)} lb of food, and a wagon still rolling.`);
  } else if (!livingParty().length) {
    state.over = true;
    showModal("Journey ended", "No one survived", "The trail claimed the whole party. Better supply choices and more rest may change the next run.");
  } else if (state.day > 210) {
    state.over = true;
    showModal("Winter caught you", "The season closed in", "The wagon did not reach Oregon before the mountain passes became too dangerous.");
  }
}

function showModal(eyebrow, title, text) {
  els.actionScene.hidden = true;
  stopScenes();
  els.modalEyebrow.textContent = eyebrow;
  els.modalTitle.textContent = title;
  els.modalText.textContent = text;
  els.choiceList.innerHTML = "";
  els.modalButton.hidden = false;
  els.modal.hidden = false;
  document.querySelectorAll(".actions button").forEach((button) => {
    button.disabled = true;
  });
}

function render() {
  els.setupPanel.hidden = state.started;
  els.dashboard.hidden = !state.started;
  els.date.textContent = formatDate(state.date);
  els.miles.textContent = Math.round(state.miles).toLocaleString();
  els.landmark.textContent = currentLandmark().name;
  els.paceLabel.textContent = paceConfig[state.pace].label;
  els.weather.textContent = state.weather.label;
  els.cash.textContent = `$${state.cash}`;
  els.turn.textContent = `Day ${state.day}`;

  els.foodText.textContent = `${Math.round(state.food)} lb`;
  els.medicineText.textContent = `${state.medicine} kits`;
  els.ammoText.textContent = `${state.ammo} shots`;
  els.partsText.textContent = `${state.parts}`;
  els.wagonText.textContent = `${Math.round(state.wagon)}%`;
  els.moraleText.textContent = `${Math.round(state.morale)}%`;

  setBar(els.foodBar, state.food / 900);
  setBar(els.medicineBar, state.medicine / 8);
  setBar(els.ammoBar, state.ammo / 40);
  setBar(els.partsBar, state.parts / 8);
  setBar(els.wagonBar, state.wagon / 100);
  setBar(els.moraleBar, state.morale / 100);

  els.party.innerHTML = state.party
    .map((member) => {
      const status = member.health <= 0 ? "Lost" : member.health < 35 ? "Critical" : member.health < 65 ? "Weak" : "Healthy";
      const trait = traits[member.trait] || { label: "Settler", text: "No special bonus." };
      return `
        <div class="member">
          <span class="avatar">${member.name[0]}</span>
          <span><strong>${member.name}</strong><small>${member.role} - ${trait.label} - ${status}</small></span>
          <span class="health">${Math.round(member.health)}%</span>
        </div>
      `;
    })
    .join("");

  els.log.innerHTML = state.log.map((message) => `<li>${message}</li>`).join("");
  requestAnimationFrame(() => {
    els.log.scrollTop = els.log.scrollHeight;
  });
  document.querySelectorAll(".pace-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.pace === state.pace);
  });
  document.querySelectorAll(".actions button").forEach((button) => {
    button.disabled = !state.started || state.over || Boolean(state.pendingRiver);
  });
  document.querySelectorAll(".pace-option").forEach((button) => {
    button.disabled = !state.started || state.over || Boolean(state.pendingRiver);
  });
  els.saveButton.disabled = !state.started || state.over || Boolean(state.pendingRiver);
  els.continueButton.disabled = !localStorage.getItem("modernOregonTrailSave");
}

function setBar(element, ratio) {
  element.style.width = `${clamp(ratio, 0, 1) * 100}%`;
  element.style.background = ratio < 0.28 ? "linear-gradient(90deg, #ef7a72, #f1bd61)" : "";
}

function restart() {
  state = freshState();
  stopScenes();
  els.modal.hidden = true;
  els.actionScene.hidden = true;
  els.startCrossingButton.hidden = true;
  els.startCrossingButton.textContent = "Start Crossing";
  els.modalButton.hidden = false;
  els.choiceList.innerHTML = "";
  document.querySelectorAll(".actions button").forEach((button) => {
    button.disabled = false;
  });
  render();
}

function stopScenes() {
  riverScene?.stop();
  huntScene?.stop();
  tradeScene?.stop();
  eventScene?.stop();
}

huntScene = createHuntScene({
  els,
  clamp,
  randomInt,
  professions,
  getState: () => state,
  hasLivingTrait,
  damageRandomMember,
  advanceDays,
  consumeFood,
  addLog,
  normalize,
  checkEnd,
  render,
  saveGame,
  stopRiverScene: () => riverScene.stop()
});

riverScene = createRiverScene({
  els,
  clamp,
  randomInt,
  getState: () => state,
  damageRandomMember,
  advanceDays,
  consumeFood,
  addLog,
  normalize,
  checkEnd,
  render,
  saveGame,
  stopHuntScene: () => huntScene.stop()
});

tradeScene = createTradeScene({
  els,
  getState: () => state,
  hasLivingTrait,
  advanceDays,
  consumeFood,
  addLog,
  normalize,
  checkEnd,
  render,
  saveGame,
  stopRiverScene: () => riverScene.stop(),
  stopHuntScene: () => huntScene.stop()
});

eventScene = createEventScene({
  els,
  randomInt,
  getState: () => state,
  hasLivingTrait,
  damageRandomMember,
  addLog,
  normalize,
  checkEnd,
  render,
  saveGame,
  stopRiverScene: () => riverScene.stop(),
  stopHuntScene: () => huntScene.stop(),
  stopTradeScene: () => tradeScene.stop()
});

els.setupForm.addEventListener("submit", startGame);
document.querySelector("#travelButton").addEventListener("click", travel);
document.querySelector("#huntButton").addEventListener("click", hunt);
document.querySelector("#restButton").addEventListener("click", rest);
document.querySelector("#repairButton").addEventListener("click", repair);
document.querySelector("#tradeButton").addEventListener("click", trade);
document.querySelector("#scoutButton").addEventListener("click", scout);
document.querySelector("#restartButton").addEventListener("click", restart);
els.saveButton.addEventListener("click", () => saveGame(true));
els.continueButton.addEventListener("click", loadGame);
els.modalButton.addEventListener("click", restart);
els.riverScene.addEventListener("click", huntScene.handleSceneClick);
els.huntTarget.addEventListener("click", huntScene.handleTargetClick);
bindSteeringButton(els.steerLeft, 1);
bindSteeringButton(els.steerRight, -1);

window.addEventListener("keydown", (event) => {
  if (!riverScene.isSteering()) return;
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    event.preventDefault();
    riverScene.setSteer(1);
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    event.preventDefault();
    riverScene.setSteer(-1);
  }
});

window.addEventListener("keyup", (event) => {
  if (!riverScene.isSteering()) return;
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") riverScene.clearSteer(1);
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") riverScene.clearSteer(-1);
});

document.querySelectorAll(".pace-option").forEach((button) => {
  button.addEventListener("click", () => {
    state.pace = button.dataset.pace;
    addLog(`Pace changed to ${paceConfig[state.pace].label.toLowerCase()}.`);
    render();
  });
});

function bindSteeringButton(button, direction) {
  const start = (event) => {
    event.preventDefault();
    if (event.pointerId !== undefined && button.setPointerCapture) {
      button.setPointerCapture(event.pointerId);
    }
    riverScene.setSteer(direction);
  };

  const stop = (event) => {
    event.preventDefault();
    riverScene.clearSteer(direction);
  };

  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", stop);
  button.addEventListener("lostpointercapture", stop);
  button.addEventListener("mouseleave", stop);
  button.addEventListener("touchstart", start, { passive: false });
  button.addEventListener("touchend", stop, { passive: false });
  button.addEventListener("touchcancel", stop, { passive: false });
  button.addEventListener("mousedown", start);
  button.addEventListener("mouseup", stop);
}

restart();
startTrailMap({
  landmarks,
  getState: () => state,
  nextLandmark,
  clamp,
  randomInt
});
