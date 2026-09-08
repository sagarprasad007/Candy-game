<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { LevelManager, type LevelConfig } from '$lib/game/level-manager';
  import { playerStore } from '$lib/stores/playerStore';
  import { goto } from '$app/navigation';
  import PreLevelModal from '$lib/components/PreLevelModal.svelte';

  const levelManager = new LevelManager();

  const highestUnlocked = $derived(
    Math.max(1, ...(playerStore.progress.unlockedLevels || [1]))
  );

  // CHAPTER/WORLD DEFINITIONS (Every 15 levels = 1 World Chapter)
  const CHAPTER_SIZE = 15;
  const WORLD_THEMES = [
    { name: 'Starlight Outpost', bg: 'linear-gradient(180deg, #312e81 0%, #1e1b4b 50%, #4338ca 100%)', text: '#e0e7ff', line: '#818cf8', pathFill: 'rgba(99, 102, 241, 0.4)' },
    { name: 'Sapphire Nebula', bg: 'linear-gradient(180deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)', text: '#e0f2fe', line: '#38bdf8', pathFill: 'rgba(56, 189, 248, 0.4)' },
    { name: 'Frozen Comet Realm', bg: 'linear-gradient(180deg, #164e63 0%, #155e75 50%, #0891b2 100%)', text: '#cffafe', line: '#22d3ee', pathFill: 'rgba(34, 211, 238, 0.4)' },
    { name: 'Ruby Pulsar Galaxy', bg: 'linear-gradient(180deg, #881337 0%, #be123c 50%, #e11d48 100%)', text: '#ffe4e6', line: '#fb7185', pathFill: 'rgba(251, 113, 133, 0.4)' },
    { name: 'Void Anomaly Sector', bg: 'linear-gradient(180deg, #581c87 0%, #6b21a8 50%, #7e22ce 100%)', text: '#f3e8ff', line: '#c084fc', pathFill: 'rgba(192, 132, 252, 0.4)' },
    { name: 'Supernova Core', bg: 'linear-gradient(180deg, #7c2d12 0%, #9a3412 50%, #c2410c 100%)', text: '#ffedd5', line: '#fb923c', pathFill: 'rgba(251, 146, 60, 0.4)' },
  ];

  function getWorldTheme(levelId: number) {
    const chapterIdx = Math.floor((levelId - 1) / CHAPTER_SIZE);
    return WORLD_THEMES[chapterIdx % WORLD_THEMES.length];
  }

  // WINDOWED RANGE RENDERING (Bounded to max ~25 nodes around current view position)
  const NODE_WINDOW_BEFORE = 10;
  const NODE_WINDOW_AFTER = 15;
  
  let centerLevelId = $state(highestUnlocked);
  let scrollContainerEl = $state<HTMLElement | null>(null);

  const startLevelId = $derived(Math.max(1, centerLevelId - NODE_WINDOW_BEFORE));
  const endLevelId = $derived(centerLevelId + NODE_WINDOW_AFTER);

  // Generate node list for bounded window
  const windowedLevels = $derived.by(() => {
    const levels: LevelConfig[] = [];
    for (let id = startLevelId; id <= endLevelId; id++) {
      levels.push(levelManager.getLevel(id));
    }
    return levels;
  });

  // Calculate coordinates for winding sine curve path
  // y rises vertically, x oscillates sinusoidally
  const NODE_SPACING_Y = 120;
  const MAP_WIDTH = 340;
  const MAP_CENTER_X = 170;
  const SINE_AMPLITUDE = 110;

  function getNodeCoords(levelId: number) {
    // Reverse Y so level 1 is near bottom and higher levels go upward
    const y = (levelId - 1) * NODE_SPACING_Y + 80;
    // Sine wave offset with deterministic levelId frequency
    const x = MAP_CENTER_X + SINE_AMPLITUDE * Math.sin(levelId * 0.7);
    return { x, y };
  }

  // Generate SVG path Q curves between points
  const pathD = $derived.by(() => {
    if (windowedLevels.length === 0) return '';
    let d = '';
    windowedLevels.forEach((lvl, idx) => {
      const p = getNodeCoords(lvl.id);
      if (idx === 0) {
        d += `M ${p.x} ${p.y}`;
      } else {
        const prev = getNodeCoords(windowedLevels[idx - 1].id);
        const controlX = (prev.x + p.x) / 2 + (idx % 2 === 0 ? 25 : -25);
        const controlY = (prev.y + p.y) / 2;
        d += ` Q ${controlX} ${controlY}, ${p.x} ${p.y}`;
      }
    });
    return d;
  });

  // Generate SVG path for completed levels line highlight
  const completedPathD = $derived.by(() => {
    const completedWindow = windowedLevels.filter(lvl => playerStore.progress.completedLevels.includes(lvl.id) || lvl.id <= highestUnlocked);
    if (completedWindow.length === 0) return '';
    let d = '';
    completedWindow.forEach((lvl, idx) => {
      const p = getNodeCoords(lvl.id);
      if (idx === 0) {
        d += `M ${p.x} ${p.y}`;
      } else {
        const prev = getNodeCoords(completedWindow[idx - 1].id);
        const controlX = (prev.x + p.x) / 2 + (idx % 2 === 0 ? 25 : -25);
        const controlY = (prev.y + p.y) / 2;
        d += ` Q ${controlX} ${controlY}, ${p.x} ${p.y}`;
      }
    });
    return d;
  });

  const currentSvgHeight = $derived((endLevelId - startLevelId + 2) * NODE_SPACING_Y + 160);

  // AVATAR POSITION & SELECTION STATE
  let selectedLevelConfig = $state<LevelConfig | null>(null);
  let activeModalMsg = $state<string | null>(null);
  let isWalking = $state(false);
  let avatarTargetId = $state(highestUnlocked);
  let activePopoverLevel = $state<LevelConfig | null>(null);

  const avatarCoords = $derived(getNodeCoords(avatarTargetId));

  onMount(async () => {
    // Jump-scroll directly to player's highest unlocked node without multi-thousand-px animation
    await tick();
    if (scrollContainerEl) {
      const targetPos = getNodeCoords(highestUnlocked);
      scrollContainerEl.scrollTop = targetPos.y - 300;
    }
  });

  function handleNodeTap(lvl: LevelConfig) {
    if (!playerStore.progress.unlockedLevels.includes(lvl.id)) {
      activeModalMsg = `🔒 Level ${lvl.id} is Locked! Complete Level ${lvl.id - 1} with at least 1 star to unlock.`;
      return;
    }

    // Trigger inline popover card preview
    activePopoverLevel = lvl;
  }

  async function handleConfirmPlayFromPopover(lvl: LevelConfig) {
    activePopoverLevel = null;
    if (playerStore.progress.lives <= 0) {
      activeModalMsg = '💔 Out of Lives! Spin the Daily Wheel or wait 5 mins for lives to regenerate.';
      return;
    }

    // Feature 2: "Walking to Level" Avatar animation (250ms CSS transform transition)
    avatarTargetId = lvl.id;
    isWalking = true;
    await new Promise(r => setTimeout(r, 280));
    isWalking = false;

    selectedLevelConfig = lvl;
  }

  function handleStartLevelFromModal() {
    if (selectedLevelConfig) {
      goto(`/game/${selectedLevelConfig.id}`);
    }
  }

  function handleJumpToLevel(targetId: number) {
    if (targetId > 0) {
      centerLevelId = targetId;
      if (scrollContainerEl) {
        const pos = getNodeCoords(targetId);
        scrollContainerEl.scrollTop = pos.y - 300;
      }
    }
  }

  function closeModal() {
    activeModalMsg = null;
  }
