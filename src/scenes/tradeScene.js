export function createTradeScene({
  els,
  getState,
  hasLivingTrait,
  advanceDays,
  consumeFood,
  addLog,
  normalize,
  checkEnd,
  render,
  saveGame,
  stopRiverScene,
  stopHuntScene
}) {
  function show() {
    stopRiverScene();
    stopHuntScene();
    els.actionScene.hidden = false;
    els.riverScene.classList.remove("crossing-success", "crossing-fail", "steering", "hunt-mode");
    els.riverScene.classList.add("trade-mode");
    els.riverScene.style.removeProperty("--wagon-x");
    els.riverScene.style.removeProperty("--wagon-y");
    els.huntTarget.hidden = true;
    els.huntControls.hidden = true;
    els.steeringControls.hidden = true;
    els.startCrossingButton.hidden = true;
    els.startHuntButton.hidden = true;
    els.sceneTitle.textContent = "Trail Trader";
    els.sceneText.textContent = "A wagon from the east has stopped nearby. Pick one deal, or keep your supplies and move on.";
    els.sceneMeterLabel.textContent = "Market";
    els.sceneRiskText.textContent = hasLivingTrait("steady") ? "Favorable" : "Fair";
    els.sceneRiskBar.style.width = hasLivingTrait("steady") ? "72%" : "54%";
    renderOffers();
  }

  function renderOffers() {
    const state = getState();
    const discount = state.profession === "merchant" ? 0.85 : 1;
    const offers = [
      {
        title: "Buy flour and bacon",
        text: `Gain 110 lb food for $${price(28, discount)}.`,
        disabled: state.cash < price(28, discount),
        apply: () => {
          state.cash -= price(28, discount);
          state.food += 110;
          state.morale += 1;
          return `Traded $${price(28, discount)} for 110 lb of food.`;
        }
      },
      {
        title: "Buy ammunition",
        text: `Gain 12 shots for $${price(16, discount)}.`,
        disabled: state.cash < price(16, discount),
        apply: () => {
          state.cash -= price(16, discount);
          state.ammo += 12;
          return `Traded $${price(16, discount)} for 12 shots of ammunition.`;
        }
      },
      {
        title: "Buy spare wagon parts",
        text: `Gain 3 parts for $${price(24, discount)}.`,
        disabled: state.cash < price(24, discount),
        apply: () => {
          state.cash -= price(24, discount);
          state.parts += 3;
          return `Traded $${price(24, discount)} for 3 spare wagon parts.`;
        }
      },
      {
        title: "Buy medicine",
        text: `Gain 2 medicine kits for $${price(22, discount)}.`,
        disabled: state.cash < price(22, discount),
        apply: () => {
          state.cash -= price(22, discount);
          state.medicine += 2;
          return `Traded $${price(22, discount)} for 2 medicine kits.`;
        }
      },
      {
        title: "Barter medicine for food",
        text: "Give 1 medicine kit for 80 lb food.",
        disabled: state.medicine < 1,
        apply: () => {
          state.medicine -= 1;
          state.food += 80;
          return "Bartered 1 medicine kit for 80 lb of food.";
        }
      },
      {
        title: "Sell spare parts",
        text: "Give 1 wagon part for $12 cash.",
        disabled: state.parts < 1,
        apply: () => {
          state.parts -= 1;
          state.cash += 12;
          return "Sold 1 spare wagon part for $12.";
        }
      }
    ];

    els.sceneChoices.innerHTML = "";
    offers.forEach((offer) => {
      const button = document.createElement("button");
      button.type = "button";
      button.disabled = offer.disabled;
      button.innerHTML = `<strong>${offer.title}</strong><span>${offer.disabled ? "Not enough supplies for this deal." : offer.text}</span>`;
      button.addEventListener("click", () => completeTrade(offer.apply()));
      els.sceneChoices.append(button);
    });

    const leaveButton = document.createElement("button");
    leaveButton.type = "button";
    leaveButton.className = "quiet-choice";
    leaveButton.innerHTML = "<strong>Move on</strong><span>Leave without spending the day trading.</span>";
    leaveButton.addEventListener("click", () => {
      addLog("The party passed on the trader's offers.");
      close();
      render();
    });
    els.sceneChoices.append(leaveButton);
  }

  function completeTrade(message) {
    addLog(message);
    advanceDays(1);
    consumeFood(0.35);
    normalize();
    els.sceneTitle.textContent = "Deal Made";
    els.sceneText.textContent = `${message} The party spent part of the day sorting goods before returning to the trail.`;
    els.sceneRiskText.textContent = "Done";
    els.sceneRiskBar.style.width = "100%";
    els.sceneChoices.innerHTML = "";

    const continueButton = document.createElement("button");
    continueButton.type = "button";
    continueButton.className = "start-crossing";
    continueButton.textContent = "Return to Trail";
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
    els.riverScene.classList.remove("trade-mode");
    els.sceneChoices.innerHTML = "";
    els.sceneMeterLabel.textContent = "Crossing Risk";
    saveGame(false);
  }

  function stop() {
    els.riverScene.classList.remove("trade-mode");
  }

  function price(amount, discount) {
    return Math.ceil(amount * discount);
  }

  return {
    show,
    stop
  };
}
