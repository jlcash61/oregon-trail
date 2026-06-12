export function createHuntScene({
  els,
  clamp,
  randomInt,
  professions,
  getState,
  hasLivingTrait,
  damageRandomMember,
  advanceDays,
  consumeFood,
  addLog,
  normalize,
  checkEnd,
  render,
  saveGame,
  stopRiverScene
}) {
  let hunting = null;

  function show() {
    stopRiverScene();
    stop();
    els.actionScene.hidden = false;
    els.riverScene.classList.remove("crossing-success", "crossing-fail", "steering");
    els.riverScene.classList.add("hunt-mode");
    els.riverScene.style.removeProperty("--wagon-x");
    els.riverScene.style.removeProperty("--wagon-y");
    els.huntTarget.hidden = true;
    els.steeringControls.hidden = true;
    els.startCrossingButton.hidden = true;
    els.sceneChoices.innerHTML = "";
    els.huntControls.hidden = true;
    els.startHuntButton.hidden = false;
    els.sceneTitle.textContent = "Hunting Grounds";
    els.sceneText.textContent = hasLivingTrait("sharpshot")
      ? "Your sharpshot can take one extra shot. Each shot spends ammunition. Wait for a clean line, then click the target."
      : "Each shot spends ammunition. Wait for a clean line, then click the target.";
    els.sceneMeterLabel.textContent = "Hunt";
    els.sceneRiskText.textContent = "Skill";
    els.sceneRiskBar.style.width = hasLivingTrait("sharpshot") ? "78%" : "58%";
    els.startHuntButton.onclick = start;
  }

  function start() {
    const state = getState();
    els.startHuntButton.hidden = true;
    els.huntControls.hidden = false;
    els.huntTarget.hidden = false;
    els.sceneTitle.textContent = "Take Your Shot";
    els.sceneText.textContent = "Hit the moving target. Better hunts bring more food, but the day still costs supplies.";

    hunting = {
      shots: Math.min(state.ammo, hasLivingTrait("sharpshot") ? 4 : 3),
      hits: 0,
      misses: 0,
      startedAt: performance.now(),
      duration: 9200,
      frame: null
    };

    updateHud();
    hunting.frame = requestAnimationFrame(runFrame);
  }

  function runFrame(now) {
    if (!hunting) return;
    const progress = clamp((now - hunting.startedAt) / hunting.duration, 0, 1);
    const x = 22 + Math.abs(Math.sin(progress * Math.PI * 1.45)) * 56;
    const y = 34 + Math.sin(progress * Math.PI * 3.2) * 10 + Math.cos(progress * Math.PI * 1.4) * 6;
    els.huntTarget.style.setProperty("--target-x", `${x}%`);
    els.huntTarget.style.setProperty("--target-y", `${clamp(y, 20, 68)}%`);

    if (progress >= 1 || hunting.shots <= 0) {
      finish();
      return;
    }

    hunting.frame = requestAnimationFrame(runFrame);
  }

  function takeShot() {
    const state = getState();
    if (!hunting || hunting.shots <= 0) return;
    state.ammo -= 1;
    hunting.shots -= 1;
    hunting.hits += 1;
    updateHud();
    if (hunting.shots <= 0) finish();
  }

  function missShot() {
    const state = getState();
    if (!hunting || hunting.shots <= 0) return;
    state.ammo -= 1;
    hunting.shots -= 1;
    hunting.misses += 1;
    state.morale -= 1;
    updateHud();
    if (hunting.shots <= 0) finish();
  }

  function updateHud() {
    if (!hunting) return;
    els.shotsLeft.textContent = hunting.shots;
    els.huntHits.textContent = hunting.hits;
    els.huntMisses.textContent = hunting.misses;
    els.sceneRiskBar.style.width = `${clamp(16 + hunting.hits * 24 - hunting.misses * 8, 0, 100)}%`;
  }

  function finish() {
    const state = getState();
    if (!hunting) return;
    const hits = hunting.hits;
    const misses = hunting.misses;
    stop();
    const gain = hits === 0 ? randomInt(8, 18) : randomInt(48, 72) * hits + professions[state.profession].huntBonus;
    state.food += gain;
    state.morale += hits > 1 ? 4 : -2 - misses;
    if ((hits === 0 || misses > hits) && Math.random() > 0.62) {
      damageRandomMember(state, randomInt(4, 10));
      addLog("A rough hunt left one party member scraped up.");
    }
    advanceDays(1);
    consumeFood(0.45);
    addLog(`Hunting used ${hits + misses} shot${hits + misses === 1 ? "" : "s"} and brought back ${gain} lb of food.`);
    els.sceneTitle.textContent = hits > 0 ? "Meat for the Wagon" : "Lean Hunting";
    els.sceneText.textContent = hits > 0
      ? `The party packed ${gain} lb of food before nightfall. ${misses} shot${misses === 1 ? "" : "s"} missed.`
      : `The party came back tired with ${gain} lb of food and wasted ammunition.`;
    els.sceneRiskText.textContent = "Done";
    els.sceneRiskBar.style.width = "100%";
    window.setTimeout(() => {
      els.actionScene.hidden = true;
      els.riverScene.classList.remove("hunt-mode");
      normalize();
      checkEnd();
      render();
      saveGame(false);
    }, 1800);
  }

  function stop() {
    if (hunting?.frame) cancelAnimationFrame(hunting.frame);
    hunting = null;
    els.huntTarget.hidden = true;
    els.huntControls.hidden = true;
    els.startHuntButton.hidden = true;
  }

  function handleSceneClick(event) {
    if (!hunting) return;
    if (event.target === els.huntTarget) return;
    if (event.target.closest(".scene-panel")) return;
    missShot();
  }

  function handleTargetClick(event) {
    event.stopPropagation();
    takeShot();
  }

  return {
    show,
    stop,
    handleSceneClick,
    handleTargetClick,
    isActive: () => Boolean(hunting)
  };
}