</script>

{#if activeModalMsg}
  <div class="modal-backdrop" transition:fade={{ duration: 150 }}>
    <div class="modal-card">
      <div class="modal-icon">🍬</div>
      <p>{activeModalMsg}</p>
      <button class="close-btn" onclick={closeModal}>Got It! 👍</button>
    </div>
  </div>
{/if}

{#if selectedLevelConfig}
  <PreLevelModal levelConfig={selectedLevelConfig} onStart={handleStartLevelFromModal} />
{/if}

<div class="saga-map-screen">
  <div class="header">
    <div class="header-left">
      <h1>🗺️ CANDY SAGA PATH</h1>
      <p>Current World: <strong>{getWorldTheme(highestUnlocked).name}</strong></p>
    </div>
    <div class="jump-control">
      <button class="jump-pill" onclick={() => handleJumpToLevel(1)}>Start 🚩</button>
      <button class="jump-pill active" onclick={() => handleJumpToLevel(highestUnlocked)}>Lvl {highestUnlocked} 📍</button>
    </div>
  </div>

  <div class="map-viewport" bind:this={scrollContainerEl}>
    <div class="map-content-track" style="height: {currentSvgHeight}px; background: {getWorldTheme(centerLevelId).bg};">
      <!-- SVG Connecting Curved Path Overlay -->
      <svg class="saga-svg-overlay" width={MAP_WIDTH} height={currentSvgHeight}>
        <!-- Base uncompleted path -->
        <path d={pathD} fill="none" stroke="rgba(255, 255, 255, 0.35)" stroke-width="12" stroke-linecap="round" stroke-dasharray="8 8" />
        <!-- Completed path glow -->
        {#if completedPathD}
          <path d={completedPathD} fill="none" stroke={getWorldTheme(centerLevelId).line} stroke-width="10" stroke-linecap="round" />
        {/if}
      </svg>

      <!-- CHAPTER WORLD HEADERS -->
      {#each windowedLevels as lvl}
        {#if lvl.id % CHAPTER_SIZE === 1}
          {@const pos = getNodeCoords(lvl.id)}
          <div class="chapter-banner" style="top: {pos.y - 65}px;">
            <span class="chapter-num">CHAPTER {Math.floor(lvl.id / CHAPTER_SIZE) + 1}</span>
            <span class="chapter-name">✨ {getWorldTheme(lvl.id).name} ✨</span>
          </div>
        {/if}
      {/each}

      <!-- LEVEL NODES -->
      {#each windowedLevels as lvl (lvl.id)}
        {@const pos = getNodeCoords(lvl.id)}
        {@const isLocked = !playerStore.progress.unlockedLevels.includes(lvl.id)}
        {@const isCompleted = playerStore.progress.completedLevels.includes(lvl.id)}
        {@const isCurrent = lvl.id === highestUnlocked}
        {@const isMilestone = lvl.id % 10 === 0}
        {@const isWorldEnd = lvl.id % 15 === 0}
        {@const stars = playerStore.progress.stars[lvl.id] || 0}

        <div
          class="saga-node-wrapper {isMilestone ? 'milestone-node' : ''} {isWorldEnd ? 'world-end-node' : ''}"
          style="left: {pos.x}px; top: {pos.y}px;"
          in:scale={{ duration: 200, start: 0.6 }}
        >
          <button
            type="button"
            class="saga-node-btn {isLocked ? 'locked' : isCompleted ? 'completed' : 'current'}"
            onclick={() => handleNodeTap(lvl)}
            aria-label="Level {lvl.id}: {lvl.title}"
          >
            {#if isLocked}
              <span class="node-icon">🔒</span>
            {:else if isWorldEnd}
              <span class="node-icon">👑</span>
            {:else if isMilestone}
              <span class="node-icon">🎁</span>
            {:else}
              <span class="node-num">{lvl.id}</span>
            {/if}

            <!-- Completed Star Badge Row -->
            {#if isCompleted && stars > 0}
              <div class="node-stars">
                <span class="star {stars >= 1 ? 'earned' : ''}">★</span>
                <span class="star {stars >= 2 ? 'earned' : ''}">★</span>
                <span class="star {stars >= 3 ? 'earned' : ''}">★</span>
              </div>
            {/if}

            <!-- Obstacle Badges -->
            {#if !isLocked}
              <div class="node-badges">
                {#if lvl.initialIceBlocks && lvl.initialIceBlocks.length > 0}
                  <span class="mini-obs ice">🧊</span>
                {/if}
                {#if lvl.initialJellies && lvl.initialJellies.length > 0}
                  <span class="mini-obs jelly">🍯</span>
                {/if}
              </div>
            {/if}
          </button>
        </div>
      {/each}

      <!-- WALKING AVATAR MARKER (Positioned over current target node) -->
      <div
        class="walking-avatar {isWalking ? 'walking' : ''}"
        style="left: {avatarCoords.x}px; top: {avatarCoords.y - 36}px;"
      >
        <span class="avatar-sprite">🍭</span>
      </div>

      <!-- INLINE LEVEL PREVIEW POPOVER (Feature 4) -->
      {#if activePopoverLevel}
        {@const pPos = getNodeCoords(activePopoverLevel.id)}
        <div
          class="node-popover"
          style="left: {Math.min(MAP_WIDTH - 180, Math.max(10, pPos.x - 90))}px; top: {pPos.y - 120}px;"
          transition:scale={{ duration: 150, start: 0.8 }}
        >
          <div class="popover-title">LEVEL {activePopoverLevel.id}</div>
          <div class="popover-subtitle">{activePopoverLevel.title}</div>
          <div class="popover-info">
            <span>👟 {activePopoverLevel.moves} Moves</span>
            <span>🎯 {activePopoverLevel.objective.targetScore.toLocaleString()} pts</span>
          </div>
          <button class="popover-play-btn" onclick={() => handleConfirmPlayFromPopover(activePopoverLevel!)}>
            PLAY LEVEL 🚀
          </button>
          <button class="popover-close" onclick={() => activePopoverLevel = null}>✕</button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .saga-map-screen {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 12px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #ffffff;
    border: 3px solid #f472b6;
    border-radius: 20px;
    padding: 12px 16px;
    box-shadow: 0 6px 16px rgba(244, 114, 182, 0.2);
  }

  .header h1 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 900;
    color: #e11d48;
  }

  .header p {
    margin: 2px 0 0 0;
    font-size: 0.8rem;
    color: #881337;
    font-weight: 700;
  }

  .jump-control {
    display: flex;
    gap: 6px;
  }

  .jump-pill {
    background: #fff1f2;
    border: 2px solid #fecdd3;
    color: #be123c;
    padding: 6px 12px;
    border-radius: 14px;
    font-weight: 800;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .jump-pill.active {
    background: #f43f5e;
    color: #ffffff;
    border-color: #be123c;
  }

  /* MAP SCROLL VIEWPORT WITH CSS SCROLL-SNAP */
  .map-viewport {
    flex: 1;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    overflow-y: auto;
    border: 3px solid #f472b6;
    border-radius: 28px;
    position: relative;
    box-shadow: 0 10px 30px rgba(244, 114, 182, 0.25);
    scroll-snap-type: y proximity;
    -webkit-overflow-scrolling: touch;
  }

  .map-content-track {
    position: relative;
    width: 100%;
    transition: background 0.5s ease;
  }

  .saga-svg-overlay {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 1;
  }

  .chapter-banner {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(8px);
    border: 2px solid rgba(255, 255, 255, 0.5);
    padding: 6px 18px;
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    white-space: nowrap;
    z-index: 2;
  }

  .chapter-num {
    font-size: 0.65rem;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: 1px;
  }

  .chapter-name {
    font-size: 0.95rem;
    font-weight: 900;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  /* SAGA PATH NODE STYLES */
  .saga-node-wrapper {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 5;
    scroll-snap-align: center;
  }

  .saga-node-btn {
    width: 58px;
    height: 58px;
    border-radius: 50%;
    border: 4px solid #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.3);
    position: relative;
    transition: transform 0.15s ease, filter 0.15s ease;
  }

  .saga-node-btn:hover {
    transform: scale(1.1);
  }

  .saga-node-btn.completed {
    background: linear-gradient(135deg, #10b981, #059669);
    border-color: #ecfdf5;
  }

  .saga-node-btn.current {
    background: linear-gradient(135deg, #f43f5e, #ec4899);
    border-color: #fef2f2;
    animation: nodePulse 1.2s infinite alternate ease-in-out;
  }

  .saga-node-btn.locked {
    background: #64748b;
    border-color: #cbd5e1;
    opacity: 0.75;
    cursor: not-allowed;
  }

  .milestone-node .saga-node-btn {
    width: 66px;
    height: 66px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-color: #fef3c7;
  }

  .world-end-node .saga-node-btn {
    width: 72px;
    height: 72px;
    background: linear-gradient(135deg, #8b5cf6, #6d28d9);
    border-color: #f3e8ff;
  }

  @keyframes nodePulse {
    from { transform: scale(1); box-shadow: 0 0 10px rgba(244, 63, 94, 0.5); }
    to { transform: scale(1.12); box-shadow: 0 0 22px rgba(244, 63, 94, 0.9); }
  }

  .node-num {
    font-size: 1.15rem;
    font-weight: 900;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  }

  .node-icon {
    font-size: 1.4rem;
  }

  .node-stars {
    display: flex;
    gap: 1px;
    position: absolute;
    bottom: -10px;
    background: rgba(0, 0, 0, 0.5);
    padding: 1px 4px;
    border-radius: 8px;
  }

  .star {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .star.earned {
    color: #fbbf24;
  }

  .node-badges {
    position: absolute;
    top: -6px;
    right: -6px;
    display: flex;
    gap: 2px;
  }

  .mini-obs {
    font-size: 0.75rem;
  }

  /* WALKING AVATAR MARKER (Part 2 & Part 3 Feature) */
  .walking-avatar {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 10;
    pointer-events: none;
    transition: left 0.28s ease, top 0.28s ease;
  }

  .avatar-sprite {
    font-size: 2.2rem;
    display: inline-block;
    animation: avatarBob 1s infinite alternate ease-in-out;
  }

  .walking-avatar.walking .avatar-sprite {
    animation: avatarHop 0.15s infinite alternate ease-in-out;
  }

  @keyframes avatarBob {
    from { transform: translateY(0); }
    to { transform: translateY(-6px); }
  }

  @keyframes avatarHop {
    from { transform: translateY(0) rotate(-10deg); }
    to { transform: translateY(-12px) rotate(10deg); }
  }

  /* INLINE LEVEL PREVIEW POPOVER (Part 3 Feature 4) */
  .node-popover {
    position: absolute;
    width: 170px;
    background: #ffffff;
    border: 3px solid #f472b6;
    border-radius: 18px;
    padding: 10px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    z-index: 15;
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }

  .popover-title {
    font-size: 0.8rem;
    font-weight: 900;
    color: #e11d48;
  }

  .popover-subtitle {
    font-size: 0.75rem;
    font-weight: 800;
    color: #881337;
  }

  .popover-info {
    display: flex;
    justify-content: space-around;
    font-size: 0.65rem;
    font-weight: 700;
    color: #9f1239;
    background: #fff1f2;
    padding: 4px;
    border-radius: 8px;
  }

  .popover-play-btn {
    background: linear-gradient(90deg, #f43f5e, #ec4899);
    color: #ffffff;
    border: none;
    padding: 6px;
    border-radius: 12px;
    font-weight: 900;
    font-size: 0.8rem;
    cursor: pointer;
    margin-top: 4px;
  }

  .popover-close {
    position: absolute;
    top: 4px;
    right: 6px;
    background: none;
    border: none;
    font-weight: 900;
    color: #94a3b8;
    cursor: pointer;
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
    padding: 24px;
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
