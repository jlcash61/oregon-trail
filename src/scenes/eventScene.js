export function createEventScene({
  els,
  randomInt,
  getState,
  hasLivingTrait,
  damageRandomMember,
  addLog,
  normalize,
  checkEnd,
  render,
  saveGame,
  stopRiverScene,
  stopHuntScene,
  stopTradeScene
}) {
  function showRandom() {
    stopRiverScene();
    stopHuntScene();
    stopTradeScene();
    const event = pickEvent();
    els.actionScene.hidden = false;
    els.riverScene.classList.remove("crossing-success", "crossing-fail", "steering", "hunt-mode", "trade-mode");
    els.riverScene.classList.add("event-mode");
    els.riverScene.style.removeProperty("--wagon-x");
    els.riverScene.style.removeProperty("--wagon-y");
    els.huntTarget.hidden = true;
    els.huntControls.hidden = true;
    els.steeringControls.hidden = true;
    els.startCrossingButton.hidden = true;
    els.startHuntButton.hidden = true;
    els.sceneTitle.textContent = event.title;
    els.sceneText.textContent = event.text;
    els.sceneMeterLabel.textContent = "Opportunity";
    els.sceneRiskText.textContent = event.risk;
    els.sceneRiskBar.style.width = `${event.meter}%`;
    renderChoices(event.choices);
  }

  function renderChoices(choices) {
    const state = getState();
    els.sceneChoices.innerHTML = "";
    choices.forEach((choice) => {
      const disabled = choice.disabled?.(state) || false;
      const button = document.createElement("button");
      button.type = "button";
      button.disabled = disabled;
      button.innerHTML = `<strong>${choice.title}</strong><span>${disabled ? choice.disabledText : choice.text}</span>`;
      button.addEventListener("click", () => complete(choice.apply(state)));
      els.sceneChoices.append(button);
    });
  }

  function complete(result) {
    addLog(result.log);
    normalize();
    els.sceneTitle.textContent = result.title;
    els.sceneText.textContent = result.text;
    els.sceneRiskText.textContent = result.tone;
    els.sceneRiskBar.style.width = "100%";
    els.sceneChoices.innerHTML = "";

    const continueButton = document.createElement("button");
    continueButton.type = "button";
    continueButton.className = "start-crossing";
    continueButton.textContent = "Continue West";
    continueButton.addEventListener("click", () => {
      close();
      checkEnd();
      render();
      saveGame(false);
    });
    els.sceneChoices.append(continueButton);
  }

  function close() {
    els.actionScene.hidden = true;
    els.riverScene.classList.remove("event-mode");
    els.sceneChoices.innerHTML = "";
    els.sceneMeterLabel.textContent = "Crossing Risk";
  }

  function stop() {
    els.riverScene.classList.remove("event-mode");
  }

  function pickEvent() {
    const events = [
      hiddenCache,
      shortcut,
      smokeOnHorizon,
      foragePatch
    ];
    return events[randomInt(0, events.length - 1)]();
  }

  function hiddenCache() {
    return {
      title: "Half-Buried Crate",
      text: "A cracked supply crate sits off the trail. It could be useful, or it could be bait for wasted time and trouble.",
      risk: "Tempting",
      meter: 62,
      choices: [
        {
          title: "Pry it open",
          text: "Gain random supplies, with a small injury risk.",
          apply: (state) => {
            const food = randomInt(35, 75);
            const ammo = randomInt(3, 7);
            state.food += food;
            state.ammo += ammo;
            if (Math.random() > 0.72) {
              damageRandomMember(state, randomInt(4, 9));
              return {
                title: "Useful, But Costly",
                text: `The crate held ${food} lb of food and ${ammo} shots, but splintered wood cut one party member.`,
                tone: "Mixed",
                log: `Opened a supply crate for ${food} lb of food and ${ammo} shots, but someone was hurt.`
              };
            }
            return {
              title: "Lucky Find",
              text: `The crate held ${food} lb of food and ${ammo} shots.`,
              tone: "Gain",
              log: `Found a supply crate with ${food} lb of food and ${ammo} shots.`
            };
          }
        },
        {
          title: "Leave it alone",
          text: "Avoid the risk and keep moving.",
          apply: () => ({
            title: "No Delay",
            text: "The wagon keeps its line and the party avoids needless trouble.",
            tone: "Safe",
            log: "Passed a suspicious crate without stopping."
          })
        }
      ]
    };
  }

  function shortcut() {
    return {
      title: "A Narrow Cutoff",
      text: "A faint wagon track splits away from the main road. It may save miles, but the ground looks rough.",
      risk: "Risk",
      meter: 70,
      choices: [
        {
          title: "Take the cutoff",
          text: "Gain miles, but risk wagon damage.",
          apply: (state) => {
            const miles = randomInt(18, 34);
            const wagonDamage = hasLivingTrait("trailwise") ? randomInt(2, 6) : randomInt(6, 13);
            state.miles += miles;
            state.wagon -= wagonDamage;
            state.morale += 2;
            return {
              title: "Hard Miles Won",
              text: `The cutoff saved ${miles} miles, but the wagon lost ${wagonDamage}% condition.`,
              tone: "Progress",
              log: `Took a rough cutoff for ${miles} extra miles and ${wagonDamage}% wagon damage.`
            };
          }
        },
        {
          title: "Stay on the road",
          text: "Avoid wagon damage.",
          apply: (state) => {
            state.morale -= 1;
            return {
              title: "Steady Road",
              text: "The party grumbles at the longer route, but the wagon stays sound.",
              tone: "Safe",
              log: "Stayed on the main road instead of risking a rough cutoff."
            };
          }
        }
      ]
    };
  }

  function smokeOnHorizon() {
    return {
      title: "Smoke on the Horizon",
      text: "Another family waves from a cold camp. They look hungry, but they may have something useful to trade.",
      risk: "Choice",
      meter: 48,
      choices: [
        {
          title: "Share food",
          text: "Give 45 lb food for morale and a possible reward.",
          disabled: (state) => state.food < 45,
          disabledText: "Not enough food to share.",
          apply: (state) => {
            const cash = randomInt(6, 16);
            state.food -= 45;
            state.cash += cash;
            state.morale += 7;
            return {
              title: "Kindness Repaid",
              text: `They could only offer $${cash}, but the party's spirits rose.`,
              tone: "Morale",
              log: `Shared 45 lb of food with another family and received $${cash}.`
            };
          }
        },
        {
          title: "Trade news",
          text: "Spend no supplies and gain a small morale boost.",
          apply: (state) => {
            state.morale += 2;
            return {
              title: "Trail News",
              text: "The families trade warnings about weather, roads, and river crossings.",
              tone: "Useful",
              log: "Stopped to trade trail news with another wagon."
            };
          }
        }
      ]
    };
  }

  function foragePatch() {
    return {
      title: "Wild Onion Patch",
      text: "The scout spots edible greens near a creek bed. Gathering them means spreading out near rough brush.",
      risk: "Forage",
      meter: 55,
      choices: [
        {
          title: "Gather food",
          text: "Gain food, with a small chance of injury.",
          apply: (state) => {
            const food = randomInt(28, 58);
            state.food += food;
            if (Math.random() > 0.8) {
              damageRandomMember(state, randomInt(3, 8));
              return {
                title: "Food and Scrapes",
                text: `The party gathered ${food} lb of greens, though someone came back scratched up.`,
                tone: "Mixed",
                log: `Foraged ${food} lb of food, but someone was scratched up.`
              };
            }
            return {
              title: "Fresh Food",
              text: `The party gathered ${food} lb of edible greens.`,
              tone: "Gain",
              log: `Foraged ${food} lb of fresh food near the creek.`
            };
          }
        },
        {
          title: "Keep moving",
          text: "Skip the patch and avoid the delay.",
          apply: () => ({
            title: "Trail First",
            text: "The wagon keeps moving before the light fades.",
            tone: "Safe",
            log: "Skipped a forage stop to keep moving."
          })
        }
      ]
    };
  }

  return {
    showRandom,
    stop
  };
}
