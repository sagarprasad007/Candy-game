<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { playerStore } from '$lib/stores/playerStore';

  let levelId = $derived(parseInt(page.params.levelId || '1'));
  let status = $derived(page.url.searchParams.get('status') || 'won');
  let score = $derived(parseInt(page.url.searchParams.get('score') || '0'));
  let isWon = $derived(status === 'won');
  let stars = $derived(playerStore.progress.stars[levelId] || 1);

  let showLoveLetter = $state(false);

  function handleNextLevel() {
    if (levelId < 6) {
      goto(`/game/${levelId + 1}`);
    } else {
      goto('/levels');
    }
  }

  function handleReplay() {
    goto(`/game/${levelId}`);
  }

  function handleLevels() {
    goto('/levels');
  }
</script>

<div class="results-screen">
  <div class="result-card">
    <div class="header-badge">
      {isWon ? '🎉 LEVEL COMPLETE! 🎉' : '💔 LEVEL FAILED'}
    </div>

    {#if isWon}
      <div class="stars-row">
        <span class="star {stars >= 1 ? 'earned' : ''}">★</span>
        <span class="star {stars >= 2 ? 'earned' : ''}">★</span>
        <span class="star {stars >= 3 ? 'earned' : ''}">★</span>
      </div>

      <div class="score-display">
        <span class="score-label">TOTAL SCORE</span>
        <span class="score-val">{score.toLocaleString()}</span>
      </div>

      <p class="sweet-msg">Sweet victory! You solved the candy puzzle perfectly! 💕</p>

      <button class="love-letter-btn" onclick={() => showLoveLetter = true}>
        💌 Open Special Love Note For You! 💖
      </button>

      {#if showLoveLetter}
        <div class="love-letter-modal">
          <div class="letter-content">
            <div class="hearts-animation">💖 ✨ 💕 ✨ 💖</div>
            <h2>My Dearest Love,</h2>
            <p>
              Just like matching these sweet candies brings instant joy, every single moment with you fills my heart with endless sweetness and happiness. 
              You are my favorite person, my sweetest reward, and the brightest star in my world! 🍬✨
            </p>
            <p class="signature">Forever & Always Yours, ❤️</p>
            <button class="close-letter-btn" onclick={() => showLoveLetter = false}>Close Letter 💕</button>
          </div>
        </div>
      {/if}

      <div class="action-buttons">
        <button class="btn btn-primary" onclick={handleNextLevel}>
          Next Level ➔
        </button>
        <button class="btn btn-secondary" onclick={handleReplay}>
          Replay
        </button>
      </div>
    {:else}
      <div class="fail-icon">💥</div>
      <div class="score-display">
        <span class="score-label">SCORE</span>
        <span class="score-val">{score.toLocaleString()}</span>
      </div>
      <p class="fail-text">Out of moves! Don't worry, try again!</p>
      <div class="action-buttons">
        <button class="btn btn-primary" onclick={handleReplay}>
          Try Again
        </button>
        <button class="btn btn-secondary" onclick={handleLevels}>
          Levels Map
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .results-screen {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px 0;
  }

  .result-card {
    background: #ffffff;
    border: 4px solid #f472b6;
    border-radius: 28px;
    padding: 28px 24px;
    width: 100%;
    max-width: 440px;
    box-shadow: 0 15px 35px rgba(244, 114, 182, 0.3);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    box-sizing: border-box;
  }

  .header-badge {
    font-size: 1.5rem;
    font-weight: 900;
    color: #e11d48;
  }

  .stars-row {
    display: flex;
    gap: 8px;
  }

  .star {
    font-size: 3rem;
    color: #cbd5e1;
  }

  .star.earned {
    color: #fbbf24;
    text-shadow: 0 2px 10px rgba(251, 191, 36, 0.7);
  }

  .score-display {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .score-label {
    font-size: 0.8rem;
    font-weight: 800;
    color: #9f1239;
  }

  .score-val {
    font-size: 2.2rem;
    font-weight: 900;
    color: #ec4899;
  }

  .sweet-msg, .fail-text {
    font-size: 0.95rem;
    color: #881337;
    margin: 0;
  }

  .love-letter-btn {
    background: linear-gradient(90deg, #ec4899, #f43f5e);
    color: #ffffff;
    border: none;
    padding: 14px 20px;
    border-radius: 20px;
    font-size: 1rem;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(236, 72, 153, 0.4);
    animation: pulseHeart 1.5s infinite alternate;
  }

  @keyframes pulseHeart {
    from { transform: scale(1); }
    to { transform: scale(1.05); }
  }

  .love-letter-modal {
    position: fixed;
    inset: 0;
    background: rgba(136, 19, 55, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
  }

  .letter-content {
    background: linear-gradient(135deg, #fff1f2 0%, #ffffff 100%);
    border: 4px solid #f43f5e;
    border-radius: 28px;
    padding: 32px 24px;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    text-align: center;
    box-sizing: border-box;
  }

  .hearts-animation {
    font-size: 1.5rem;
    margin-bottom: 12px;
    animation: floatHearts 2s infinite ease-in-out;
  }

  @keyframes floatHearts {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .letter-content h2 {
    margin: 0 0 12px 0;
    color: #be123c;
    font-size: 1.6rem;
  }

  .letter-content p {
    color: #881337;
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .signature {
    font-weight: 900;
    font-size: 1.1rem;
    color: #e11d48;
  }

  .close-letter-btn {
    background: #f43f5e;
    color: #ffffff;
    border: none;
    padding: 10px 20px;
    border-radius: 14px;
    font-weight: 800;
    cursor: pointer;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    width: 100%;
    justify-content: center;
  }

  .btn {
    padding: 12px 24px;
    border-radius: 16px;
    font-weight: 800;
    font-size: 1rem;
    cursor: pointer;
    border: none;
  }

  .btn-primary {
    background: linear-gradient(90deg, #f43f5e, #ec4899);
    color: #ffffff;
  }

  .btn-secondary {
    background: #fce7f3;
    color: #be123c;
  }

  .fail-icon {
    font-size: 3rem;
  }
</style>
