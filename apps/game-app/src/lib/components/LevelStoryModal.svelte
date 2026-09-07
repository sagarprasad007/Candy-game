<script lang="ts">
  import { onMount } from 'svelte';
  import type { GeneratedStory } from '../game/story-generator';
  import { defaultVisualProvider } from '../game/story-visual-provider';
  import { soundFx } from '../audio/sound';

  let {
    story,
    onContinue,
  }: {
    story: GeneratedStory;
    onContinue: () => void;
  } = $props();

  let isRevealed = $state(false);
  let isEnvelopeOpened = $state(false);
  let isTextFinished = $state(false);
  let prefersReducedMotion = $state(false);

  const visualAsset = $derived(defaultVisualProvider.getStoryVisual(story));

  onMount(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    if (prefersReducedMotion) {
      isEnvelopeOpened = true;
      isRevealed = true;
      isTextFinished = true;
      return;
    }

    // Sequence timeline
    const t1 = setTimeout(() => {
      isEnvelopeOpened = true;
      soundFx.playEnvelopeSound();
    }, 400);

    const t2 = setTimeout(() => {
      isRevealed = true;
      soundFx.playSparkleSound();
    }, 800);

    const t3 = setTimeout(() => {
      isTextFinished = true;
    }, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  });

  function handleSkipOrFastForward() {
    if (!isTextFinished) {
      isEnvelopeOpened = true;
      isRevealed = true;
      isTextFinished = true;
      soundFx.playSparkleSound();
    } else {
      onContinue();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="story-backdrop"
  role="dialog"
  tabindex="-1"
  aria-modal="true"
  aria-labelledby="story-modal-title"
  style="background: {visualAsset.backgroundGradient};"
  onclick={handleSkipOrFastForward}
>
  <div class="story-container">
    <!-- Floating Background Particles -->
    <div class="particles-layer">
      {#each Array(12) as _, i}
        <span
          class="floating-particle"
          style="left: {(i * 8.3) % 100}%; animation-delay: {i * 0.3}s;"
        >
          {visualAsset.particleEmoji}
        </span>
      {/each}
    </div>

    <!-- Cartoon Character Section -->
    <div class="character-box anim-{story.character.animation}">
      <div class="svg-wrapper">
        {@html visualAsset.svgMarkup}
      </div>
      <div class="character-badge" style="background: {visualAsset.primaryColor};">
        <span class="badge-emoji">{story.character.badgeEmoji}</span>
        <span class="character-name">{story.character.name}</span>
      </div>
    </div>

    <!-- Envelope / Letter Reveal Card -->
    <div class="card-area">
      {#if !isEnvelopeOpened && !prefersReducedMotion}
        <div class="envelope-box">
          <div class="envelope-seal">💌</div>
          <p class="envelope-text">A message from {story.character.name}...</p>
        </div>
      {/if}

      {#if isEnvelopeOpened}
        <div
          class="letter-card style-{story.letterStyle} {isRevealed ? 'revealed' : ''}"
          style="border-color: {visualAsset.cardBorderColor};"
        >
          <div class="card-header">
            <span class="realm-tag">✨ COSMIC STARLIGHT QUEST ✨</span>
            <h2 id="story-modal-title" class="letter-greeting">{story.message.greeting}</h2>
          </div>

          <div class="letter-body">
            <p class="letter-text">{story.message.body}</p>
          </div>

          <div class="letter-footer">
            <span class="letter-signoff">{story.message.signoff}</span>
            <span class="letter-sender">— {story.message.sender}</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Interactive Actions -->
    <div class="actions-bar">
      <button
        type="button"
        class="continue-btn"
        onclick={(e) => {
          e.stopPropagation();
          onContinue();
        }}
        aria-label="Continue to level results"
      >
        <span>Continue</span>
        <span class="btn-arrow">➔</span>
      </button>

      {#if !isTextFinished}
        <span class="tap-hint">Tap anywhere to skip</span>
      {/if}
    </div>
  </div>
</div>

<style>
  .story-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
    box-sizing: border-box;
    overflow-y: auto;
    animation: fadeIn 0.4s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .story-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
    max-width: 440px;
    position: relative;
    z-index: 10;
  }

  .particles-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .floating-particle {
    position: absolute;
    bottom: -20px;
    font-size: 1.2rem;
    opacity: 0.7;
    animation: floatUp 4s infinite linear;
  }

  @keyframes floatUp {
    0% { transform: translateY(0) scale(0.8); opacity: 0; }
    30% { opacity: 0.8; }
    100% { transform: translateY(-400px) scale(1.2); opacity: 0; }
  }

  .character-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 120px;
    height: 120px;
    position: relative;
  }

  .svg-wrapper {
    width: 90px;
    height: 90px;
    filter: drop-shadow(0 6px 15px rgba(0,0,0,0.3));
  }

  .character-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 16px;
    color: #ffffff;
    font-weight: 800;
    font-size: 0.85rem;
    box-shadow: 0 4px 10px rgba(0,0,0,0.25);
  }

  /* Character Animations */
  .anim-bounce { animation: charBounce 1.2s infinite alternate ease-in-out; }
  .anim-wave { animation: charWave 1.4s infinite alternate ease-in-out; }
  .anim-jump { animation: charJump 1s infinite cubic-bezier(0.175, 0.885, 0.32, 1.275); }
  .anim-spin { animation: charSpin 2s infinite ease-in-out; }
  .anim-celebrate { animation: charCelebrate 0.8s infinite alternate ease-in-out; }
  .anim-sparkle { animation: charSparkle 1.5s infinite alternate ease-in-out; }

  @keyframes charBounce { from { transform: translateY(0); } to { transform: translateY(-12px); } }
  @keyframes charWave { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
  @keyframes charJump { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px) scale(1.05); } }
  @keyframes charSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes charCelebrate { from { transform: scale(0.95); } to { transform: scale(1.1) rotate(3deg); } }
  @keyframes charSparkle { from { filter: brightness(1); } to { filter: brightness(1.3) drop-shadow(0 0 12px #fbbf24); } }

  .card-area {
    width: 100%;
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .envelope-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    background: #ffffff;
    border: 3px dashed #f472b6;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.25);
    animation: envelopePulse 0.8s infinite alternate ease-in-out;
  }

  .envelope-seal { font-size: 3rem; }
  .envelope-text { color: #881337; font-weight: 800; font-size: 0.95rem; margin: 0; }

  @keyframes envelopePulse {
    from { transform: scale(0.98); }
    to { transform: scale(1.03); }
  }

  .letter-card {
    background: #ffffff;
    border: 4px solid #f472b6;
    border-radius: 24px;
    padding: 20px;
    width: 100%;
    box-shadow: 0 15px 35px rgba(0,0,0,0.3);
    box-sizing: border-box;
    opacity: 0;
    transform: translateY(20px) scale(0.95);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .letter-card.revealed {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  .card-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    border-bottom: 2px dashed #f472b6;
    padding-bottom: 10px;
    margin-bottom: 12px;
  }

  .realm-tag {
    font-size: 0.7rem;
    font-weight: 800;
    color: #9f1239;
    letter-spacing: 0.05em;
  }

  .letter-greeting {
    font-size: 1.15rem;
    font-weight: 900;
    color: #ec4899;
    margin: 0;
    text-align: center;
  }

  .letter-body {
    margin-bottom: 14px;
  }

  .letter-text {
    font-size: 0.92rem;
    line-height: 1.5;
    color: #334155;
    font-weight: 600;
    margin: 0;
    text-align: left;
  }

  .letter-footer {
    display: flex;
    flex-direction: column;
    align-items: stroke-end;
    text-align: right;
    border-top: 1px solid #f1f5f9;
    padding-top: 8px;
  }

  .letter-signoff { font-size: 0.8rem; font-style: italic; color: #64748b; }
  .letter-sender { font-size: 0.88rem; font-weight: 800; color: #e11d48; }

  .actions-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .continue-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 14px 28px;
    background: linear-gradient(90deg, #ec4899, #f43f5e);
    color: #ffffff;
    font-weight: 900;
    font-size: 1.1rem;
    border: none;
    border-radius: 24px;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(244, 63, 94, 0.4);
    transition: transform 0.15s ease;
  }

  .continue-btn:active {
    transform: scale(0.96);
  }

  .btn-arrow {
    font-size: 1.2rem;
    transition: transform 0.2s ease;
  }

  .continue-btn:hover .btn-arrow {
    transform: translateX(4px);
  }

  .tap-hint {
    font-size: 0.75rem;
    color: #ffffff;
    opacity: 0.8;
    font-weight: 600;
  }
</style>
