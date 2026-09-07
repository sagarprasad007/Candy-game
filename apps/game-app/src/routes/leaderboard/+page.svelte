<script lang="ts">
  import { playerStore } from '$lib/stores/playerStore';

  const leaderboardData = [
    { rank: 1, name: 'Shital Baby 💖', score: 28450, badge: '👑' },
    { rank: 2, name: 'Sugar Master 🍬', score: 24100, badge: '🥈' },
    { rank: 3, name: 'Candy Queen 🍭', score: 21850, badge: '🥉' },
    { rank: 4, name: 'Sweet Champ 🍩', score: 19200, badge: '✨' },
    { rank: 5, name: 'Choco Knight 🍫', score: 16500, badge: '⭐' },
  ];
</script>

<div class="leaderboard-screen">
  <div class="header">
    <h1>👑 CANDY LEADERBOARD</h1>
    <p>Top candy conquerors of the Kingdom!</p>
  </div>

  <div class="leaderboard-card">
    <div class="top-three-showcase">
      <div class="podium second">
        <div class="avatar">🥈</div>
        <div class="name">Sugar Master</div>
        <div class="score">24,100</div>
      </div>
      <div class="podium first">
        <div class="crown-pop">👑</div>
        <div class="avatar queen">💖</div>
        <div class="name queen-name">Shital Baby</div>
        <div class="score queen-score">28,450</div>
      </div>
      <div class="podium third">
        <div class="avatar">🥉</div>
        <div class="name">Candy Queen</div>
        <div class="score">21,850</div>
      </div>
    </div>

    <div class="ranking-list">
      {#each leaderboardData as item}
        <div class="rank-row {item.rank === 1 ? 'rank-one' : ''}">
          <span class="rank-num">#{item.rank}</span>
          <span class="rank-badge">{item.badge}</span>
          <span class="rank-name">{item.name}</span>
          <span class="rank-score">{item.score.toLocaleString()} pts</span>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .leaderboard-screen {
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

  .leaderboard-card {
    background: #ffffff;
    border: 4px solid #f472b6;
    border-radius: 28px;
    padding: 24px;
    box-shadow: 0 12px 30px rgba(244, 114, 182, 0.25);
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .top-three-showcase {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 16px;
    margin-top: 10px;
  }

  .podium {
    background: linear-gradient(135deg, #fff1f2, #ffe4e6);
    border: 2px solid #f472b6;
    border-radius: 20px;
    padding: 16px 12px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100px;
  }

  .podium.first {
    background: linear-gradient(135deg, #fce7f3, #fbcfe8);
    border: 3px solid #ec4899;
    transform: scale(1.15) translateY(-10px);
    box-shadow: 0 8px 25px rgba(236, 72, 153, 0.4);
    position: relative;
  }

  .crown-pop {
    position: absolute;
    top: -24px;
    font-size: 1.8rem;
    animation: floatCrown 1.5s infinite alternate ease-in-out;
  }

  @keyframes floatCrown {
    from { transform: translateY(0); }
    to { transform: translateY(-6px); }
  }

  .avatar {
    font-size: 2rem;
  }

  .name {
    font-size: 0.85rem;
    font-weight: 800;
    color: #881337;
    margin-top: 4px;
  }

  .queen-name {
    color: #db2777;
    font-size: 0.95rem;
  }

  .score {
    font-size: 0.8rem;
    font-weight: 900;
    color: #e11d48;
  }

  .queen-score {
    font-size: 0.95rem;
    color: #be123c;
  }

  .ranking-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .rank-row {
    display: flex;
    align-items: center;
    background: #fff5f8;
    border: 2px solid #fbcfe8;
    border-radius: 16px;
    padding: 12px 16px;
    gap: 12px;
  }

  .rank-row.rank-one {
    background: linear-gradient(90deg, #fff1f2, #fce7f3);
    border-color: #ec4899;
    box-shadow: 0 4px 15px rgba(236, 72, 153, 0.2);
  }

  .rank-num {
    font-weight: 900;
    color: #be123c;
    width: 30px;
  }

  .rank-badge {
    font-size: 1.3rem;
  }

  .rank-name {
    flex: 1;
    font-weight: 800;
    color: #881337;
  }

  .rank-score {
    font-weight: 900;
    color: #e11d48;
  }
</style>
