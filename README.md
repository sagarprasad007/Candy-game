# Cosmic Gems: Match-3 Starlight Quest & StencilJS Web Component Library

> An original, high-performance **Match-3 Adventure Game** and **Reusable Web Component Library** built with **Svelte 5, SvelteKit, and StencilJS**.

---

## 🚀 Overview

**Cosmic Gems: Starlight Quest** is an original sci-fi puzzle adventure game inspired by classic match-3 mechanics. Players travel across cosmic sectors matching Nova Rubies, Starlight Sapphires, Nebula Emeralds, Solar Ambers, and Void Amethysts to achieve sector objectives, clear space crystal ice blocks, trigger cascading combo multipliers, and earn stellar trophies.

The repository is structured as a clean monorepo containing:
1. **`@cosmic-gems/game-ui`**: A standalone, reusable **StencilJS Web Component library** published as a local package and consumed directly by the SvelteKit application.
2. **`apps/game-app`**: A modern **Svelte 5 / SvelteKit web application** implementing full routing, state management with Svelte 5 runes, Web Audio API sound synthesis, persistent storage, and responsive mobile-first UI.

---

## 🛠️ Technology Stack

- **Frontend Application**: Svelte 5 (Runes), SvelteKit (App Router)
- **Web Component Library**: StencilJS, TypeScript, Shadow DOM
- **Game Engine**: Pure TypeScript, modular state architecture
- **Audio**: Web Audio API (zero external asset dependency synthesizer)
- **Testing**: Vitest
- **Styling**: Vanilla CSS with modern Glassmorphism, Neon dark modes, and CSS animations

---

## 📦 StencilJS Component Library (`@cosmic-gems/game-ui`)

The component library includes **6 fully customizable, isolated Web Components**:

1. `<game-tile>`: Renders individual tiles with gem icons, special badges (line blast, bomb, prism), ice overlay durability states, selection glow, and match animations.
2. `<game-board>`: Encapsulates the entire grid rendering, touch swipe / mouse click handlers, and emits custom events (`game-tile-selected`, `tile-swapped`).
3. `<game-score>`: Displays current score, target objective score, animated progress bar, and move counter with critical move warning.
4. `<life-counter>`: Displays energy/lives count (hearts), timer countdown, and custom event for life restoration (`restore-life-requested`).
5. `<level-card>`: Displays level number, difficulty tags (easy/medium/hard), stars earned (1–3 stars), best score, and locked/unlocked state.
6. `<game-modal>`: Reusable modal dialog demonstrating **Named Slots** (`<slot name="title">`, `<slot name="content">`, `<slot name="actions">`).

### Integration Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    SvelteKit Application                    │
│    (/, /levels, /game/[id], /results/[id], /achievements)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Consumes published package
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 @cosmic-gems/game-ui (npm)                  │
│  <game-tile> <game-board> <game-score> <life-counter> ...   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎮 Game Features & Mechanics

- **6 Distinct Playable Levels**: Progressively increasing difficulty, board sizes, and move constraints.
- **Level Objectives**:
  - **Score Target**: Reach target score before running out of moves.
  - **Tile Collection**: Collect specific gem types (e.g. 15 Starlight Sapphires).
  - **Obstacle Shattering**: Shatter space crystal ice blocks with adjacent tile matches.
- **Special Tiles**:
  - **Line Blast (Hyperbeam)**: Formed by matching 4 tiles. Clears full row or column.
  - **Nova Bomb**: Clears 3x3 surrounding radius.
  - **Cosmic Prism**: Clears all tiles of a targeted color.
- **Cascading Combo System**: Automatic match detection following gravity drops with exponential score multipliers (`NICE! x2`, `GREAT! x3`, `AMAZING! x4`).
- **Power-Up Boosters**:
  - **Quantum Hammer**: Destroy any targeted tile or obstacle.
  - **Stellar Shuffle**: Rearrange all tiles on the current board.
- **Lives & Energy System**: 5 max lives. Automatic regeneration over time or manual quick restoration.
- **Persistence**: Player progress, unlocked levels, stars, high scores, and settings saved in `localStorage`.
- **Trophies & Achievements**: Track earned accomplishments based on gameplay events.

---

## 🧪 Running Automated Tests

Run the Vitest test suite covering match detection, tile swaps, scoring, combo multipliers, and level win/loss conditions:

```bash
npm --prefix apps/game-app run test
```

---

## ⚙️ Setup & Local Development Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone the repository
```bash
git clone <repository-url>
cd HOME-ASSIGNMENT
```

### 2. Install workspace dependencies & build Stencil library
```bash
# Build Stencil Component Library
npm --prefix packages/game-ui run build

# Install app dependencies
npm --prefix apps/game-app install
```

### 3. Start Development Server
```bash
npm run dev:app
# or
npm --prefix apps/game-app run dev
```

### 4. Build Production Bundle
```bash
npm run build
```

---

## 📑 Assumptions Documented

- **No Real Money Purchases**: Energy/lives restoration is simulated via a timer and mock restore action.
- **Zero Heavy Assets**: Game audio is dynamically synthesized using the Web Audio API for fast load times and zero network overhead.
- **Mobile-First Responsive**: Designed primarily for mobile touchscreen interactions while maintaining full mouse click support for desktop.
- **Decoupled Architecture**: All game rules, board calculations, scoring algorithms, and match cascade detectors live in pure TypeScript modules (`src/lib/game/`) independent of UI components.
