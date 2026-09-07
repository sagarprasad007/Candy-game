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

  onMount(() => {
    if (!playerStore.progress.unlockedLevels.includes(levelId)) {
      goto('/levels');
      return;
    }

    engine = new GameEngine(levelId);
    gameState = engine.state;
  });

  async function handleTileClick(r: number, c: number) {
    if (!engine || !gameState || gameState.isProcessing) return;

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

      if (success) {
        soundFx.playMatchSound(engine.state.comboCount);
        if (engine.state.status !== 'playing') {
          handleGameOver(engine.state.status);
        }
      }
    }
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
  let touchStart: { x: number; y: number; r: number; c: number } | null = null;

  function handleTouchStart(e: TouchEvent, r: number, c: number) {
    if (!engine || !gameState || gameState.isProcessing) return;
    const touch = e.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY, r, c };
  }

  async function handleTouchMove(e: TouchEvent) {
    if (!touchStart || !engine || !gameState || gameState.isProcessing) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touch.x;
    const dy = touch.clientY - touch.y;
    const threshold = 15; // Responsive 15px swipe distance

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      e.preventDefault();
      let targetR = touchStart.r;
      let targetC = touchStart.c;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetC += dx > 0 ? 1 : -1;
      } else {
        targetR += dy > 0 ? 1 : -1;
      }

      const fromR = touchStart.r;
      const fromC = touchStart.c;
      touchStart = null;
      selectedRow = -1;
      selectedCol = -1;

      if (
        targetR >= 0 && targetR < gameState.levelConfig.boardRows &&
        targetC >= 0 && targetC < gameState.levelConfig.boardCols
      ) {
        const success = await engine.executeMove(fromR, fromC, targetR, targetC);
        gameState = { ...engine.state };
        if (success) {
          soundFx.playMatchSound(engine.state.comboCount);
          if (engine.state.status !== 'playing') {
            handleGameOver(engine.state.status);
          }
        }
      }
    }
  }

  function handleTouchEnd() {
    touchStart = null;
  }
</script>

{#if gameState}
  <div class="game-wrapper">
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

    <div class="candy-board-frame">
      <div
        class="candy-grid"
        style="grid-template-columns: repeat({gameState.levelConfig.boardCols}, 1fr); grid-template-rows: repeat({gameState.levelConfig.boardRows}, 1fr);"
      >
        {#each gameState.grid as row, r}
          {#each row as tile, c}
            <button
              type="button"
              class="candy-tile type-{tile.type} {selectedRow === r && selectedCol === c ? 'selected' : ''} {tile.matched ? 'matched' : ''} {tile.falling ? 'falling' : ''}"
              onclick={() => handleTileClick(r, c)}
              ontouchstart={(e) => handleTouchStart(e, r, c)}
              ontouchmove={handleTouchMove}
              ontouchend={handleTouchEnd}
              aria-label="Candy {tile.type}"
            >
              <div class="candy-symbol">
                {#if tile.type === 'ruby'}🍬{:else if tile.type === 'sapphire'}🍭{:else if tile.type === 'emerald'}🍏{:else if tile.type === 'amber'}🍊{:else if tile.type === 'amethyst'}🍇{:else}🍩{/if}
              </div>

              {#if tile.special === 'line-h'}<span class="special-badge">↔</span>{/if}
              {#if tile.special === 'line-v'}<span class="special-badge">↕</span>{/if}
              {#if tile.special === 'bomb'}<span class="special-badge">💣</span>{/if}
              {#if tile.special === 'prism'}<span class="special-badge">🍩</span>{/if}

              {#if tile.obstacle === 'ice-1'}<div class="choco-overlay">🍫</div>{/if}
              {#if tile.obstacle === 'ice-2'}<div class="choco-overlay choco-2">🍫🍫</div>{/if}
            </button>
          {/each}
        {/each}
      </div>
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

  @keyframes popBounce {
    0% { transform: scale(0.6); opacity: 0; }
    80% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  .candy-board-frame {
    background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
    border: 4px solid #f43f5e;
    border-radius: 28px;
    padding: 16px;
    width: 100%;
    max-width: 480px;
    box-shadow: 0 15px 35px rgba(225, 29, 72, 0.25);
    box-sizing: border-box;
  }

  .candy-grid {
    display: grid;
    gap: 10px;
    width: 100%;
    aspect-ratio: 1;
    touch-action: none;
  }

  .candy-tile {
    width: 100%;
    height: 100%;
    border-radius: 18px;
    border: 2px solid rgba(255, 255, 255, 0.8);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    user-select: none;
    touch-action: none;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.12), inset 0 2px 2px rgba(255, 255, 255, 0.5);
    transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.15s ease;
    overflow: hidden;
  }

  .candy-tile.falling {
    animation: candyDrop 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  .candy-tile.matched {
    animation: candyPop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes candyDrop {
    from {
      transform: translateY(-60px) scale(0.9);
      opacity: 0.5;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }

  @keyframes candyPop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3) rotate(8deg); opacity: 0.9; }
    100% { transform: scale(0); opacity: 0; }
  }

  .candy-tile:hover {
    transform: scale(1.08) rotate(2deg);
  }

  .candy-tile.selected {
    outline: 4px solid #f43f5e;
    box-shadow: 0 0 20px #f43f5e, 0 0 40px rgba(244, 63, 94, 0.6);
    transform: scale(1.12);
    z-index: 5;
    animation: selectedPulse 0.8s infinite alternate ease-in-out;
  }

  @keyframes selectedPulse {
    from { transform: scale(1.12); }
    to { transform: scale(1.18); }
  }

  .type-ruby { background: linear-gradient(135deg, #ff4b4b, #d90429); }
  .type-sapphire { background: linear-gradient(135deg, #38bdf8, #0284c7); }
  .type-emerald { background: linear-gradient(135deg, #34d399, #059669); }
  .type-amber { background: linear-gradient(135deg, #fbbf24, #d97706); }
  .type-amethyst { background: linear-gradient(135deg, #c084fc, #7e22ce); }

  .candy-symbol {
    font-size: 1.8rem;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    transition: transform 0.15s ease;
  }

  .candy-tile:hover .candy-symbol {
    transform: scale(1.2);
  }

  .special-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    background: #ffffff;
    color: #e11d48;
    font-weight: 900;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    animation: rotateBadge 3s linear infinite;
  }

  @keyframes rotateBadge {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .choco-overlay {
    position: absolute;
    inset: 0;
    background: rgba(120, 53, 15, 0.85);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    border: 2px solid #451a03;
    animation: chocoShake 2s infinite;
  }

  @keyframes chocoShake {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.03) rotate(1deg); }
  }
</style>
