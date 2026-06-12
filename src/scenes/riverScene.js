export function createRiverScene({
  els,
  clamp,
  randomInt,
  getState,
  damageRandomMember,
  advanceDays,
  consumeFood,
  addLog,
  normalize,
  checkEnd,
  render,
  saveGame,
  stopHuntScene
}) {
  let steering = null;

  function showChoice(river) {
    const state = getState();
    stop();
    stopHuntScene();
    els.riverScene.classList.remove("crossing-success", "crossing-fail", "steering");
    els.riverScene.classList.remove("hunt-mode");
    els.riverScene.style.removeProperty("--wagon-x");
    els.riverScene.style.removeProperty("--wagon-y");
    els.steeringControls.hidden = true;
    els.startCrossingButton.hidden = true;
    els.startCrossingButton.textContent = "Start Crossing";
    els.sceneTitle.textContent = river.name;
    els.sceneText.textContent = `The river is ${river.depth} deep and about ${river.width} wide. Pick a crossing method first. After that, you will steer the wagon through the bright channel.`;
    els.sceneChoices.innerHTML = "";
    els.sceneRiskBar.style.width = `${estimateRisk(river, "ford")}%`;
    els.sceneRiskText.textContent = riskLabel(estimateRisk(river, "ford"));

    const choices = [
      { id: "ford", title: "Ford the river", text: "Fast and free, but dangerous if the water is deep." },
      { id: "caulk", title: "Caulk the wagon", text: "Costs one day and morale, but lowers the risk." },
      { id: "ferry", title: `Hire a ferry for $${river.toll}`, text: "Safest choice, if the party can afford it." }
    ];

    choices.forEach((choice) => {
      const risk = estimateRisk(river, choice.id);
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
        prepareSteeringChallenge(river, choice.id, risk);
      });
      els.sceneChoices.append(button);
    });

    state.pendingRiver = river.id;
    els.actionScene.hidden = false;
  }

  function prepareSteeringChallenge(river, choice, baseRisk) {
    const state = getState();
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

    updateWagon();
    steering.frame = requestAnimationFrame(runFrame);
  }

  function runFrame(now) {
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

    updateWagon();
    els.steerScore.textContent = steering.score > 74 ? "Good line" : steering.score > 44 ? "Fighting current" : "Danger";

    if (progress >= 1) {
      const adjustment = steering.score > 78 ? -16 : steering.score > 52 ? -6 : steering.score > 28 ? 8 : 22;
      const { river, choice, tutorialAttempt } = steering;
      stop();
      completeChoice(river, choice, adjustment, tutorialAttempt);
      return;
    }

    steering.frame = requestAnimationFrame(runFrame);
  }

  function updateWagon() {
    if (!steering) return;
    els.riverScene.style.setProperty("--wagon-x", `${steering.x}%`);
    els.riverScene.style.setProperty("--wagon-y", `${steering.y}%`);
  }

  function completeChoice(river, choice, skillAdjustment, tutorialAttempt = false) {
    const state = getState();
    let risk = clamp(estimateRisk(river, choice) + skillAdjustment, 2, 88);
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
      playTutorialRetry(river, choice, outcomeText);
      return;
    }

    if (losses) applyLosses(losses);
    addLog(outcomeText);
    playResult(river, failed, outcomeText);
  }

  function playTutorialRetry(river, choice, outcomeText) {
    stop();
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
      const state = getState();
      els.startCrossingButton.textContent = "Start Crossing";
      state.tutorialRiverUsed = true;
      startSteeringChallenge(river, choice, estimateRisk(river, choice), false);
    };
  }

  function applyLosses(losses) {
    const state = getState();
    state.food -= losses.food;
    state.wagon -= losses.wagon;
    damageRandomMember(state, losses.health);
  }

  function playResult(river, failed, outcomeText) {
    els.sceneChoices.innerHTML = "";
    els.startCrossingButton.hidden = true;
    els.startCrossingButton.textContent = "Start Crossing";
    els.sceneTitle.textContent = failed ? "Trouble in the Current" : "Across the Water";
    els.sceneText.textContent = outcomeText;
    els.sceneRiskText.textContent = failed ? "Failed" : "Clear";
    els.sceneRiskBar.style.width = failed ? "92%" : "100%";
    els.riverScene.classList.remove("crossing-success", "crossing-fail");
    els.riverScene.classList.add(failed ? "crossing-fail" : "crossing-success");

    window.setTimeout(() => finishChoice(river), 2400);
  }

  function finishChoice(river) {
    const state = getState();
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

  function stop() {
    if (steering?.frame) cancelAnimationFrame(steering.frame);
    steering = null;
    els.riverScene.classList.remove("steering");
    els.steeringControls.hidden = true;
  }

  function estimateRisk(river, choice) {
    const state = getState();
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

  return {
    showChoice,
    stop,
    setSteer,
    clearSteer,
    isSteering: () => Boolean(steering)
  };
}
