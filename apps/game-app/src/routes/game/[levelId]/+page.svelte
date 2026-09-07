<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { GameEngine, type GameEngineState } from '$lib/game/game-engine';
  import { playerStore } from '$lib/stores/playerStore';
  import { soundFx } from '$lib/audio/sound';
  import { goto } from '$app/navigation';

  let levelId = $derived(parseInt(page.params.levelId || '1'));
  let engine: GameEngine | null = $state(null);
  let gameState: GameEngineState | null = $state(null);
  let selectedRow = $state(-1);
  let selectedCol = $state(-1);
  let isHammerMode = $state(false);

  onMount(() => {
    if (!playerStore.progress.unlockedLevels.includes(levelId)) {
      goto('/levels');
      return;
    }

    engine = new GameEngine(levelId);
    gameState = engine.state;

    engine.onCascade = (comboCount: number) => {
      soundFx.playMatchSound(comboCount);
    };
  });

  async function handleTileSwapped(e: CustomEvent<{ from: { row: number; col: number }; to: { row: number; col: number } }>) {
    if (!engine || !gameState || gameState.isProcessing) return;
    const { from, to } = e.detail;
    selectedRow = -1;
    selectedCol = -1;
    isHammerMode = false;

    const success = await engine.executeMove(from.row, from.col, to.row, to.col);
    gameState = { ...engine.state };

    if (success && engine.state.status !== 'playing') {
      handleGameOver(engine.state.status);
    }
  }

  async function handleGameTileSelected(e: CustomEvent<{ row: number; col: number }>) {
    if (!engine || !gameState || gameState.isProcessing) return;
    const { row: r, col: c } = e.detail;

    if (isHammerMode) {
      isHammerMode = false;
      selectedRow = -1;
      selectedCol = -1;
      soundFx.playMatchSound(1);
      const success = await engine.useHammer(r, c);
      gameState = { ...engine.state };
      if (success && engine.state.status !== 'playing') {
        handleGameOver(engine.state.status);
      }
      return;
    }

    if (selectedRow === -1 && selectedCol === -1) {
      selectedRow = r;
      selectedCol = c;
    } else if (selectedRow === r && selectedCol === c) {
      selectedRow = -1;
      selectedCol = -1;
    } else {
      const fromR = selectedRow;
      const fromC = selectedCol;
      selectedRow = -1;
      selectedCol = -1;

      const success = await engine.executeMove(fromR, fromC, r, c);
      gameState = { ...engine.state };

      if (success && engine.state.status !== 'playing') {
        handleGameOver(engine.state.status);
      }
    }
  }

  async function handleShuffleBooster() {
    if (!engine || !gameState || gameState.isProcessing) return;
    isHammerMode = false;
    selectedRow = -1;
    selectedCol = -1;
    soundFx.playMatchSound(1);
    await engine.useShuffle();
    gameState = { ...engine.state };
  }

  function toggleHammerMode() {
    if (gameState?.isProcessing) return;
    isHammerMode = !isHammerMode;
    selectedRow = -1;
    selectedCol = -1;
  }

  function handleGameOver(status: 'won' | 'lost') {
    if (status === 'won') {
      soundFx.playWinSound();
      const stars = gameState!.score > gameState!.levelConfig.objective.targetScore * 1.5 ? 3 : 2;
      playerStore.recordLevelCompletion(levelId, gameState!.score, stars);
    } else {
      soundFx.playLossSound();
      playerStore.consumeLife();
    }
    setTimeout(() => {
      goto(`/results/${levelId}?status=${status}&score=${gameState?.score || 0}`);
    }, 800);
  }
</script>

