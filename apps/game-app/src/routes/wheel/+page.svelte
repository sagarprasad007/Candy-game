<script lang="ts">
  import { soundFx } from '$lib/audio/sound';

  let isSpinning = $state(false);
  let rotationDeg = $state(0);
  let rewardMessage = $state('');

  const rewards = [
    { label: '💖 +1 Life', type: 'life', icon: '❤️' },
    { label: '🍬 Sweet Bonus', type: 'points', val: 500, icon: '🍬' },
    { label: '🍭 Sugar Blast', type: 'points', val: 1000, icon: '🍭' },
    { label: '🍩 Doughnut Prize', type: 'points', val: 1500, icon: '🍩' },
    { label: '⭐ Jackpot!', type: 'points', val: 2500, icon: '👑' },
    { label: '💖 +2 Lives', type: 'life', icon: '💕' },
  ];

  function handleSpin() {
    if (isSpinning) return;
    isSpinning = true;
    rewardMessage = '';

    soundFx.playSpecialSound();

    const randomRotations = 5 + Math.floor(Math.random() * 5);
    const prizeIndex = Math.floor(Math.random() * rewards.length);
    const targetDeg = randomRotations * 360 + prizeIndex * 60;

    rotationDeg = targetDeg;

    setTimeout(() => {
      isSpinning = false;
      const wonPrize = rewards[prizeIndex];
      rewardMessage = `🎉 You won: ${wonPrize.label}!`;
      soundFx.playWinSound();
    }, 3500);
  }
</script>

<div class="wheel-screen">
  <div class="header">
    <h1>🎡 DAILY LUCKY CANDY WHEEL</h1>
    <p>Spin the wheel every day for free sweet prizes and bonus lives!</p>
  </div>

  <div class="wheel-card">
    <div class="pointer">▼</div>

    <div
      class="wheel-disc"
      style="transform: rotate({rotationDeg}deg); transition: {isSpinning ? 'transform 3.5s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none'};"
    >
      {#each rewards as reward, idx}
        <div class="slice slice-{idx}">
          <span class="slice-icon">{reward.icon}</span>
        </div>
      {/each}
    </div>

    <button class="spin-btn {isSpinning ? 'spinning' : ''}" onclick={handleSpin} disabled={isSpinning}>
      {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL! 🎯'}
    </button>

    {#if rewardMessage}
      <div class="reward-banner">{rewardMessage}</div>
    {/if}
  </div>
</div>

<style>
  .wheel-screen {
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
  }

  .header h1 {
    margin: 0;
    font-size: 2.2rem;
    font-weight: 900;
    color: #e11d48;
    text-align: center;
  }

  .header p {
    margin: 4px 0 0 0;
    font-size: 0.95rem;
    color: #9f1239;
    text-align: center;
  }

  .wheel-card {
    background: #ffffff;
    border: 4px solid #f472b6;
    border-radius: 28px;
    padding: 32px 24px;
    box-shadow: 0 15px 35px rgba(244, 114, 182, 0.25);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
    max-width: 440px;
    box-sizing: border-box;
    position: relative;
  }

  .pointer {
    font-size: 2.2rem;
    color: #e11d48;
    z-index: 10;
    margin-bottom: -20px;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
  }

  .wheel-disc {
    width: 260px;
    height: 260px;
    border-radius: 50%;
    border: 6px solid #ec4899;
    box-shadow: 0 10px 25px rgba(236, 72, 153, 0.3);
    position: relative;
    overflow: hidden;
    background: radial-gradient(circle, #fff1f2 0%, #ffe4e6 100%);
  }

  .slice {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100px;
    height: 100px;
    margin-top: -50px;
    margin-left: -50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slice-0 { transform: rotate(0deg) translate(80px); }
  .slice-1 { transform: rotate(60deg) translate(80px); }
  .slice-2 { transform: rotate(120deg) translate(80px); }
  .slice-3 { transform: rotate(180deg) translate(80px); }
  .slice-4 { transform: rotate(240deg) translate(80px); }
  .slice-5 { transform: rotate(300deg) translate(80px); }

  .slice-icon {
    font-size: 2.2rem;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
  }

  .spin-btn {
    background: linear-gradient(90deg, #f43f5e, #ec4899);
    color: #ffffff;
    border: none;
    padding: 16px 32px;
    border-radius: 20px;
    font-size: 1.2rem;
    font-weight: 900;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(244, 63, 94, 0.4);
    transition: transform 0.15s ease;
  }

  .spin-btn:hover:not(:disabled) {
    transform: scale(1.05);
  }

  .spin-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .reward-banner {
    background: linear-gradient(90deg, #10b981, #059669);
    color: #ffffff;
    font-weight: 900;
    font-size: 1.1rem;
    padding: 12px 24px;
    border-radius: 18px;
    box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35);
    animation: popPrize 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  @keyframes popPrize {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
</style>
