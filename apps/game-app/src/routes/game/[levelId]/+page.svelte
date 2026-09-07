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
  let gridElement: HTMLElement | null = $state(null);

  // FIX #2 — Cell pitch calculation using container size and actual row/col gaps
  let cellPitchX = $state(50);
  let cellPitchY = $state(50);

  function updateGeometry() {
    if (gridElement && gameState) {
      const rect = gridElement.getBoundingClientRect();
      const cols = gameState.levelConfig.boardCols || 8;
      const rows = gameState.levelConfig.boardRows || 8;

      const style = window.getComputedStyle(gridElement);
      const colGap = parseFloat(style.columnGap || style.gap || '10') || 10;
      const rowGap = parseFloat(style.rowGap || style.gap || '10') || 10;

      const cellSizeX = (rect.width - (cols - 1) * colGap) / cols;
      const cellSizeY = (rect.height - (rows - 1) * rowGap) / rows;

      cellPitchX = cellSizeX + colGap;
      cellPitchY = cellSizeY + rowGap;
    }
  }

  onMount(() => {
    if (!playerStore.progress.unlockedLevels.includes(levelId)) {
      goto('/levels');
      return;
    }

    engine = new GameEngine(levelId);
    gameState = engine.state;

    // FIX #4 — Cascade sound hook integration (plays sound per cascade step without duplicate sound spam)
    engine.onCascade = (comboCount: number) => {
      soundFx.playMatchSound(comboCount);
    };

    window.addEventListener('resize', updateGeometry);
    setTimeout(updateGeometry, 50);

    return () => {
      window.removeEventListener('resize', updateGeometry);
    };
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

  // Pointer Events gesture state with direction locking (SHOULD FIX #14)
  let pointerStart: { x: number; y: number; r: number; c: number } | null = null;
  let dragOffset = $state<{ r: number; c: number; dx: number; dy: number; targetR: number; targetC: number } | null>(null);
  let lockedDirection = $state<'horizontal' | 'vertical' | null>(null);
  let swipeHandled = false;

  function handlePointerDown(e: PointerEvent, r: number, c: number) {
    if (!engine || !gameState || gameState.isProcessing) return;
    updateGeometry();
    pointerStart = { x: e.clientX, y: e.clientY, r, c };
    dragOffset = { r, c, dx: 0, dy: 0, targetR: -1, targetC: -1 };
    lockedDirection = null;
    swipeHandled = false;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unavailable
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!pointerStart || !engine || !gameState || gameState.isProcessing) return;

    const dx = e.clientX - pointerStart.x;
    const dy = e.clientY - pointerStart.y;

    const distance = Math.hypot(dx, dy);
    if (distance > 6) {
      e.preventDefault();

      // Lock direction after threshold (SHOULD FIX #14)
      if (!lockedDirection) {
        lockedDirection = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }

      const maxDrag = cellPitchX * 0.95;
      let clampedDx = 0;
      let clampedDy = 0;
      let targetR = pointerStart.r;
      let targetC = pointerStart.c;

      if (lockedDirection === 'horizontal') {
        clampedDx = Math.max(-maxDrag, Math.min(maxDrag, dx));
        targetC += clampedDx > 0 ? 1 : -1;
      } else {
        clampedDy = Math.max(-maxDrag, Math.min(maxDrag, dy));
        targetR += clampedDy > 0 ? 1 : -1;
      }

      // Ensure target is within grid boundaries
      if (
        targetR < 0 ||
        targetR >= gameState.levelConfig.boardRows ||
        targetC < 0 ||
        targetC >= gameState.levelConfig.boardCols
      ) {
        targetR = -1;
        targetC = -1;
      }

      dragOffset = {
        r: pointerStart.r,
        c: pointerStart.c,
        dx: clampedDx,
        dy: clampedDy,
        targetR,
        targetC,
      };
    }
  }

  async function handlePointerUp(e: PointerEvent) {
    if (!pointerStart || !engine || !gameState || gameState.isProcessing) {
      pointerStart = null;
      dragOffset = null;
      lockedDirection = null;
      return;
    }

    const start = pointerStart;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const currentLockedDir = lockedDirection;

    pointerStart = null;
    dragOffset = null;
    lockedDirection = null;

    const threshold = 14;

    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      return;
    }

    swipeHandled = true;

    let targetR = start.r;
    let targetC = start.c;

    const dir = currentLockedDir || (Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical');
    if (dir === 'horizontal') {
      targetC += dx > 0 ? 1 : -1;
    } else {
      targetR += dy > 0 ? 1 : -1;
    }

    if (
      targetR < 0 ||
      targetR >= gameState.levelConfig.boardRows ||
      targetC < 0 ||
      targetC >= gameState.levelConfig.boardCols
    ) {
      return;
    }

    selectedRow = -1;
    selectedCol = -1;

    const success = await engine.executeMove(start.r, start.c, targetR, targetC);
    gameState = { ...engine.state };

    if (success) {
      if (engine.state.status !== 'playing') {
        handleGameOver(engine.state.status);
      }
    }
  }

  function handlePointerCancel() {
    pointerStart = null;
    dragOffset = null;
    lockedDirection = null;
    swipeHandled = false;
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

    <div class="candy-board-frame">
      <div
        bind:this={gridElement}
        class="candy-grid {gameState.phase === 'refilling' ? 'shuffling' : ''}"
        style="grid-template-columns: repeat({gameState.levelConfig.boardCols}, 1fr); grid-template-rows: repeat({gameState.levelConfig.boardRows}, 1fr);"
      >
        <!-- FIX #5 — Board-wide special effect overlays -->
        {#if gameState.activeEffects && gameState.activeEffects.length > 0}
          {#each gameState.activeEffects as effect}
            {#if effect.type === 'line-h' && effect.row !== undefined}
              <div
                class="board-effect-beam-h"
                style="top: calc({(effect.row / (gameState.levelConfig.boardRows || 8)) * 100}% + {cellPitchY * 0.1}px); height: {cellPitchY * 0.8}px;"
              ></div>
            {/if}

            {#if effect.type === 'line-v' && effect.col !== undefined}
              <div
                class="board-effect-beam-v"
                style="left: calc({(effect.col / (gameState.levelConfig.boardCols || 8)) * 100}% + {cellPitchX * 0.1}px); width: {cellPitchX * 0.8}px;"
              ></div>
            {/if}

            {#if effect.type === 'bomb' && effect.row !== undefined && effect.col !== undefined}
              <div
                class="board-effect-bomb-ring"
                style="top: {(effect.row + 0.5) * cellPitchY}px; left: {(effect.col + 0.5) * cellPitchX}px;"
              ></div>
            {/if}

            {#if effect.type === 'prism'}
              <div class="board-effect-prism-flash"></div>
            {/if}
          {/each}
        {/if}

        {#each gameState.grid as row, r}
          {#each row as tile, c}
            {@const isSelected = selectedRow === r && selectedCol === c}
            {@const isDragged = dragOffset && dragOffset.r === r && dragOffset.c === c}
            {@const isTargetReaction = dragOffset && dragOffset.targetR === r && dragOffset.targetC === c}

            <!-- FIX #3: Two-candy visual swap animation -->
            {@const swapAnim = gameState.swapAnimation}
            {@const isSwapTile1 = swapAnim && swapAnim.fromRow === r && swapAnim.fromCol === c}
            {@const isSwapTile2 = swapAnim && swapAnim.toRow === r && swapAnim.toCol === c}

            {@const swapDx = isSwapTile1
              ? (swapAnim.toCol - swapAnim.fromCol) * cellPitchX
              : isSwapTile2
              ? (swapAnim.fromCol - swapAnim.toCol) * cellPitchX
              : 0}
            {@const swapDy = isSwapTile1
              ? (swapAnim.toRow - swapAnim.fromRow) * cellPitchY
              : isSwapTile2
              ? (swapAnim.fromRow - swapAnim.toRow) * cellPitchY
              : 0}

            <!-- Staggered animation delay based on cell position -->
            {@const staggerDelay = (r % 4) * 25 + (c % 4) * 15}
            {@const actualFallDist = tile.isNew && tile.fromRow !== undefined ? (r - tile.fromRow) : (tile.fallDistance || 1)}

            <button
              type="button"
              class="candy-tile type-{tile.type} {isSelected ? 'selected' : ''} {tile.matched ? 'matched' : ''} {tile.falling ? 'falling' : ''}"
              style={
                isSwapTile1 || isSwapTile2
                  ? `transform: translate(${swapAnim?.reversing ? 0 : swapDx}px, ${swapAnim?.reversing ? 0 : swapDy}px); transition: transform 0.16s ease-in-out; z-index: 25;`
                  : isDragged
                  ? `transform: translate(${dragOffset.dx}px, ${dragOffset.dy}px) scale(1.12); z-index: 20; box-shadow: 0 10px 25px rgba(0,0,0,0.3);`
                  : isTargetReaction
                  ? `transform: translate(${-dragOffset.dx * 0.35}px, ${-dragOffset.dy * 0.35}px) scale(0.96); z-index: 10;`
                  : tile.fallDistance
                  ? `--fall-dist: ${actualFallDist * cellPitchY}px; animation-delay: ${staggerDelay}ms;`
                  : ''
              }
              onclick={() => {
                if (!swipeHandled) {
                  handleTileClick(r, c);
                }
                swipeHandled = false;
              }}
              onpointerdown={(e) => handlePointerDown(e, r, c)}
              onpointermove={handlePointerMove}
              onpointerup={handlePointerUp}
              onpointercancel={handlePointerCancel}
              aria-label="Candy {tile.type}"
            >
              <div class="candy-symbol">
                {#if tile.type === 'ruby'}🍬{:else if tile.type === 'sapphire'}🍭{:else if tile.type === 'emerald'}🍏{:else if tile.type === 'amber'}🍊{:else if tile.type === 'amethyst'}🍇{:else}🍩{/if}
              </div>

              {#if tile.special === 'line-h'}<span class="special-badge">↔</span>{/if}
              {#if tile.special === 'line-v'}<span class="special-badge">↕</span>{/if}
              {#if tile.special === 'bomb'}<span class="special-badge">💣</span>{/if}
              {#if tile.special === 'prism'}<span class="special-badge">🍩</span>{/if}

              <!-- MUST FIX #8: Lightweight special visual effect overlays -->
              {#if tile.matched && tile.special === 'line-h'}<div class="special-effect-line-h"></div>{/if}
              {#if tile.matched && tile.special === 'line-v'}<div class="special-effect-line-v"></div>{/if}
              {#if tile.matched && tile.special === 'bomb'}<div class="special-effect-bomb"></div>{/if}
              {#if tile.matched && tile.special === 'prism'}<div class="special-effect-prism"></div>{/if}

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
    user-select: none;
    -webkit-user-select: none;
    position: relative;
    transition: transform 0.3s ease, filter 0.3s ease;
  }

  .candy-grid.shuffling {
    animation: gridShuffle 0.4s ease-in-out;
  }

  @keyframes gridShuffle {
    0% { transform: scale(1) rotate(0deg); opacity: 1; }
    50% { transform: scale(0.92) rotate(3deg); opacity: 0.5; filter: blur(4px); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }

  /* FIX #5: Board-Wide Special Effect Overlays */
  .board-effect-beam-h {
    position: absolute;
    left: 0;
    right: 0;
    background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.95), rgba(255,255,255,0));
    box-shadow: 0 0 20px #ffffff;
    pointer-events: none;
    z-index: 30;
    animation: beamSweepH 0.25s ease-out forwards;
  }

  .board-effect-beam-v {
    position: absolute;
    top: 0;
    bottom: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.95), rgba(255,255,255,0));
    box-shadow: 0 0 20px #ffffff;
    pointer-events: none;
    z-index: 30;
    animation: beamSweepV 0.25s ease-out forwards;
  }

  .board-effect-bomb-ring {
    position: absolute;
    width: 140px;
    height: 140px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(251,191,36,0.9) 0%, rgba(244,63,94,0.7) 50%, rgba(239,68,68,0) 80%);
    pointer-events: none;
    z-index: 30;
    animation: bombExpand 0.28s ease-out forwards;
  }

  .board-effect-prism-flash {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, rgba(244,114,182,0.8), rgba(168,85,247,0.8), rgba(59,130,246,0.8));
    pointer-events: none;
    z-index: 30;
    animation: prismFlash 0.3s ease-out forwards;
  }

  @keyframes beamSweepH {
    0% { transform: scaleX(0.2); opacity: 1; }
    100% { transform: scaleX(1); opacity: 0; }
  }

  @keyframes beamSweepV {
    0% { transform: scaleY(0.2); opacity: 1; }
    100% { transform: scaleY(1); opacity: 0; }
  }

  @keyframes bombExpand {
    0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
  }

  @keyframes prismFlash {
    0% { opacity: 0.9; transform: scale(0.95); }
    100% { opacity: 0; transform: scale(1.05); }
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
    -webkit-user-select: none;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.12), inset 0 2px 2px rgba(255, 255, 255, 0.5);
    transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.15s ease;
    overflow: hidden;
  }

  /* MUST FIX #5 & #6: Dynamic pixel fall animation with subtle stagger */
  .candy-tile.falling {
    animation: candyDrop 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  .candy-tile.matched {
    animation: candyPop 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes candyDrop {
    0% {
      transform: translateY(calc(var(--fall-dist, 100px) * -1)) scale(0.92);
      opacity: 0.6;
    }
    75% {
      transform: translateY(4px) scale(1.03);
      opacity: 1;
    }
    100% {
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
    z-index: 15;
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

  /* MUST FIX #8: Special Visual Effects */
  .special-effect-line-h {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
    animation: lineSweepH 0.22s ease-out forwards;
  }

  .special-effect-line-v {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent, rgba(255,255,255,0.9), transparent);
    animation: lineSweepV 0.22s ease-out forwards;
  }

  .special-effect-bomb {
    position: absolute;
    inset: -20px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(251,191,36,0.9) 0%, rgba(239,68,68,0) 70%);
    animation: bombExpand 0.25s ease-out forwards;
  }

  .special-effect-prism {
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff);
    opacity: 0.8;
    animation: prismFlash 0.25s linear infinite;
  }

  @keyframes lineSweepH {
    0% { transform: scaleX(0); }
    100% { transform: scaleX(2); opacity: 0; }
  }

  @keyframes lineSweepV {
    0% { transform: scaleY(0); }
    100% { transform: scaleY(2); opacity: 0; }
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