{#if gameState}
  <div class="game-wrapper phase-{gameState.phase}">
    <div class="header-card">
      <div class="info-box">
        <span class="info-label">SCORE</span>
        <span class="info-val">{gameState.score.toLocaleString()}</span>
      </div>

      <div class="info-box objective-box">
        <span class="info-label">TARGET</span>
        <span class="info-val">{gameState.levelConfig.objective.targetScore.toLocaleString()}</span>
      </div>

      <div class="info-box moves-box">
        <span class="info-label">MOVES</span>
        <span class="info-val moves-num">{gameState.remainingMoves}</span>
      </div>
    </div>

    {#if gameState.bannerMessage}
      <div class="candy-banner">🍬 {gameState.bannerMessage} 🍭</div>
    {/if}

    {#if isHammerMode}
      <div class="booster-banner">🔨 Quantum Hammer Active — Tap any tile to smash it!</div>
    {/if}

    <div class="sr-only" aria-live="polite">
      Game level {levelId}. Score: {gameState.score}. Moves remaining: {gameState.remainingMoves}. Swipe a tile toward an adjacent cell to swap.
    </div>

    <div class="candy-board-frame">
      <game-board
        grid-data={JSON.stringify(gameState.grid)}
        rows={gameState.levelConfig.boardRows || 8}
        cols={gameState.levelConfig.boardCols || 8}
        selected-row={selectedRow}
        selected-col={selectedCol}
        disabled={gameState.isProcessing}
        phase={gameState.phase}
        swap-animation={gameState.swapAnimation ? JSON.stringify(gameState.swapAnimation) : null}
        active-effects={gameState.activeEffects ? JSON.stringify(gameState.activeEffects) : '[]'}
        ontile-swapped={handleTileSwapped}
        ongame-tile-selected={handleGameTileSelected}
      ></game-board>
    </div>

    <div class="boosters-bar">
      <button
        type="button"
        class="booster-btn {isHammerMode ? 'active' : ''}"
        disabled={gameState.isProcessing}
        onclick={toggleHammerMode}
        aria-label="Quantum Hammer Booster"
      >
        <span class="booster-icon">🔨</span>
        <span class="booster-label">Hammer</span>
      </button>

      <button
        type="button"
        class="booster-btn"
        disabled={gameState.isProcessing}
        onclick={handleShuffleBooster}
        aria-label="Stellar Shuffle Booster"
      >
        <span class="booster-icon">🔀</span>
        <span class="booster-label">Shuffle</span>
      </button>
    </div>
  </div>
{/if}

<style>
  .game-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .header-card {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    max-width: 480px;
    background: #ffffff;
    border: 3px solid #f472b6;
    border-radius: 24px;
    padding: 12px 18px;
    box-shadow: 0 8px 20px rgba(244, 114, 182, 0.2);
    box-sizing: border-box;
  }

  .info-box {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .info-label {
    font-size: 0.75rem;
    font-weight: 800;
    color: #9f1239;
  }

  .info-val {
    font-size: 1.4rem;
    font-weight: 900;
    color: #ec4899;
  }

  .moves-num {
    color: #e11d48;
    font-size: 1.6rem;
  }

  .candy-banner {
    background: linear-gradient(90deg, #ec4899, #f43f5e);
    color: #ffffff;
    font-weight: 900;
    font-size: 1rem;
    padding: 8px 24px;
    border-radius: 20px;
    box-shadow: 0 6px 15px rgba(244, 63, 94, 0.35);
    animation: popBounce 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .booster-banner {
    background: linear-gradient(90deg, #fbbf24, #f59e0b);
    color: #451a03;
    font-weight: 800;
    font-size: 0.9rem;
    padding: 6px 18px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }

  @keyframes popBounce {
    0% { transform: scale(0.6); opacity: 0; }
    80% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  .candy-board-frame {
    background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
    border: 4px solid #f43f5e;
    border-radius: 28px;
    padding: 12px;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 15px 35px rgba(225, 29, 72, 0.25);
    box-sizing: border-box;
  }

  .boosters-bar {
    display: flex;
    gap: 16px;
    justify-content: center;
    width: 100%;
    max-width: 480px;
  }

  .booster-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 20px;
    border: 2px solid #f472b6;
    background: #ffffff;
    color: #881337;
    font-weight: 800;
    font-size: 0.9rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(244, 114, 182, 0.2);
    transition: all 0.15s ease;
  }

  .booster-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .booster-btn.active {
    background: #f43f5e;
    color: #ffffff;
    border-color: #e11d48;
    box-shadow: 0 0 15px rgba(244, 63, 94, 0.5);
  }

  .booster-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .booster-icon {
    font-size: 1.2rem;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
