<script lang="ts">
  import type { LevelConfig } from '$lib/game/level-manager';
  import { playerStore } from '$lib/stores/playerStore';

  let { levelConfig, onStart }: { levelConfig: LevelConfig; onStart: (boosters: string[]) => void } = $props();

  let selectedBoosters = $state<string[]>([]);

  function toggleBooster(type: string) {
    if (selectedBoosters.includes(type)) {
      selectedBoosters = selectedBoosters.filter((b) => b !== type);
    } else if ((playerStore.progress.boosters?.[type] || 0) > 0) {
      selectedBoosters = [...selectedBoosters, type];
    }
  }

  function handleStart() {
    selectedBoosters.forEach((b) => playerStore.useBooster(b));
    onStart(selectedBoosters);
  }
</script>

<div class="modal-backdrop">
  <div class="modal-card">
    <div class="modal-header">
      <h2>LEVEL {levelConfig.id}</h2>
      <h3>{levelConfig.title}</h3>
    </div>

    <div class="specs-grid">
      <div class="spec-item">
        <span class="icon">📐</span>
        <span class="val">{levelConfig.boardRows}x{levelConfig.boardCols} Board</span>
      </div>
      <div class="spec-item">
        <span class="icon">🎯</span>
        <span class="val">{levelConfig.objective.targetScore.toLocaleString()} pts</span>
      </div>
      <div class="spec-item">
        <span class="icon">👟</span>
        <span class="val">{levelConfig.moves} Moves</span>
      </div>
      {#if levelConfig.initialIceBlocks && levelConfig.initialIceBlocks.length > 0}
        <div class="spec-item">
          <span class="icon">🧊</span>
          <span class="val">{levelConfig.initialIceBlocks.length} Ice</span>
        </div>
      {/if}
      {#if levelConfig.initialJellies && levelConfig.initialJellies.length > 0}
        <div class="spec-item">
          <span class="icon">🍯</span>
          <span class="val">{levelConfig.initialJellies.length} Jelly</span>
        </div>
      {/if}
    </div>

    {#if (levelConfig.initialIceBlocks && levelConfig.initialIceBlocks.length > 0) || (levelConfig.initialJellies && levelConfig.initialJellies.length > 0)}
      <div class="preview-container">
        <div class="preview-title">OBSTACLE PREVIEW</div>
        <div class="preview-grid" style="grid-template-columns: repeat({levelConfig.boardCols}, 1fr);">
          {#each Array(levelConfig.boardRows) as _, r}
            {#each Array(levelConfig.boardCols) as _, c}
              {#if levelConfig.initialIceBlocks?.some(i => i.row === r && i.col === c)}
                <div class="mini-cell ice-cell">🧊</div>
              {:else if levelConfig.initialJellies?.some(j => j.row === r && j.col === c)}
                <div class="mini-cell jelly-cell">🍯</div>
              {:else}
                <div class="mini-cell"></div>
              {/if}
            {/each}
          {/each}
        </div>
      </div>
    {/if}

    <div class="objective-card">
      <h4>OBJECTIVE</h4>
      <p>
        {#if levelConfig.objective.type === 'collect'}
          Collect <strong>{levelConfig.objective.collectCount} {levelConfig.objective.collectType}s</strong> & reach target score!
        {:else if levelConfig.objective.type === 'obstacle'}
          Destroy <strong>{levelConfig.objective.obstacleCount} Ice Blocks</strong> & reach target score!
        {:else if levelConfig.objective.type === 'jelly'}
          Clear <strong>{levelConfig.objective.obstacleCount} Jelly Tiles</strong> & reach target score!
        {:else}
          Reach target score of <strong>{levelConfig.objective.targetScore.toLocaleString()}</strong> before running out of moves!
        {/if}
      </p>
    </div>

    <div class="pre-boosters">
      <h4>SELECT PRE-LEVEL BOOSTERS</h4>
      <div class="boosters-row">
        <button
          type="button"
          class="booster-option {selectedBoosters.includes('hammer') ? 'selected' : ''}"
          onclick={() => toggleBooster('hammer')}
        >
          <span class="b-icon">🔨</span>
          <span class="b-name">Hammer</span>
          <span class="b-count">({playerStore.progress.boosters?.hammer || 0})</span>
        </button>

        <button
          type="button"
          class="booster-option {selectedBoosters.includes('shuffle') ? 'selected' : ''}"
          onclick={() => toggleBooster('shuffle')}
        >
          <span class="b-icon">🔀</span>
          <span class="b-name">Shuffle</span>
          <span class="b-count">({playerStore.progress.boosters?.shuffle || 0})</span>
        </button>
      </div>
    </div>

    <button type="button" class="start-btn" onclick={handleStart}>
      PLAY LEVEL! 🚀
    </button>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  }

  .modal-card {
    background: #ffffff;
    border: 4px solid #f472b6;
    border-radius: 28px;
    padding: 28px 24px;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 15px 35px rgba(244, 114, 182, 0.3);
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    text-align: center;
    box-sizing: border-box;
    animation: cardPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  @keyframes cardPop {
    from { transform: scale(0.7); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .modal-header h2 {
    margin: 0;
    color: #e11d48;
    font-size: 1.1rem;
    font-weight: 900;
    letter-spacing: 1px;
  }

  .modal-header h3 {
    margin: 4px 0 0 0;
    color: #881337;
    font-size: 1.6rem;
    font-weight: 900;
  }

  .specs-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
  }

  .spec-item {
    background: #fff1f2;
    border: 2px solid #fecdd3;
    border-radius: 16px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: #9f1239;
    font-size: 0.9rem;
  }

  .objective-card {
    background: linear-gradient(135deg, #ffe4e6, #fbcfe8);
    border: 2px solid #f472b6;
    border-radius: 18px;
    padding: 12px 16px;
    width: 100%;
    box-sizing: border-box;
  }

  .objective-card h4 {
    margin: 0 0 4px 0;
    color: #be123c;
    font-size: 0.8rem;
    font-weight: 900;
  }

  .objective-card p {
    margin: 0;
    color: #881337;
    font-weight: 600;
    font-size: 0.95rem;
  }

  .pre-boosters {
    width: 100%;
  }

  .pre-boosters h4 {
    margin: 0 0 8px 0;
    color: #9f1239;
    font-size: 0.8rem;
    font-weight: 800;
  }

  .boosters-row {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .booster-option {
    flex: 1;
    background: #ffffff;
    border: 2px solid #f472b6;
    border-radius: 16px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    font-weight: 800;
    color: #881337;
    transition: all 0.15s ease;
  }

  .booster-option.selected {
    background: #f43f5e;
    color: #ffffff;
    border-color: #be123c;
    box-shadow: 0 4px 12px rgba(244, 63, 94, 0.4);
  }

  .start-btn {
    width: 100%;
    background: linear-gradient(90deg, #f43f5e, #ec4899);
    color: #ffffff;
    border: none;
    padding: 14px 28px;
    border-radius: 20px;
    font-size: 1.2rem;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(244, 63, 94, 0.4);
    transition: transform 0.15s ease;
  }

  .start-btn:hover {
    transform: scale(1.03);
  }

  .preview-container {
    width: 100%;
    background: #f8fafc;
    border: 2px dashed #cbd5e1;
    border-radius: 16px;
    padding: 8px;
    box-sizing: border-box;
  }

  .preview-title {
    font-size: 0.75rem;
    font-weight: 800;
    color: #64748b;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
  }

  .preview-grid {
    display: grid;
    gap: 2px;
    background: #e2e8f0;
    padding: 3px;
    border-radius: 8px;
    max-width: 180px;
    margin: 0 auto;
  }

  .mini-cell {
    aspect-ratio: 1;
    background: #ffffff;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
  }

  .ice-cell {
    background: #bae6fd;
  }

  .jelly-cell {
    background: #fbcfe8;
  }
</style>
