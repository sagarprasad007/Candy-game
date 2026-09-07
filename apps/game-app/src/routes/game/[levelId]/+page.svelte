<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { GameEngine, type GameEngineState } from '$lib/game/game-engine';
  import { playerStore } from '$lib/stores/playerStore';
  import { soundFx } from '$lib/audio/sound';
  import { goto } from '$app/navigation';
  import { generateStory, type GeneratedStory } from '$lib/game/story-generator';
  import LevelStoryModal from '$lib/components/LevelStoryModal.svelte';
  import PreLevelModal from '$lib/components/PreLevelModal.svelte';

  let levelId = $derived(parseInt(page.params.levelId || '1'));
  let engine: GameEngine | null = $state(null);
  let gameState: GameEngineState | null = $state(null);
  let selectedRow = $state(-1);
  let selectedCol = $state(-1);
  let isHammerMode = $state(false);
  let activeStory: GeneratedStory | null = $state(null);
  let showPreLevelModal = $state(true);
  let boardEl: any = $state(null);

  function syncBoardProps() {
    if (boardEl && gameState) {
      boardEl.gridData = gameState.grid;
      boardEl.rows = gameState.levelConfig.boardRows || 8;
      boardEl.cols = gameState.levelConfig.boardCols || 8;
      boardEl.selectedRow = selectedRow;
      boardEl.selectedCol = selectedCol;
      boardEl.disabled = gameState.isProcessing;
      boardEl.phase = gameState.phase;
      boardEl.swapAnimation = gameState.swapAnimation;
      boardEl.activeEffects = gameState.activeEffects;
      boardEl.isFever = gameState.isFeverMode;
      if (typeof boardEl.forceRefresh === 'function') {
        boardEl.forceRefresh();
      }
    }
  }

  onMount(async () => {
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore
        const { defineCustomElement: defineGameBoard } = await import('@cosmic-gems/game-ui/dist/components/game-board.js');
        defineGameBoard();
      } catch (err) {
        console.warn('Stencil custom element loading fallback:', err);
      }
    }

    if (!playerStore.progress.unlockedLevels.includes(levelId)) {
      goto('/levels');
      return;
    }

    engine = new GameEngine(levelId);
    gameState = engine.state;

    engine.onCascade = (comboCount: number) => {
      soundFx.playMatchSound(comboCount);
    };

    engine.onStateChange = (newState) => {
      gameState = { ...newState };
      syncBoardProps();
    };

    // Ensure properties are synchronized after custom elements definition & DOM render
    syncBoardProps();
    setTimeout(() => {
      syncBoardProps();
      if (boardEl && typeof boardEl.componentOnReady === 'function') {
        boardEl.componentOnReady().then(() => syncBoardProps());
      }
    }, 50);
  });

  function handleStartLevel(preBoosters: string[]) {
    showPreLevelModal = false;
  }

  // Direct property synchronization to Stencil Web Component
  $effect(() => {
    // Read reactive variables to subscribe
    const g = gameState;
    const r = selectedRow;
    const c = selectedCol;
    if (g && boardEl) {
      syncBoardProps();
    }
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
      soundFx.playMatchSound(1);
    } else if (selectedRow === r && selectedCol === c) {
      selectedRow = -1;
      selectedCol = -1;
    } else {
      const fromR = selectedRow;
      const fromC = selectedCol;
      const isAdjacent = Math.abs(fromR - r) + Math.abs(fromC - c) === 1;

      // Adjacency Validation on tap-select: if non-adjacent, reselect newly tapped tile
      if (!isAdjacent) {
        selectedRow = r;
        selectedCol = c;
        soundFx.playMatchSound(1);
        return;
      }

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
      const target = gameState!.levelConfig.objective.targetScore;
      const score = gameState!.score;

      // Real 3-tier Star rating floor
      const stars = score >= target * 1.5 ? 3 : score >= target * 1.15 ? 2 : 1;
      playerStore.recordLevelCompletion(levelId, score, stars);

      activeStory = generateStory({
        levelId,
        score,
        stars,
        remainingMoves: gameState!.remainingMoves,
        comboCount: gameState!.comboCount,
      });
    } else {
      soundFx.playLossSound();
      playerStore.consumeLife();
      setTimeout(() => {
        goto(`/results/${levelId}?status=lost&score=${gameState?.score || 0}`);
      }, 800);
    }
  }

  function handleStoryContinue() {
    const finalScore = gameState?.score || 0;
    activeStory = null;
    goto(`/results/${levelId}?status=won&score=${finalScore}`);
  }
</script>

