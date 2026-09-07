<script lang="ts">
  import { playerStore } from '$lib/stores/playerStore';
  import { soundFx } from '$lib/audio/sound';

  let { onClose }: { onClose: () => void } = $props();

  let claimed = $state(false);

  function claimReward() {
    if (claimed) return;
    claimed = true;
    playerStore.addCoins(250);
    playerStore.restoreLife(1);
    soundFx.playWinSound();
  }
</script>

<div class="modal-backdrop">
  <div class="modal-card">
    <button class="close-btn" onclick={onClose}>✕</button>
    <h2>📅 DAILY CHALLENGE</h2>
    <div class="challenge-box">
      <span class="icon">🍭</span>
      <div class="details">
        <h3>Sapphire Harvest</h3>
        <p>Match 20 Sapphire Candies in any level today!</p>
      </div>
    </div>

    <div class="reward-box">
      <h4>REWARD</h4>
      <div class="prizes">
        <span>💰 +250 Coins</span>
        <span>💖 +1 Extra Life</span>
      </div>
    </div>

    <button type="button" class="claim-btn {claimed ? 'claimed' : ''}" onclick={claimReward} disabled={claimed}>
      {claimed ? 'CLAIMED! 🎉' : 'CLAIM REWARD! 🎁'}
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
    max-width: 400px;
    width: 100%;
    box-shadow: 0 15px 35px rgba(244, 114, 182, 0.3);
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    position: relative;
  }

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    font-size: 1.2rem;
    font-weight: 900;
    color: #9f1239;
    cursor: pointer;
  }

  .modal-card h2 {
    margin: 0;
    color: #e11d48;
    font-weight: 900;
    font-size: 1.5rem;
  }

  .challenge-box {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #fff1f2;
    border: 2px solid #fecdd3;
    border-radius: 20px;
    padding: 16px;
    width: 100%;
    box-sizing: border-box;
  }

  .challenge-box .icon {
    font-size: 2.5rem;
  }

  .details h3 {
    margin: 0 0 4px 0;
    color: #881337;
    font-weight: 800;
  }

  .details p {
    margin: 0;
    color: #9f1239;
    font-size: 0.9rem;
  }

  .reward-box {
    background: #fdf2f8;
    border: 2px dashed #ec4899;
    border-radius: 18px;
    padding: 12px 16px;
    width: 100%;
    text-align: center;
    box-sizing: border-box;
  }

  .reward-box h4 {
    margin: 0 0 6px 0;
    color: #be123c;
    font-size: 0.85rem;
    font-weight: 900;
  }

  .prizes {
    display: flex;
    justify-content: space-around;
    font-weight: 800;
    color: #881337;
  }

  .claim-btn {
    width: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    color: #ffffff;
    border: none;
    padding: 14px 28px;
    border-radius: 20px;
    font-size: 1.1rem;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35);
  }

  .claim-btn.claimed {
    background: #9ca3af;
    box-shadow: none;
    cursor: not-allowed;
  }
</style>
