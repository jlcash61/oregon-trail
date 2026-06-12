# Oregon Trail: Modern Passage

A modern browser-based Oregon Trail-inspired survival game. The player leads a wagon party from Independence to Oregon City, manages supplies and morale, makes risky trail decisions, and jumps into action-scene challenges for events like hunting and river crossings.

This is an early playable build, designed to grow in steps.

## Play Locally

This project is plain HTML, CSS, and JavaScript modules. It does not need a build step.

Use a local static server, because the app uses ES module imports.

Options:

```powershell
python -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500/index.html
```

If you use VS Code Live Server, open `index.html` through Live Server.

## Current Gameplay

- Create a wagon party with custom names.
- Choose a profession and starting loadout.
- Manage food, medicine, ammunition, spare parts, wagon condition, morale, cash, and party health.
- Travel at careful, steady, or fast pace.
- Save and continue using browser local storage.
- Hunt through a small skill challenge.
- Cross rivers through a decision plus steering challenge.
- Trade through a market scene with cash and barter offers.
- Encounter random trail opportunity scenes after some travel days.
- First river crossing includes a tutorial-style retry.
- Party traits affect survival, hunting, travel, repairs, and recovery.

## Project Structure

```text
.
|-- index.html
|-- styles.css
|-- game.js
`-- src
    |-- data.js
    |-- dom.js
    |-- trailMap.js
    |-- utils.js
    `-- scenes
        |-- eventScene.js
        |-- huntScene.js
        |-- riverScene.js
        `-- tradeScene.js
```

### Main Files

- `index.html` defines the game UI, setup form, dashboard, action scene overlay, and controls.
- `styles.css` contains the full visual design and responsive layout.
- `game.js` owns the campaign loop: state, travel, rest, repair, trade, save/load, rendering, and event wiring.

### Shared Modules

- `src/data.js` stores landmarks, river crossings, professions, loadouts, weather, pace settings, and traits.
- `src/dom.js` gathers DOM references in one place.
- `src/utils.js` contains small shared helpers.
- `src/trailMap.js` owns the animated canvas trail map.

### Scene Modules

- `src/scenes/eventScene.js` owns random trail opportunities and reward/risk decisions.
- `src/scenes/huntScene.js` owns the hunting challenge.
- `src/scenes/riverScene.js` owns river choices, steering, retries, and river outcomes.
- `src/scenes/tradeScene.js` owns market offers, barter choices, and trade outcomes.

The goal is for challenge scenes to grow independently from the main map game. New action scenes should generally live under `src/scenes/`.

## Development Notes

The app currently has no package manager, dependency install, bundler, or test runner. Keep module imports browser-native and relative.

Useful quick checks:

```powershell
node --check game.js
node --check src/data.js
node --check src/dom.js
node --check src/utils.js
node --check src/trailMap.js
node --check src/scenes/eventScene.js
node --check src/scenes/huntScene.js
node --check src/scenes/riverScene.js
node --check src/scenes/tradeScene.js
```

If `node` is not on your PATH, use any installed Node.js executable for the same checks.

## Roadmap Ideas

- Improve hunting into a richer skill challenge.
- Add action scenes for wagon repair, trading, illness treatment, and landmark events.
- Expand trade with rotating offers and trader personalities.
- Add more character depth, party relationships, and role-specific decisions.
- Make trade a real choice instead of an automatic best-effort action.
- Add more river types and terrain hazards.
- Add better mobile controls for action scenes.
- Add lightweight automated browser smoke tests.

## Save Data

Saves are stored in `localStorage` under:

```text
modernOregonTrailSave
```

Clearing browser site data will remove saved journeys.
