<script lang="ts">
  import { LevelManager } from '$lib/game/level-manager';
  import { playerStore } from '$lib/stores/playerStore';
  import { goto } from '$app/navigation';

  const levelManager = new LevelManager();
  
  const highestUnlocked = $derived(
    Math.max(1, ...(playerStore.progress.unlockedLevels || [1]))
  );
  // Show all levels up to highest unlocked level + 5 upcoming levels to support infinite levels!
  const displayedLevelCount = $derived(Math.max(10, highestUnlocked + 5));
  const allLevels = $derived(
    Array.from({ length: displayedLevelCount }, (_, i) => levelManager.getLevel(i + 1))
  );

  let activeModalMsg = $state<string | null>(null);

  function handleSelectLevel(levelId: number) {
    if (!playerStore.progress.unlockedLevels.includes(levelId)) {
      activeModalMsg = `🔒 Level ${levelId} is Locked! Complete Level ${levelId - 1} with at least 1 star to unlock.`;
      return;
    }
    if (playerStore.progress.lives <= 0) {
      activeModalMsg = '💔 Out of Lives! Spin the Daily Wheel or wait 5 mins for lives to regenerate.';
      return;
    }
    goto(`/game/${levelId}`);
  }

  function closeModal() {
    activeModalMsg = null;
  }
</script>

{#if activeModalMsg}
  <div class="modal-backdrop">
    <div class="modal-card">
      <div class="modal-icon">🍬</div>
      <p>{activeModalMsg}</p>
      <button class="close-btn" onclick={closeModal}>Got It! 👍</button>
    </div>
  </div>
{/if}

<div class="levels-screen">
  <div class="header">
    <h1>🍬 CANDY LEVEL MAP</h1>
    <p>Journey through the Candy Kingdom! Win levels to unlock new sweet sectors.</p>
  </div>

  <div class="levels-map">
    {#each allLevels as lvl}
      {@const isLocked = !playerStore.progress.unlockedLevels.includes(lvl.id)}
      {@const stars = playerStore.progress.stars[lvl.id] || 0}
      {@const bestScore = playerStore.progress.bestScores[lvl.id] || 0}

      <button
        type="button"
        class="map-level-node {isLocked ? 'locked' : 'unlocked'} diff-{lvl.difficulty}"
        onclick={() => handleSelectLevel(lvl.id)}
      >
        <div class="node-header">
          <span class="level-num">LEVEL {lvl.id}</span>
          <span class="diff-tag">{lvl.difficulty.toUpperCase()}</span>
        </div>

        <div class="node-title">{lvl.title}</div>

        <div class="node-body">
          {#if isLocked}
            <div class="locked-info">
              <span class="lock">🔒</span>
              <span class="req-text">Requires Level {lvl.id - 1}</span>
            </div>
          {:else}
            <div class="stars-row">
              <span class="star {stars >= 1 ? 'earned' : ''}">★</span>
              <span class="star {stars >= 2 ? 'earned' : ''}">★</span>
              <span class="star {stars >= 3 ? 'earned' : ''}">★</span>
            </div>
            <div class="badges-row">
              {#if lvl.initialIceBlocks && lvl.initialIceBlocks.length > 0}
                <span class="obs-badge ice">🧊 {lvl.initialIceBlocks.length}</span>
              {/if}
              {#if lvl.initialJellies && lvl.initialJellies.length > 0}
                <span class="obs-badge jelly">🍯 {lvl.initialJellies.length}</span>
              {/if}
            </div>
          {/if}
        </div>

        <div class="node-footer">
          {#if !isLocked}
            <span>Best: {bestScore.toLocaleString()}</span>
          {:else}
            <span>Locked</span>
          {/if}
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
  .levels-screen {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .header h1 {
    margin: 0;
    font-size: 2.2rem;
    font-weight: 900;
    color: #e11d48;
  }

  .header p {
    margin: 4px 0 0 0;
    font-size: 0.95rem;
    color: #9f1239;
  }

  .levels-map {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .map-level-node {
    background: #ffffff;
    border: 3px solid #f472b6;
    border-radius: 24px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 140px;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(244, 114, 182, 0.2);
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
    text-align: left;
  }

  .map-level-node.unlocked:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 25px rgba(244, 114, 182, 0.35);
    border-color: #f43f5e;
  }

  .map-level-node.locked {
    opacity: 0.6;
    background: #f8fafc;
    border-color: #cbd5e1;
    cursor: not-allowed;
  }

  .node-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .level-num {
    font-size: 1.1rem;
    font-weight: 900;
    color: #be123c;
  }

  .diff-tag {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 10px;
    background: #fce7f3;
    color: #db2777;
  }

  .node-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: #881337;
    margin-top: 4px;
  }

  .node-body {
    margin: 8px 0;
  }

  .stars-row {
    display: flex;
    gap: 4px;
  }

  .star {
    font-size: 1.5rem;
    color: #cbd5e1;
  }

  .star.earned {
    color: #fbbf24;
    text-shadow: 0 2px 6px rgba(251, 191, 36, 0.6);
  }

  .badges-row {
    display: flex;
    gap: 6px;
    margin-top: 4px;
  }

  .obs-badge {
    font-size: 0.65rem;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 8px;
  }

  .obs-badge.ice {
    background: #e0f2fe;
    color: #0369a1;
  }

  .obs-badge.jelly {
    background: #fce7f3;
    color: #be185d;
  }

  .lock {
    font-size: 1.8rem;
  }

  .locked-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .req-text {
    font-size: 0.7rem;
    font-weight: 700;
    color: #64748b;
  }

  .node-footer {
    font-size: 0.8rem;
    font-weight: 700;
    color: #9f1239;
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  }

  .modal-card {
    background: #ffffff;
    border: 4px solid #f472b6;
    border-radius: 24px;
    padding: 28px;
    max-width: 360px;
    width: 100%;
    box-shadow: 0 15px 35px rgba(244, 114, 182, 0.3);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .modal-icon {
    font-size: 3rem;
  }

  .modal-card p {
    margin: 0;
    font-weight: 700;
    color: #881337;
    font-size: 1rem;
    line-height: 1.4;
  }

  .close-btn {
    background: linear-gradient(90deg, #f43f5e, #ec4899);
    color: #ffffff;
    border: none;
    padding: 10px 24px;
    border-radius: 16px;
    font-weight: 900;
    font-size: 0.95rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);
  }
</style>
