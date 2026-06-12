const canvas = document.querySelector("#trailCanvas");
const ctx = canvas.getContext("2d");

const landmarks = [
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

const riverCrossings = [
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

const paceConfig = {
  careful: { label: "Careful", miles: [10, 16], food: 12, stress: -2, wagon: -1 },
  steady: { label: "Steady", miles: [15, 24], food: 15, stress: 1, wagon: -2 },
  fast: { label: "Fast", miles: [22, 34], food: 19, stress: 4, wagon: -4 }
};

const weather = [
  { label: "Clear", travel: 1, risk: 0 },
  { label: "Hot", travel: 0.94, risk: 3 },
  { label: "Rain", travel: 0.82, risk: 6 },
  { label: "Storm", travel: 0.58, risk: 12 },
  { label: "Cold", travel: 0.88, risk: 5 }
];

const professions = {
  carpenter: { role: "Carpenter", cash: 80, food: 620, medicine: 4, wagon: 100, huntBonus: 0, repairBonus: 12 },
  doctor: { role: "Doctor", cash: 70, food: 600, medicine: 7, wagon: 96, huntBonus: 0, repairBonus: 0 },
  hunter: { role: "Hunter", cash: 65, food: 560, medicine: 4, wagon: 96, huntBonus: 35, repairBonus: 0 },
  merchant: { role: "Merchant", cash: 125, food: 580, medicine: 4, wagon: 96, huntBonus: 0, repairBonus: 0 }
};

const loadouts = {
  balanced: { food: 0, medicine: 0, wagon: 0, cash: 0 },
  food: { food: 180, medicine: -1, wagon: -4, cash: -20 },
  tools: { food: -90, medicine: 2, wagon: 8, cash: -15 }
};

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

const els = {
  date: document.querySelector("#dateChip"),
  miles: document.querySelector("#miles"),
  landmark: document.querySelector("#landmark"),
  paceLabel: document.querySelector("#paceLabel"),
  party: document.querySelector("#party"),
  foodBar: document.querySelector("#foodBar"),
  medicineBar: document.querySelector("#medicineBar"),
  wagonBar: document.querySelector("#wagonBar"),
  moraleBar: document.querySelector("#moraleBar"),
  foodText: document.querySelector("#foodText"),
  medicineText: document.querySelector("#medicineText"),
  wagonText: document.querySelector("#wagonText"),
  moraleText: document.querySelector("#moraleText"),
  weather: document.querySelector("#weatherBadge"),
  cash: document.querySelector("#cashBadge"),
  turn: document.querySelector("#turnBadge"),
  log: document.querySelector("#log"),
  dashboard: document.querySelector("#dashboard"),
  setupPanel: document.querySelector("#setupPanel"),
  setupForm: document.querySelector("#setupForm"),
  leaderName: document.querySelector("#leaderName"),
  companionOne: document.querySelector("#companionOne"),
  companionTwo: document.querySelector("#companionTwo"),
  companionThree: document.querySelector("#companionThree"),
  profession: document.querySelector("#professionSelect"),
  loadout: document.querySelector("#loadoutSelect"),
  saveButton: document.querySelector("#saveButton"),
  continueButton: document.querySelector("#continueButton"),
  modal: document.querySelector("#modal"),
  modalEyebrow: document.querySelector("#modalEyebrow"),
  modalTitle: document.querySelector("#modalTitle"),
  modalText: document.querySelector("#modalText"),
  choiceList: document.querySelector("#choiceList"),
  modalButton: document.querySelector("#modalButton"),
  actionScene: document.querySelector("#actionScene"),
  sceneTitle: document.querySelector("#sceneTitle"),
  sceneText: document.querySelector("#sceneText"),
  sceneRiskBar: document.querySelector("#sceneRiskBar"),
  sceneRiskText: document.querySelector("#sceneRiskText"),
  sceneChoices: document.querySelector("#sceneChoices"),
  startCrossingButton: document.querySelector("#startCrossingButton"),
  riverScene: document.querySelector(".river-scene"),
  steeringControls: document.querySelector("#steeringControls"),
  steerLeft: document.querySelector("#steerLeft"),
  steerRight: document.querySelector("#steerRight"),
  steerScore: document.querySelector("#steerScore")
};

let state;
let animationFrame = 0;
let canvasWidth = 1100;
let canvasHeight = 520;
let steering = null;

function freshState() {
  return {
    started: false,
    day: 1,
    date: new Date(1848, 3, 1),
    miles: 0,
    food: 620,
    medicine: 4,
    wagon: 100,
    morale: 78,
    cash: 80,
    pace: "steady",
    profession: "carpenter",
    pendingRiver: null,
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
  state.wagon = chosenProfession.wagon + chosenLoadout.wagon;
  state.party = [
    { name: names[0], role: chosenProfession.role, health: 100 },
    { name: names[1], role: "Trail Hand", health: 100 },
    { name: names[2], role: "Cook", health: 100 },
    { name: names[3], role: "Scout", health: 100 }
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
    state = JSON.parse(saved);
    state.date = new Date(state.date);
    state.weather = weather.find((item) => item.label === state.weather.label) || weather[0];
    state.started = true;
    state.over = false;
    els.modal.hidden = true;
    els.actionScene.hidden = true;
    addLog("Loaded your saved journey.");
    render();
    if (state.pendingRiver) {
      const river = riverCrossings.find((item) => item.id === state.pendingRiver);
      if (river) showRiverChoice(river);
    }
  } catch {
    localStorage.removeItem("modernOregonTrailSave");
    addLog("The saved journey could not be loaded.");
    render();
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function livingParty() {
  return state.party.filter((member) => member.health > 0);
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
  state.food -= Math.ceil(livingParty().length * paceConfig[state.pace].food * multiplier);
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

  const risk = 12 + state.weather.risk + (state.pace === "fast" ? 10 : 0) + (state.wagon < 35 ? 8 : 0);
  addLog(`Traveled ${miles} miles through ${state.weather.label.toLowerCase()} weather.`);

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
    showRiverChoice(river);
    return;
  }

  normalize();
  checkEnd();
  render();
  saveGame(false);
}

function hunt() {
  if (!state.started || state.over || state.pendingRiver) return;
  const gain = randomInt(35, 105) + professions[state.profession].huntBonus;
  state.food += gain;
  state.morale += randomInt(-1, 4);
  damageRandomMember(state, Math.random() > 0.86 ? randomInt(4, 10) : 0);
  advanceDays(1);
  consumeFood(0.45);
  addLog(`Hunting added ${gain} lb of food.`);
  normalize();
  checkEnd();
  render();
  saveGame(false);
}

function rest() {
  if (!state.started || state.over) return;
  const days = randomInt(2, 3);
  state.party.forEach((member) => {
    if (member.health > 0) member.health = clamp(member.health + randomInt(8, 16), 0, 100);
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
  const repaired = randomInt(12, 24) + professions[state.profession].repairBonus;
  state.wagon += repaired;
  state.morale -= 2;
  advanceDays(1);
  consumeFood(0.55);
  addLog(`Repaired the wagon by ${repaired}%.`);
  normalize();
  checkEnd();
  render();
  saveGame(false);
}

function trade() {
  if (!state.started || state.over || state.pendingRiver) return;
  if (state.cash >= 20) {
    state.cash -= 20;
    state.food += 70;
    state.morale += 2;
    addLog("Traded $20 for 70 lb of food.");
  } else if (state.medicine > 0) {
    state.medicine -= 1;
    state.food += 45;
    addLog("Traded one medicine kit for 45 lb of food.");
  } else {
    state.morale -= 6;
    addLog("No trader was willing to make a useful deal.");
  }
  advanceDays(1);
  consumeFood(0.4);
  normalize();
  checkEnd();
  render();
  saveGame(false);
}

function showRiverChoice(river) {
  stopSteering();
  els.riverScene.classList.remove("crossing-success", "crossing-fail", "steering");
  els.riverScene.style.removeProperty("--wagon-x");
  els.riverScene.style.removeProperty("--wagon-y");
  els.steeringControls.hidden = true;
  els.startCrossingButton.hidden = true;
  els.startCrossingButton.textContent = "Start Crossing";
  els.sceneTitle.textContent = river.name;
  els.sceneText.textContent = `The river is ${river.depth} deep and about ${river.width} wide. Pick a crossing method first. After that, you will steer the wagon through the bright channel.`;
  els.sceneChoices.innerHTML = "";
  els.sceneRiskBar.style.width = `${estimateRiverRisk(river, "ford")}%`;
  els.sceneRiskText.textContent = riskLabel(estimateRiverRisk(river, "ford"));

  const choices = [
    { id: "ford", title: "Ford the river", text: "Fast and free, but dangerous if the water is deep." },
    { id: "caulk", title: "Caulk the wagon", text: "Costs one day and morale, but lowers the risk." },
    { id: "ferry", title: `Hire a ferry for $${river.toll}`, text: "Safest choice, if the party can afford it." }
  ];

  choices.forEach((choice) => {
    const risk = estimateRiverRisk(river, choice.id);
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<strong>${choice.title}</strong><span>${choice.text} Risk: ${riskLabel(risk).toLowerCase()}.</span>`;
    button.addEventListener("mouseenter", () => {
      els.sceneRiskBar.style.width = `${risk}%`;
      els.sceneRiskText.textContent = riskLabel(risk);
    });
    button.addEventListener("focus", () => {
      els.sceneRiskBar.style.width = `${risk}%`;
      els.sceneRiskText.textContent = riskLabel(risk);
    });
    button.addEventListener("click", () => {
      els.sceneChoices.querySelectorAll("button").forEach((item) => {
        item.disabled = true;
      });
      resolveRiverChoice(river, choice.id);
    });
    els.sceneChoices.append(button);
  });

  els.actionScene.hidden = false;
}

function resolveRiverChoice(river, choice) {
  prepareSteeringChallenge(river, choice, estimateRiverRisk(river, choice));
}

function prepareSteeringChallenge(river, choice, baseRisk) {
  const isTutorial = river.id === "kansas" && !state.tutorialRiverUsed;
  els.sceneChoices.innerHTML = "";
  els.steeringControls.hidden = true;
  els.startCrossingButton.hidden = false;
  els.sceneTitle.textContent = isTutorial ? "How to Cross" : "Ready the Wagon";
  els.sceneText.textContent = isTutorial
    ? "This first crossing is practice. Press Start Crossing when ready, then use left/right arrows, A/D, or the buttons to keep the wagon inside the bright channel. If this first attempt goes badly, you get one retry."
    : "Press Start Crossing when ready, then steer through the bright channel. Your control changes the final risk from this crossing method.";
  els.sceneRiskBar.style.width = `${baseRisk}%`;
  els.sceneRiskText.textContent = `${riskLabel(baseRisk)} base`;
  els.startCrossingButton.onclick = () => startSteeringChallenge(river, choice, baseRisk, isTutorial);
}

function completeRiverChoice(river, choice, skillAdjustment, tutorialAttempt = false) {
  let risk = clamp(estimateRiverRisk(river, choice) + skillAdjustment, 2, 88);
  let summary = "";
  let outcomeText = "";
  let failed = false;
  let losses = null;

  if (choice === "ford") {
    summary = `The party forded ${river.name}.`;
  }

  if (choice === "caulk") {
    state.morale -= 4;
    advanceDays(1);
    consumeFood(0.7);
    summary = `The wagon was caulked before crossing ${river.name}.`;
  }

  if (choice === "ferry") {
    if (state.cash >= river.toll) {
      state.cash -= river.toll;
      summary = `A ferry carried the wagon across ${river.name}.`;
    } else {
      state.morale -= 6;
      summary = `You could not afford the ferry, so the party risked the crossing.`;
    }
  }

  if (Math.random() * 100 < risk) {
    failed = true;
    const foodLoss = randomInt(35, river.id === "snake" ? 95 : 65);
    losses = {
      food: foodLoss,
      wagon: randomInt(8, 18),
      health: randomInt(8, river.id === "snake" ? 24 : 16)
    };
    outcomeText = `${summary} Trouble in the current cost ${foodLoss} lb of food and damaged the wagon.`;
  } else {
    state.morale += choice === "ferry" ? 2 : 5;
    outcomeText = `${summary} The crossing succeeded.`;
  }

  if (tutorialAttempt && failed) {
    playRiverTutorialRetry(river, choice, outcomeText);
    return;
  }

  if (losses) applyRiverLosses(losses);
  addLog(outcomeText);
  playRiverResult(river, failed, outcomeText);
}

function startSteeringChallenge(river, choice, baseRisk, tutorialAttempt = false) {
  els.sceneChoices.innerHTML = "";
  els.startCrossingButton.hidden = true;
  els.steeringControls.hidden = false;
  els.sceneTitle.textContent = "Steer Through the Current";
  els.sceneText.textContent = "Use left/right arrows, A/D, or the buttons to keep the wagon inside the bright channel until it reaches the far bank.";
  els.sceneRiskText.textContent = "Steering";
  els.sceneRiskBar.style.width = `${baseRisk}%`;
  els.riverScene.classList.remove("crossing-success", "crossing-fail");
  els.riverScene.classList.add("steering");

  steering = {
    river,
    choice,
    tutorialAttempt,
    x: 10,
    y: 22,
    drift: river.id === "snake" ? 0.34 : 0.24,
    steer: 0,
    score: 100,
    startedAt: performance.now(),
    duration: river.id === "snake" ? 5600 : 4600,
    frame: null
  };

  updateSteeringWagon();
  steering.frame = requestAnimationFrame(runSteeringFrame);
}

function runSteeringFrame(now) {
  if (!steering) return;
  const progress = clamp((now - steering.startedAt) / steering.duration, 0, 1);
  const channelY = 46 + Math.sin(progress * Math.PI * 2) * 8;
  const currentPull = Math.sin(progress * Math.PI * 5) * 0.18;

  steering.x = 10 + progress * 66;
  steering.y += steering.drift + currentPull + steering.steer;
  steering.y = clamp(steering.y, 18, 68);

  const distance = Math.abs(steering.y - channelY);
  if (distance > 12) steering.score -= distance > 20 ? 1.25 : 0.55;
  else steering.score += 0.18;
  steering.score = clamp(steering.score, 0, 100);

  updateSteeringWagon();
  els.steerScore.textContent = steering.score > 74 ? "Good line" : steering.score > 44 ? "Fighting current" : "Danger";

  if (progress >= 1) {
    const adjustment = steering.score > 78 ? -16 : steering.score > 52 ? -6 : steering.score > 28 ? 8 : 22;
    const { river, choice, tutorialAttempt } = steering;
    stopSteering();
    completeRiverChoice(river, choice, adjustment, tutorialAttempt);
    return;
  }

  steering.frame = requestAnimationFrame(runSteeringFrame);
}

function updateSteeringWagon() {
  if (!steering) return;
  els.riverScene.style.setProperty("--wagon-x", `${steering.x}%`);
  els.riverScene.style.setProperty("--wagon-y", `${steering.y}%`);
}

function stopSteering() {
  if (steering?.frame) cancelAnimationFrame(steering.frame);
  steering = null;
  els.riverScene.classList.remove("steering");
  els.steeringControls.hidden = true;
}

function playRiverTutorialRetry(river, choice, outcomeText) {
  stopSteering();
  els.sceneChoices.innerHTML = "";
  els.startCrossingButton.hidden = false;
  els.sceneTitle.textContent = "Practice Run Lost";
  els.sceneText.textContent = `${outcomeText} Since this is the first crossing, no supplies are lost yet. Try once more when ready.`;
  els.sceneRiskText.textContent = "Retry";
  els.sceneRiskBar.style.width = "50%";
  els.riverScene.classList.remove("crossing-success", "crossing-fail", "steering");
  els.riverScene.classList.add("crossing-fail");
  els.startCrossingButton.textContent = "Retry Crossing";
  els.startCrossingButton.onclick = () => {
    els.startCrossingButton.textContent = "Start Crossing";
    state.tutorialRiverUsed = true;
    startSteeringChallenge(river, choice, estimateRiverRisk(river, choice), false);
  };
}

function applyRiverLosses(losses) {
  state.food -= losses.food;
  state.wagon -= losses.wagon;
  damageRandomMember(state, losses.health);
}

function playRiverResult(river, failed, outcomeText) {
  els.sceneChoices.innerHTML = "";
  els.startCrossingButton.hidden = true;
  els.startCrossingButton.textContent = "Start Crossing";
  els.sceneTitle.textContent = failed ? "Trouble in the Current" : "Across the Water";
  els.sceneText.textContent = outcomeText;
  els.sceneRiskText.textContent = failed ? "Failed" : "Clear";
  els.sceneRiskBar.style.width = failed ? "92%" : "100%";
  els.riverScene.classList.remove("crossing-success", "crossing-fail");
  els.riverScene.classList.add(failed ? "crossing-fail" : "crossing-success");

  window.setTimeout(() => finishRiverChoice(river), 2400);
}

function finishRiverChoice(river) {
  state.pendingRiver = null;
  state.crossedRivers.push(river.id);
  els.actionScene.hidden = true;
  els.riverScene.classList.remove("crossing-success", "crossing-fail");
  els.modalButton.hidden = false;
  els.choiceList.innerHTML = "";
  normalize();
  checkEnd();
  render();
  saveGame(false);
}

function setSteer(direction) {
  if (!steering) return;
  steering.steer = direction * -0.82;
}

function clearSteer(direction) {
  if (!steering) return;
  if (Math.sign(steering.steer) === Math.sign(direction * -0.82)) steering.steer = 0;
}

function estimateRiverRisk(river, choice) {
  let risk = river.id === "snake" ? 36 : 22;

  if (choice === "ford" && (state.weather.label === "Rain" || state.weather.label === "Storm")) risk += 18;
  if (choice === "caulk") risk -= 14;
  if (choice === "ferry") risk = state.cash >= river.toll ? 5 : risk + 10;

  return clamp(risk, 5, 70);
}

function riskLabel(risk) {
  if (risk < 15) return "Low";
  if (risk < 35) return "Medium";
  if (risk < 55) return "High";
  return "Severe";
}

function normalize() {
  state.food = clamp(state.food, 0, 900);
  state.medicine = clamp(state.medicine, 0, 8);
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
  } else if (state.day > 185) {
    state.over = true;
    showModal("Winter caught you", "The season closed in", "The wagon did not reach Oregon before the mountain passes became too dangerous.");
  }
}

function showModal(eyebrow, title, text) {
  els.actionScene.hidden = true;
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

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
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
  els.wagonText.textContent = `${Math.round(state.wagon)}%`;
  els.moraleText.textContent = `${Math.round(state.morale)}%`;

  setBar(els.foodBar, state.food / 900);
  setBar(els.medicineBar, state.medicine / 8);
  setBar(els.wagonBar, state.wagon / 100);
  setBar(els.moraleBar, state.morale / 100);

  els.party.innerHTML = state.party
    .map((member) => {
      const status = member.health <= 0 ? "Lost" : member.health < 35 ? "Critical" : member.health < 65 ? "Weak" : "Healthy";
      return `
        <div class="member">
          <span class="avatar">${member.name[0]}</span>
          <span><strong>${member.name}</strong><small>${member.role} - ${status}</small></span>
          <span class="health">${Math.round(member.health)}%</span>
        </div>
      `;
    })
    .join("");

  els.log.innerHTML = state.log.map((message) => `<li>${message}</li>`).join("");
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

function drawTrail() {
  resizeCanvas();
  const width = canvasWidth;
  const height = canvasHeight;
  animationFrame += 0.008;

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#89b5ae");
  sky.addColorStop(0.45, "#e5c77a");
  sky.addColorStop(1, "#4d684a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  drawSun(width * 0.82, height * 0.18, 54);
  drawMountains(width, height);
  drawGround(width, height);
  drawPath(width, height);
  drawLandmarkMarkers(width, height);
  drawWagon(width, height);

  requestAnimationFrame(drawTrail);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const nextWidth = Math.max(320, Math.round(rect.width));
  const nextHeight = Math.max(220, Math.round(rect.height));
  const pixelWidth = Math.round(nextWidth * ratio);
  const pixelHeight = Math.round(nextHeight * ratio);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  canvasWidth = nextWidth;
  canvasHeight = nextHeight;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function pathPoint(progress, width, height) {
  const x = 80 + progress * (width - 160);
  const y = height * 0.75 - Math.sin(progress * Math.PI * 2.1) * 76 - progress * 105;
  return { x, y };
}

function drawSun(x, y, radius) {
  ctx.fillStyle = "rgba(255, 231, 158, 0.86)";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawMountains(width, height) {
  const layers = [
    { color: "#365349", y: 0.47, amp: 130 },
    { color: "#273d36", y: 0.58, amp: 98 }
  ];

  layers.forEach((layer, index) => {
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = -1; i <= 7; i += 1) {
      const x = (i / 6) * width;
      const y = height * layer.y - Math.sin(i + animationFrame + index) * 18;
      ctx.lineTo(x + width / 12, y - layer.amp);
      ctx.lineTo(x + width / 6, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  });
}

function drawGround(width, height) {
  const ground = ctx.createLinearGradient(0, height * 0.52, 0, height);
  ground.addColorStop(0, "#5f7f4f");
  ground.addColorStop(1, "#223026");
  ctx.fillStyle = ground;
  ctx.fillRect(0, height * 0.52, width, height * 0.48);

  ctx.fillStyle = "rgba(12, 16, 14, 0.2)";
  for (let i = 0; i < 40; i += 1) {
    const x = (i * 97 + Math.sin(i) * 22) % width;
    const y = height * 0.56 + ((i * 53) % (height * 0.35));
    ctx.fillRect(x, y, randomInt(18, 42), 2);
  }
}

function drawPath(width, height) {
  ctx.lineWidth = 44;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(238, 202, 133, 0.42)";
  ctx.beginPath();
  for (let i = 0; i <= 100; i += 1) {
    const point = pathPoint(i / 100, width, height);
    if (i === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.setLineDash([10, 14]);
  ctx.strokeStyle = "rgba(255, 249, 218, 0.72)";
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawLandmarkMarkers(width, height) {
  landmarks.forEach((landmark) => {
    const progress = landmark.miles / 2000;
    const point = pathPoint(progress, width, height);
    ctx.fillStyle = landmark.miles <= state.miles ? "#f1bd61" : "rgba(244, 241, 233, 0.62)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  const next = nextLandmark();
  const point = pathPoint(next.miles / 2000, width, height);
  ctx.fillStyle = "rgba(12, 16, 14, 0.66)";
  ctx.fillRect(point.x - 78, point.y - 46, 156, 28);
  ctx.fillStyle = "#f4f1e9";
  ctx.font = "700 15px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(next.name, point.x, point.y - 27);
}

function drawWagon(width, height) {
  const progress = clamp(state.miles / 2000, 0, 1);
  const point = pathPoint(progress, width, height);
  const bob = Math.sin(animationFrame * 18) * 2;

  ctx.save();
  ctx.translate(point.x, point.y + bob);
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();
  ctx.ellipse(0, 30, 42, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f4f1e9";
  ctx.beginPath();
  ctx.moveTo(-34, -4);
  ctx.quadraticCurveTo(-18, -38, 2, -38);
  ctx.quadraticCurveTo(28, -38, 40, -4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#8d5b36";
  ctx.fillRect(-42, -6, 86, 28);
  ctx.fillStyle = "#5b3826";
  ctx.fillRect(-48, 10, 98, 10);

  ctx.fillStyle = "#151915";
  [-27, 27].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, 25, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f1bd61";
    ctx.lineWidth = 3;
    ctx.stroke();
  });
  ctx.restore();
}

function restart() {
  state = freshState();
  stopSteering();
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

els.setupForm.addEventListener("submit", startGame);
document.querySelector("#travelButton").addEventListener("click", travel);
document.querySelector("#huntButton").addEventListener("click", hunt);
document.querySelector("#restButton").addEventListener("click", rest);
document.querySelector("#repairButton").addEventListener("click", repair);
document.querySelector("#tradeButton").addEventListener("click", trade);
document.querySelector("#restartButton").addEventListener("click", restart);
els.saveButton.addEventListener("click", () => saveGame(true));
els.continueButton.addEventListener("click", loadGame);
els.modalButton.addEventListener("click", restart);
els.steerLeft.addEventListener("pointerdown", () => setSteer(1));
els.steerRight.addEventListener("pointerdown", () => setSteer(-1));
els.steerLeft.addEventListener("pointerup", () => clearSteer(1));
els.steerRight.addEventListener("pointerup", () => clearSteer(-1));
els.steerLeft.addEventListener("pointerleave", () => clearSteer(1));
els.steerRight.addEventListener("pointerleave", () => clearSteer(-1));

window.addEventListener("keydown", (event) => {
  if (!steering) return;
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    event.preventDefault();
    setSteer(1);
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    event.preventDefault();
    setSteer(-1);
  }
});

window.addEventListener("keyup", (event) => {
  if (!steering) return;
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") clearSteer(1);
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") clearSteer(-1);
});

document.querySelectorAll(".pace-option").forEach((button) => {
  button.addEventListener("click", () => {
    state.pace = button.dataset.pace;
    addLog(`Pace changed to ${paceConfig[state.pace].label.toLowerCase()}.`);
    render();
  });
});

restart();
drawTrail();
