<script lang="ts">
  import { playerStore } from '$lib/stores/playerStore';

  let playerTotalScore = $derived(
    Object.values(playerStore.progress.bestScores || {}).reduce((a, b) => a + b, 0) || playerStore.progress.totalPoints || 0
  );

  const leaderboardData = $derived([
    { rank: 1, name: 'Shital Baby 💖 (Kingdom Champion)', score: 28450, badge: '👑' },
    { rank: 2, name: 'YOU (Personal Best)', score: playerTotalScore, badge: '⭐', isUser: true },
    { rank: 3, name: 'Sugar Master 🍬', score: 24100, badge: '🥈' },
    { rank: 4, name: 'Candy Queen 🍭', score: 21850, badge: '🥉' },
    { rank: 5, name: 'Sweet Champ 🍩', score: 19200, badge: '✨' },
    { rank: 6, name: 'Choco Knight 🍫', score: 16500, badge: '🛡️' },
  ].sort((a, b) => b.score - a.score).map((item, idx) => ({ ...item, rank: idx + 1 })));
</script>

<div class="leaderboard-screen">
  <div class="header">
    <h1>👑 CANDY KINGDOM HALL OF FAME</h1>
    <p>Global Rankings & Personal Best Track (Real-time Updated!)</p>
  </div>

  <div class="user-stats-card">
    <div class="stat-item">
      <span class="lbl">YOUR TOTAL BEST SCORE</span>
      <span class="val">⭐ {playerTotalScore.toLocaleString()} pts</span>
    </div>
    <div class="stat-item">
      <span class="lbl">LEVELS COMPLETED</span>
      <span class="val">🏁 {playerStore.progress.completedLevels.length}</span>
    </div>
  </div>

  <div class="leaderboard-card">
    <div class="ranking-list">
      {#each leaderboardData as item}
        <div class="rank-row {item.rank === 1 ? 'rank-one' : ''} {item.isUser ? 'user-rank' : ''}">
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

  .user-stats-card {
    display: flex;
    justify-content: space-around;
    background: #ffffff;
    border: 3px solid #f472b6;
    border-radius: 20px;
    padding: 16px;
    box-shadow: 0 6px 16px rgba(244, 114, 182, 0.2);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .stat-item .lbl {
    font-size: 0.75rem;
    font-weight: 800;
    color: #9f1239;
  }

  .stat-item .val {
    font-size: 1.2rem;
    font-weight: 900;
    color: #e11d48;
  }

  .rank-row.user-rank {
    background: linear-gradient(90deg, #ec4899, #f43f5e);
    color: #ffffff;
    border-color: #be123c;
    box-shadow: 0 6px 18px rgba(244, 63, 94, 0.35);
  }

  .rank-row.user-rank .rank-num,
  .rank-row.user-rank .rank-name,
  .rank-row.user-rank .rank-score {
    color: #ffffff;
  }
</style>
