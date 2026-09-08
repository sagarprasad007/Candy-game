<script lang="ts">
  import { playerStore } from '$lib/stores/playerStore';
  import { soundFx } from '$lib/audio/sound';

  let soundOn = $state(playerStore.settings.soundEnabled);
  let musicOn = $state(playerStore.settings.musicEnabled);
  let hapticsOn = $state(playerStore.settings.hapticsEnabled ?? true);
  let musicVolume = $state(playerStore.settings.musicVolume ?? 0.8);
  let animsOn = $state(playerStore.settings.animationsEnabled);
  let showResetConfirmModal = $state(false);
  let toastMsg = $state<string | null>(null);

  function toggleSound() {
    soundOn = !soundOn;
    playerStore.settings.soundEnabled = soundOn;
    soundFx.enabled = soundOn;
    playerStore.saveSettings();
  }

  function toggleMusic() {
    musicOn = !musicOn;
    playerStore.settings.musicEnabled = musicOn;
    soundFx.musicEnabled = musicOn;
    if (musicOn) soundFx.startBgm();
    else soundFx.stopBgm();
    playerStore.saveSettings();
  }

  function toggleHaptics() {
    hapticsOn = !hapticsOn;
    playerStore.settings.hapticsEnabled = hapticsOn;
    playerStore.saveSettings();
  }

  function updateVolume(val: number) {
    musicVolume = val;
    playerStore.settings.musicVolume = val;
    soundFx.setMusicVolume(val);
    playerStore.saveSettings();
  }

  function toggleAnims() {
    animsOn = !animsOn;
    playerStore.settings.animationsEnabled = animsOn;
    playerStore.saveSettings();
  }

  function confirmReset() {
    playerStore.resetAll();
    soundOn = playerStore.settings.soundEnabled;
    musicOn = playerStore.settings.musicEnabled;
    animsOn = playerStore.settings.animationsEnabled;
    soundFx.enabled = soundOn;
    soundFx.musicEnabled = musicOn;
    if (!musicOn) soundFx.stopBgm();
    showResetConfirmModal = false;
    toastMsg = 'Game progress reset successfully!';
    setTimeout(() => { toastMsg = null; }, 3000);
  }
</script>

{#if showResetConfirmModal}
  <div class="modal-backdrop">
    <div class="modal-card">
      <h3>⚠️ Reset All Progress?</h3>
      <p>Are you sure you want to clear all unlocked levels, stars, and saved scores?</p>
      <div class="modal-actions">
        <button class="btn cancel" onclick={() => showResetConfirmModal = false}>Cancel</button>
        <button class="btn confirm" onclick={confirmReset}>Yes, Reset All</button>
      </div>
    </div>
  </div>
{/if}

{#if toastMsg}
  <div class="toast-banner">{toastMsg}</div>
{/if}

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

    {#if musicOn}
      <div class="setting-item">
        <div class="label-info">
          <h3>BGM Volume</h3>
          <p>Adjust music volume intensity ({Math.round(musicVolume * 100)}%)</p>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={musicVolume}
          oninput={(e) => updateVolume(parseFloat(e.currentTarget.value))}
          class="volume-slider"
        />
      </div>
    {/if}

    <div class="setting-item">
      <div class="label-info">
        <h3>Haptic Vibration</h3>
        <p>Tactile feedback on candy swaps and match pops</p>
      </div>
      <button class={`toggle-btn ${hapticsOn ? 'on' : 'off'}`} onclick={toggleHaptics}>
        {hapticsOn ? 'ON' : 'OFF'}
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
      <button class="reset-btn" onclick={() => showResetConfirmModal = true}>Reset All Progress</button>
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
  }

  .modal-card h3 {
    margin: 0;
    color: #e11d48;
    font-size: 1.2rem;
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
  }

  .btn {
    padding: 10px 20px;
    border-radius: 16px;
    border: none;
    font-weight: 800;
    cursor: pointer;
  }

  .btn.cancel {
    background: #e2e8f0;
    color: #475569;
  }

  .btn.confirm {
    background: #ef4444;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }

  .volume-slider {
    accent-color: #ec4899;
    cursor: pointer;
    width: 100px;
  }

  .toast-banner {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #10b981;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 20px;
    font-weight: 800;
    box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
    z-index: 20000;
  }
</style>