{#if showPreLevelModal && gameState}
  <PreLevelModal levelConfig={gameState.levelConfig} onStart={handleStartLevel} />
{/if}

{#if activeStory}
  <LevelStoryModal story={activeStory} onContinue={handleStoryContinue} />
{/if}

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

      <div class="info-box moves-box {gameState.remainingMoves <= 3 ? 'moves-low-glow' : ''}">
        <span class="info-label">MOVES</span>
        <span class="info-val moves-num">{gameState.remainingMoves}</span>
      </div>
    </div>

    <!-- FEVER MODE Meter Bar -->
    <div class="fever-meter-wrapper">
      <div class="fever-label">
        {#if gameState.isFeverMode}
          🔥 FEVER MODE (x2 SCORE BONUS!) 🔥
        {:else if gameState.streakCount > 0}
          ⚡ STREAK: {gameState.streakCount}/4
        {:else}
          ✨ FEVER CHARGE
        {/if}
      </div>
      <div class="fever-bar">
        <div
          class="fever-fill {gameState.isFeverMode ? 'active' : ''}"
          style="width: {gameState.feverMeter}%"
        ></div>
      </div>
    </div>

    <div class="banner-container">
      {#if gameState.bannerMessage}
        <div class="candy-banner">🍬 {gameState.bannerMessage} 🍭</div>
      {:else if isHammerMode}
        <div class="booster-banner">🔨 Quantum Hammer Active — Tap any tile to smash it!</div>
      {/if}
    </div>

    <div class="sr-only" aria-live="polite">
      Game level {levelId}. Score: {gameState.score}. Moves remaining: {gameState.remainingMoves}. Swipe a tile toward an adjacent cell to swap.
    </div>

    <div class="board-wrapper">
      <game-board
        bind:this={boardEl}
        rows={gameState.levelConfig.boardRows || 8}
        cols={gameState.levelConfig.boardCols || 8}
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
        <span class="booster-label">Hammer ({playerStore.progress.boosters?.hammer || 0})</span>
      </button>

      <button
        type="button"
        class="booster-btn"
        disabled={gameState.isProcessing}
        onclick={handleShuffleBooster}
        aria-label="Stellar Shuffle Booster"
      >
        <span class="booster-icon">🔀</span>
        <span class="booster-label">Shuffle ({playerStore.progress.boosters?.shuffle || 0})</span>
      </button>
    </div>
  </div>
{/if}

<style>
  .game-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
  }

  .header-card {
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    background: #ffffff;
    border: 3px solid #f472b6;
    border-radius: 24px;
    padding: 10px 16px;
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

  .moves-low-glow .moves-num {
    animation: tensionPulse 0.6s infinite alternate ease-in-out;
  }

  @keyframes tensionPulse {
    from {
      transform: scale(1);
      text-shadow: 0 0 4px rgba(225, 29, 72, 0.4);
    }
    to {
      transform: scale(1.25);
      color: #ff0033;
      text-shadow: 0 0 16px rgba(255, 0, 51, 0.9);
    }
  }

  .fever-meter-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .fever-label {
    font-size: 0.75rem;
    font-weight: 800;
    color: #b45309;
    text-align: center;
  }

  .fever-bar {
    width: 100%;
    height: 10px;
    background: rgba(251, 191, 36, 0.25);
    border: 2px solid #f59e0b;
    border-radius: 10px;
    overflow: hidden;
  }

  .fever-fill {
    height: 100%;
    background: linear-gradient(90deg, #fbbf24, #f59e0b, #ef4444);
    transition: width 0.3s ease;
  }

  .fever-fill.active {
    animation: feverPulse 0.5s infinite alternate ease-in-out;
  }

  @keyframes feverPulse {
    from { filter: brightness(1); }
    to { filter: brightness(1.3); }
  }

  .banner-container {
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
  }

  .candy-banner {
    background: linear-gradient(90deg, #ec4899, #f43f5e);
    color: #ffffff;
    font-weight: 900;
    font-size: 0.95rem;
    padding: 6px 20px;
    border-radius: 20px;
    box-shadow: 0 6px 15px rgba(244, 63, 94, 0.35);
    animation: popBounce 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .booster-banner {
    background: linear-gradient(90deg, #fbbf24, #f59e0b);
    color: #451a03;
    font-weight: 800;
    font-size: 0.85rem;
    padding: 6px 16px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }

  @keyframes popBounce {
    0% { transform: scale(0.6); opacity: 0; }
    80% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  .board-wrapper {
    width: 100%;
    max-width: 480px;
    aspect-ratio: 1;
    display: block;
    box-sizing: border-box;
  }

  game-board {
    display: block;
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
  }

  .boosters-bar {
    display: flex;
    gap: 16px;
    justify-content: center;
    width: 100%;
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
