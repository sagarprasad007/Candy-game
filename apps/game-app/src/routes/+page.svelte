<script lang="ts">
  import { playerStore } from '$lib/stores/playerStore';
  import { LevelManager } from '$lib/game/level-manager';
  import { goto } from '$app/navigation';

  const levelManager = new LevelManager();
  const maxLevels = levelManager.getAllLevels().length;
  const currentLevelId = playerStore.progress.currentLevel;

  let showLivesModal = $state(false);

  function handleStartPlay() {
    if (playerStore.progress.lives > 0) {
      goto(`/game/${currentLevelId}`);
    } else {
      showLivesModal = true;
    }
  }

  function handleRestoreLife() {
    playerStore.restoreLife();
  }
</script>

{#if showLivesModal}
  <div class="modal-backdrop">
    <div class="modal-card">
      <div class="modal-icon">💔</div>
      <h3>Out of Lives!</h3>
      <p>Tap Restore to refill your energy or spin the Lucky Candy Wheel!</p>
      <div class="modal-actions">
        <button class="btn refill" onclick={() => { playerStore.restoreLife(); showLivesModal = false; }}>+ Quick Restore</button>
        <button class="btn close" onclick={() => showLivesModal = false}>Close</button>
      </div>
    </div>
  </div>
{/if}

<div class="home-container">
  <div class="candy-hero">
    <div class="hero-badge">🍬 SWEET & DELICIOUS</div>
    <h1 class="hero-title">CANDY KINGDOM</h1>
    <p class="hero-subtitle">Match colorful candies, make sweet combos, pop chocolate blocks and play through {maxLevels} fun levels!</p>

    <div class="stats-row">
      <div class="stat-box">
        <span class="stat-label">CURRENT LEVEL</span>
        <span class="stat-val">Level {currentLevelId}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">COMPLETED</span>
        <span class="stat-val">{playerStore.progress.completedLevels.length} / {maxLevels}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">TROPHIES</span>
        <span class="stat-val">🏆 {playerStore.progress.achievements.length}</span>
      </div>
    </div>

    <div class="cta-row">
      <button class="play-btn" onclick={handleStartPlay}>
        <span>🍭 PLAY LEVEL {currentLevelId}</span>
      </button>

      <a href="/levels" class="levels-btn">
        <span>🗺️ Select Level</span>
      </a>
    </div>
  </div>

  <div class="daily-challenge-card">
    <div class="dc-header">
      <div class="dc-title">📅 DAILY CANDY CHALLENGE</div>
      <div class="dc-badge">REWARD: 💰 100 COINS</div>
    </div>
    <p class="dc-desc">Complete today's sweet objective: Score 5,000 points in any level!</p>
    <button type="button" class="dc-btn" onclick={handleStartPlay}>
      ACCEPT CHALLENGE 🚀
    </button>
  </div>

  <div class="lives-card">
    <div class="lives-header">
      <span>Candy Lives</span>
      <span class="lives-num">❤️ {playerStore.progress.lives} / {playerStore.progress.maxLives}</span>
    </div>
    {#if playerStore.progress.lives < playerStore.progress.maxLives}
      <div class="refill-row">
        <span>Need more lives?</span>
        <button class="refill-btn" onclick={handleRestoreLife}>+ Quick Restore</button>
      </div>
    {/if}
  </div>

  <div class="candy-features">
    <div class="feat-box">
      <span class="feat-icon">🍬</span>
      <h3>Simple Matching</h3>
      <p>Click & swap adjacent candies to match 3 or more!</p>
    </div>
    <div class="feat-box">
      <span class="feat-icon">🍩</span>
      <h3>Special Candies</h3>
      <p>Match 4 or 5 for Striped Candies & Color Bomb Doughnuts!</p>
    </div>
    <div class="feat-box">
      <span class="feat-icon">🍫</span>
      <h3>Sweet Combos</h3>
      <p>Pop chocolate blocks & score points in cascade combos!</p>
    </div>
  </div>
</div>

<style>
  .home-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
  }

  .candy-hero {
    background: linear-gradient(135deg, #ffffff 0%, #fff1f2 100%);
    border: 3px solid #f472b6;
    border-radius: 28px;
    padding: 32px 24px;
    text-align: center;
    width: 100%;
    box-sizing: border-box;
    box-shadow: 0 12px 30px rgba(244, 114, 182, 0.25);
  }

  .hero-badge {
    display: inline-block;
    background: #fce7f3;
    color: #db2777;
    font-weight: 800;
    font-size: 0.8rem;
    padding: 6px 16px;
    border-radius: 20px;
    margin-bottom: 12px;
  }

  .hero-title {
    font-size: 2.8rem;
    font-weight: 900;
    margin: 0 0 10px 0;
    background: linear-gradient(90deg, #e11d48, #db2777, #9333ea);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero-subtitle {
    color: #881337;
    font-size: 1rem;
    margin: 0 0 24px 0;
    line-height: 1.4;
  }

  .stats-row {
    display: flex;
    justify-content: space-around;
    background: #fff5f8;
    padding: 14px;
    border-radius: 20px;
    border: 2px solid #fbcfe8;
    margin-bottom: 24px;
  }

  .stat-box {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-label {
    font-size: 0.7rem;
    color: #9f1239;
    font-weight: 800;
  }

  .stat-val {
    font-size: 1.1rem;
    font-weight: 900;
    color: #e11d48;
  }

  .cta-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .play-btn {
    background: linear-gradient(90deg, #f43f5e, #ec4899);
    border: none;
    color: #ffffff;
    padding: 16px 28px;
    border-radius: 20px;
    font-size: 1.25rem;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(244, 63, 94, 0.4);
    transition: transform 0.15s ease;
  }

  .play-btn:hover {
    transform: scale(1.03);
  }

  .levels-btn {
    background: #ffffff;
    border: 2px solid #f472b6;
    color: #be123c;
    padding: 12px;
    border-radius: 16px;
    text-decoration: none;
    font-weight: 800;
    font-size: 1rem;
  }

  .daily-challenge-card {
    width: 100%;
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border: 3px solid #f59e0b;
    border-radius: 24px;
    padding: 18px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 8px 20px rgba(245, 158, 11, 0.25);
  }

  .dc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dc-title {
    font-weight: 900;
    color: #92400e;
    font-size: 1.05rem;
  }

  .dc-badge {
    background: #ffffff;
    border: 2px solid #f59e0b;
    color: #b45309;
    font-weight: 900;
    font-size: 0.75rem;
    padding: 3px 10px;
    border-radius: 12px;
  }

  .dc-desc {
    margin: 0;
    font-weight: 700;
    color: #78350f;
    font-size: 0.9rem;
  }

  .dc-btn {
    background: linear-gradient(90deg, #d97706, #b45309);
    color: #ffffff;
    border: none;
    padding: 10px 18px;
    border-radius: 16px;
    font-weight: 900;
    font-size: 0.95rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(180, 83, 9, 0.3);
    align-self: flex-start;
  }

  .lives-card {
    width: 100%;
    background: #ffffff;
    border: 2px solid #fbcfe8;
    border-radius: 20px;
    padding: 16px 20px;
    box-sizing: border-box;
  }

  .lives-header {
    display: flex;
    justify-content: space-between;
    font-weight: 800;
    font-size: 1rem;
    color: #9f1239;
  }

  .refill-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
    font-size: 0.85rem;
    color: #be123c;
  }

  .refill-btn {
    background: #10b981;
    color: #ffffff;
    border: none;
    padding: 6px 14px;
    border-radius: 12px;
    font-weight: 800;
    cursor: pointer;
  }

  .candy-features {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    width: 100%;
  }

  .feat-box {
    background: #ffffff;
    border: 2px solid #fbcfe8;
    border-radius: 20px;
    padding: 16px 12px;
    text-align: center;
  }

  .feat-icon {
    font-size: 2rem;
  }

  .feat-box h3 {
    margin: 8px 0 4px 0;
    font-size: 0.9rem;
    color: #9f1239;
  }

  .feat-box p {
    margin: 0;
    font-size: 0.75rem;
    color: #881337;
    line-height: 1.3;
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  }

  .modal-card {
    background: #ffffff;
    border: 3px solid #f472b6;
    border-radius: 24px;
    padding: 24px;
    max-width: 360px;
    width: 100%;
    box-shadow: 0 15px 35px rgba(244, 114, 182, 0.3);
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  .modal-icon {
    font-size: 3rem;
  }

  .modal-card h3 {
    margin: 0;
    color: #e11d48;
    font-size: 1.3rem;
    font-weight: 900;
  }

  .modal-card p {
    margin: 0;
    color: #881337;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 8px;
    width: 100%;
  }

  .btn {
    padding: 10px 16px;
    border-radius: 16px;
    border: none;
    font-weight: 800;
    cursor: pointer;
  }

  .btn.refill {
    background: #10b981;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .btn.close {
    background: #e2e8f0;
    color: #475569;
  }
</style>
