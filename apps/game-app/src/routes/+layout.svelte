<script lang="ts">
  import { onMount } from 'svelte';
  import { playerStore } from '$lib/stores/playerStore';

  let { children } = $props();

  onMount(async () => {
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore
        const { defineCustomElements } = await import('@cosmic-gems/game-ui/loader/index.js');
        defineCustomElements(window);
      } catch (err) {
        console.warn('Stencil custom elements registration fallback:', err);
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

<div class="candy-wrapper">
  <header class="top-nav">
    <a href="/" class="brand">
      <span class="logo-candy">🍬</span>
      <span class="brand-name">CANDY KINGDOM</span>
    </a>

    <nav class="nav-links">
      <a href="/levels">Levels</a>
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
    {@render children()}
  </main>
</div>

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
    padding: 24px;
    display: flex;
    flex-direction: column;
  }
</style>
