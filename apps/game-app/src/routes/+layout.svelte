<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { fade } from 'svelte/transition';
  import { playerStore } from '$lib/stores/playerStore';
  import { soundFx } from '$lib/audio/sound';

  let { children } = $props();
  let isLoading = $state(true);

  onMount(async () => {
    if (typeof window !== 'undefined') {
      // Sync persistent audio settings before gameplay
      soundFx.enabled = playerStore.settings.soundEnabled;
      soundFx.musicEnabled = playerStore.settings.musicEnabled;
      if (soundFx.musicEnabled) {
        soundFx.startBgm();
      }

      // Gesture-backed AudioContext resume listener for browser autoplay restriction compliance
      const handleUserGesture = () => {
        soundFx.resumeContext();
        window.removeEventListener('pointerdown', handleUserGesture);
        window.removeEventListener('click', handleUserGesture);
      };
      window.addEventListener('pointerdown', handleUserGesture);
      window.addEventListener('click', handleUserGesture);

      try {
        // @ts-ignore
        const { defineCustomElement: defineGameBoard } = await import('@cosmic-gems/game-ui/dist/components/game-board.js');
        // @ts-ignore
        const { defineCustomElement: defineGameTile } = await import('@cosmic-gems/game-ui/dist/components/game-tile.js');
        // @ts-ignore
        const { defineCustomElement: defineGameScore } = await import('@cosmic-gems/game-ui/dist/components/game-score.js');
        // @ts-ignore
        const { defineCustomElement: defineLifeCounter } = await import('@cosmic-gems/game-ui/dist/components/life-counter.js');
        // @ts-ignore
        const { defineCustomElement: defineLevelCard } = await import('@cosmic-gems/game-ui/dist/components/level-card.js');
        // @ts-ignore
        const { defineCustomElement: defineGameModal } = await import('@cosmic-gems/game-ui/dist/components/game-modal.js');

        defineGameBoard();
        defineGameTile();
        defineGameScore();
        defineLifeCounter();
        defineLevelCard();
        defineGameModal();
      } catch (err) {
        console.warn('Stencil custom elements registration fallback:', err);
      } finally {
        isLoading = false;
      }
    }
  });
</script>

<svelte:head>
  <title>Candy Kingdom Adventure</title>
  <meta name="description" content="Vibrant and delightful Match-3 Candy Kingdom Puzzle Game built with SvelteKit and StencilJS." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">
</svelte:head>

{#if isLoading}
  <div class="loading-splash">
    <div class="splash-card">
      <span class="splash-candy">🍬</span>
      <h2>CANDY KINGDOM</h2>
      <p>Preparing sweet adventures...</p>
      <div class="spinner"></div>
    </div>
  </div>
{:else}
  <div class="candy-wrapper">
    <header class="top-nav">
      <a href="/" class="brand">
        <span class="logo-candy">🍬</span>
        <span class="brand-name">CANDY KINGDOM</span>
      </a>

      <nav class="nav-links">
        <a href="/levels">Levels</a>
        <a href="/shop">🛍️ Shop</a>
        <a href="/wheel">🎡 Wheel</a>
        <a href="/leaderboard">Leaderboard</a>
        <a href="/achievements">Trophies</a>
        <a href="/settings">Settings</a>
      </nav>

      <div class="user-pill">
        <span class="shital-greeting">Hi Shital Baby 💕</span>
        <span class="lives-count">❤️ {playerStore.progress.lives}</span>
      </div>
    </header>

    <main class="content-area">
      {#key page.url.pathname}
        <div in:fade={{ duration: 150 }} out:fade={{ duration: 100 }} class="route-transition-container">
          {@render children()}
        </div>
      {/key}
    </main>
  </div>
{/if}

<!-- Keep this OUTSIDE candy-wrapper to prevent backdrop-filter containing block issues -->
<nav class="mobile-bottom-nav">
  <a href="/" class="mobile-nav-item">
    <span class="icon">🏠</span>
    <span class="label">Home</span>
  </a>
  <a href="/levels" class="mobile-nav-item">
    <span class="icon">🗺️</span>
    <span class="label">Levels</span>
  </a>
  <a href="/shop" class="mobile-nav-item">
    <span class="icon">🛍️</span>
    <span class="label">Shop</span>
  </a>
  <a href="/wheel" class="mobile-nav-item">
    <span class="icon">🎡</span>
    <span class="label">Wheel</span>
  </a>
  <a href="/leaderboard" class="mobile-nav-item">
    <span class="icon">🏆</span>
    <span class="label">Rankings</span>
  </a>
  <a href="/settings" class="mobile-nav-item">
    <span class="icon">⚙️</span>
    <span class="label">Settings</span>
  </a>
</nav>

<style>
  :global(:root) {
    font-family: 'Fredoka', 'Outfit', sans-serif;
    background-color: #fff0f5;
    color: #4a154b;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #feada6 100%);
    min-height: 100vh;
  }

  .candy-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    max-width: 900px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 40px rgba(225, 29, 72, 0.15);
    border-left: 2px solid #f472b6;
    border-right: 2px solid #f472b6;
    padding-bottom: 70px; /* Space for mobile bottom bar */
  }

  @media (min-width: 640px) {
    .candy-wrapper {
      padding-bottom: 0;
    }
  }

  .top-nav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 20px;
    background: linear-gradient(90deg, #ec4899, #f43f5e);
    box-shadow: 0 4px 15px rgba(244, 63, 94, 0.3);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: #ffffff;
    font-weight: 800;
    font-size: 1.2rem;
    white-space: nowrap;
  }

  .logo-candy {
    font-size: 1.4rem;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  @media (max-width: 639px) {
    .nav-links {
      display: none; /* Hide top desktop links on mobile to clean up space */
    }
  }

  .nav-links a {
    color: #fff;
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 6px 10px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.2);
    white-space: nowrap;
    transition: all 0.15s ease;
  }

  .nav-links a:hover {
    background: #ffffff;
    color: #ec4899;
  }

  .shital-greeting {
    font-weight: 900;
    font-size: 0.85rem;
    white-space: nowrap;
    color: #e11d48;
    animation: shitalGlow 1.5s infinite alternate ease-in-out;
  }

  @keyframes shitalGlow {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(1.05);
    }
  }

  .user-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    color: #e11d48;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 800;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
  }

  .content-area {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
  }

  .route-transition-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  /* Bottom Navigation Bar - Permanently Fixed Always Visible */
  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: #ffffff;
    border-top: 2px solid #f472b6;
    box-shadow: 0 -4px 20px rgba(236, 72, 153, 0.2);
    z-index: 99999;
    justify-content: space-around;
    align-items: center;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .mobile-nav-item {
    flex: 1;
    height: 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: #881337;
    font-size: 0.7rem;
    font-weight: 700;
    gap: 2px;
    width: 100%;
    transition: background 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .mobile-nav-item:active {
    background: #ffe4e6;
    color: #ec4899;
  }

  .mobile-nav-item .icon {
    font-size: 1.1rem;
  }

  .loading-splash {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  }

  .splash-card {
    background: #ffffff;
    padding: 40px;
    border-radius: 24px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .splash-candy {
    font-size: 4rem;
    animation: pulse 1s infinite alternate;
  }

  .splash-card h2 {
    margin: 0;
    color: #e11d48;
    font-weight: 900;
  }

  .splash-card p {
    margin: 0;
    color: #9f1239;
    font-weight: 600;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 4px solid #fbcfe8;
    border-top: 4px solid #e11d48;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    100% { transform: scale(1.15); }
  }
</style>
