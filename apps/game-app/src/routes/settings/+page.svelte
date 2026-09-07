<script lang="ts">
  import { playerStore } from '$lib/stores/playerStore';
  import { soundFx } from '$lib/audio/sound';

  let soundOn = $state(playerStore.settings.soundEnabled);
  let musicOn = $state(playerStore.settings.musicEnabled);
  let animsOn = $state(playerStore.settings.animationsEnabled);

  function toggleSound() {
    soundOn = !soundOn;
    playerStore.settings.soundEnabled = soundOn;
    soundFx.enabled = soundOn;
    playerStore.saveSettings();
  }

  function toggleMusic() {
    musicOn = !musicOn;
    playerStore.settings.musicEnabled = musicOn;
    playerStore.saveSettings();
  }

  function toggleAnims() {
    animsOn = !animsOn;
    playerStore.settings.animationsEnabled = animsOn;
    playerStore.saveSettings();
  }

  function handleResetProgress() {
    if (confirm('Are you sure you want to reset all game progress and stars?')) {
      playerStore.resetAll();
      soundOn = playerStore.settings.soundEnabled;
      musicOn = playerStore.settings.musicEnabled;
      animsOn = playerStore.settings.animationsEnabled;
      alert('Game progress reset successfully!');
    }
  }
</script>

<div class="settings-screen">
  <div class="header">
    <h1>Game Settings</h1>
    <p>Configure preferences and manage storage</p>
  </div>

  <div class="settings-list">
    <div class="setting-item">
      <div class="label-info">
        <h3>Sound Effects</h3>
        <p>Synthesized Web Audio match and combo sounds</p>
      </div>
      <button class={`toggle-btn ${soundOn ? 'on' : 'off'}`} onclick={toggleSound}>
        {soundOn ? 'ON' : 'OFF'}
      </button>
    </div>

    <div class="setting-item">
      <div class="label-info">
        <h3>Ambient Music</h3>
        <p>Cosmic background audio ambience</p>
      </div>
      <button class={`toggle-btn ${musicOn ? 'on' : 'off'}`} onclick={toggleMusic}>
        {musicOn ? 'ON' : 'OFF'}
      </button>
    </div>

    <div class="setting-item">
      <div class="label-info">
        <h3>Animations</h3>
        <p>Tile falling and cascade pop animations</p>
      </div>
      <button class={`toggle-btn ${animsOn ? 'on' : 'off'}`} onclick={toggleAnims}>
        {animsOn ? 'ON' : 'OFF'}
      </button>
    </div>

    <div class="danger-zone">
      <h3>Data & Reset</h3>
      <p>Clear local storage saved scores, stars and unlocked levels</p>
      <button class="reset-btn" onclick={handleResetProgress}>Reset All Progress</button>
    </div>
  </div>
</div>

<style>
  .settings-screen {
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

  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .setting-item {
    background: rgba(30, 41, 59, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 14px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .label-info h3 {
    margin: 0 0 2px 0;
    font-size: 0.95rem;
    color: #f8fafc;
  }

  .label-info p {
    margin: 0;
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .toggle-btn {
    padding: 6px 16px;
    border-radius: 12px;
    font-weight: 800;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .toggle-btn.on {
    background: #10b981;
    color: #ffffff;
  }

  .toggle-btn.off {
    background: #475569;
    color: #cbd5e1;
  }

  .danger-zone {
    margin-top: 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 16px;
    padding: 16px;
  }

  .danger-zone h3 {
    margin: 0 0 4px 0;
    font-size: 1rem;
    color: #f87171;
  }

  .danger-zone p {
    margin: 0 0 12px 0;
    font-size: 0.8rem;
    color: #fca5a5;
  }

  .reset-btn {
    background: #ef4444;
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
  }
</style>
