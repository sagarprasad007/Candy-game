<script lang="ts">
  import { playerStore } from '$lib/stores/playerStore';

  const achievementsList = [
    {
      id: 'first_victory',
      title: 'First Victory',
      description: 'Complete your first match-3 level.',
      icon: '🏆',
    },
    {
      id: 'stellar_performance',
      title: 'Stellar Performance',
      description: 'Earn 3 stars on any level.',
      icon: '⭐',
    },
    {
      id: 'galaxy_conqueror',
      title: 'Galaxy Conqueror',
      description: 'Complete 5 or more levels.',
      icon: '🌌',
    },
  ];
</script>

<div class="achievements-screen">
  <div class="header">
    <h1>Trophies & Achievements</h1>
    <p>Unlock badges as you master cosmic gem matching!</p>
  </div>

  <div class="trophies-list">
    {#each achievementsList as ach}
      {@const isUnlocked = playerStore.progress.achievements.includes(ach.id)}
      <div class={`trophy-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
        <div class="icon">{ach.icon}</div>
        <div class="info">
          <h3>{ach.title}</h3>
          <p>{ach.description}</p>
        </div>
        <div class="status-badge">
          {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .achievements-screen {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .header h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 800;
  }

  .header p {
    margin: 4px 0 0 0;
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .trophies-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .trophy-card {
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: border-color 0.2s ease;
  }

  .trophy-card.unlocked {
    border-color: #facc15;
    box-shadow: 0 4px 15px rgba(250, 204, 21, 0.15);
  }

  .trophy-card.locked {
    opacity: 0.5;
  }

  .icon {
    font-size: 2.2rem;
  }

  .info {
    flex: 1;
  }

  .info h3 {
    margin: 0 0 4px 0;
    font-size: 1rem;
    color: #f8fafc;
  }

  .info p {
    margin: 0;
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .status-badge {
    font-size: 0.7rem;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
  }

  .unlocked .status-badge {
    background: rgba(250, 204, 21, 0.2);
    color: #facc15;
  }
</style>
