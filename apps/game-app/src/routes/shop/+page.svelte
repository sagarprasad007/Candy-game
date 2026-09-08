<script lang="ts">
  import { playerStore } from '$lib/stores/playerStore';

  let toastMsg = $state<string | null>(null);

  const SHOP_ITEMS = [
    {
      id: 'hammer',
      name: 'Lollipop Hammer',
      icon: '🔨',
      description: 'Smash any single tile or obstacle from the board without using a move.',
      cost: 50,
      count: 1,
    },
    {
      id: 'shuffle',
      name: 'Sweet Shuffle',
      icon: '🔀',
      description: 'Rearrange all candies on the board to unlock fresh match possibilities.',
      cost: 40,
      count: 1,
    },
    {
      id: 'extraMoves',
      name: 'Extra Moves',
      icon: '👟',
      description: 'Get +3 extra moves when launching a level for strategic advantage.',
      cost: 60,
      count: 1,
    },
  ];

  function buyItem(item: typeof SHOP_ITEMS[0]) {
    if ((playerStore.progress.coins || 0) < item.cost) {
      toastMsg = `❌ Not enough coins! Need 💰${item.cost} (You have 💰${playerStore.progress.coins || 0})`;
      setTimeout(() => { toastMsg = null; }, 2500);
      return;
    }

    playerStore.addCoins(-item.cost);
    playerStore.addBooster(item.id, item.count);
    toastMsg = `🎉 Purchased 1x ${item.name}!`;
    setTimeout(() => { toastMsg = null; }, 2500);
  }
</script>

{#if toastMsg}
  <div class="toast-banner">{toastMsg}</div>
{/if}

<div class="shop-screen">
  <div class="header">
    <h1>🛍️ CANDY BOOSTER SHOP</h1>
    <p>Spend your hard-earned coins to power up your game!</p>
    <div class="coin-badge">
      💰 <span class="coin-val">{playerStore.progress.coins || 0}</span> COINS
    </div>
  </div>

  <div class="shop-grid">
    {#each SHOP_ITEMS as item}
      <div class="shop-card">
        <div class="card-icon">{item.icon}</div>
        <div class="card-info">
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <div class="owned-tag">Owned: {playerStore.progress.boosters?.[item.id] || 0}</div>
        </div>
        <button type="button" class="buy-btn" onclick={() => buyItem(item)}>
          💰 {item.cost} Coins
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  .shop-screen {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .header {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .header h1 {
    margin: 0;
    font-size: 2.2rem;
    font-weight: 900;
    color: #e11d48;
  }

  .header p {
    margin: 0;
    font-size: 0.95rem;
    color: #9f1239;
  }

  .coin-badge {
    margin-top: 6px;
    background: #fef08a;
    border: 3px solid #eab308;
    color: #854d0e;
    padding: 6px 18px;
    border-radius: 20px;
    font-weight: 900;
    font-size: 1.1rem;
    box-shadow: 0 4px 12px rgba(234, 179, 8, 0.3);
  }

  .shop-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .shop-card {
    background: #ffffff;
    border: 3px solid #f472b6;
    border-radius: 24px;
    padding: 18px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 8px 20px rgba(244, 114, 182, 0.2);
    transition: transform 0.2s ease;
  }

  .shop-card:hover {
    transform: translateY(-2px);
    border-color: #f43f5e;
  }

  .card-icon {
    font-size: 2.8rem;
    background: #fff1f2;
    padding: 12px;
    border-radius: 20px;
  }

  .card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-info h3 {
    margin: 0;
    color: #881337;
    font-size: 1.1rem;
    font-weight: 900;
  }

  .card-info p {
    margin: 0;
    color: #9f1239;
    font-size: 0.8rem;
    line-height: 1.3;
  }

  .owned-tag {
    font-size: 0.75rem;
    font-weight: 800;
    color: #be185d;
  }

  .buy-btn {
    background: linear-gradient(90deg, #10b981, #059669);
    color: #ffffff;
    border: none;
    padding: 10px 18px;
    border-radius: 16px;
    font-weight: 900;
    font-size: 0.95rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    white-space: nowrap;
    transition: transform 0.15s ease;
  }

  .buy-btn:hover {
    transform: scale(1.05);
  }

  .toast-banner {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #881337;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 20px;
    font-weight: 800;
    box-shadow: 0 6px 18px rgba(136, 19, 55, 0.4);
    z-index: 20000;
  }
</style>
