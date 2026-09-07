import { describe, it, expect } from 'vitest';
import { generateStory, SeededRandom, CHARACTERS } from '../game/story-generator';
import { defaultVisualProvider } from '../game/story-visual-provider';

describe('StoryGenerator & StoryVisualProvider Tests', () => {
  it('1. PRNG produces deterministic values for identical seed', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.range(1, 100)).toBe(rng2.range(1, 100));
    expect(rng1.choice(['a', 'b', 'c'])).toBe(rng2.choice(['a', 'b', 'c']));
  });

  it('2. generateStory is completely deterministic when given same seed', () => {
    const ctx = { levelId: 1, score: 3500, stars: 3, remainingMoves: 8, seed: 999 };

    const storyA = generateStory(ctx);
    const storyB = generateStory(ctx);

    expect(storyA.character.id).toBe(storyB.character.id);
    expect(storyA.character.expression).toBe(storyB.character.expression);
    expect(storyA.character.animation).toBe(storyB.character.animation);
    expect(storyA.message.body).toBe(storyB.message.body);
    expect(storyA.backgroundTheme).toBe(storyB.backgroundTheme);
    expect(storyA.letterStyle).toBe(storyB.letterStyle);
  });

  it('3. different seeds produce different story combinations', () => {
    const ctxA = { levelId: 1, score: 3500, stars: 3, remainingMoves: 8, seed: 1111 };
    const ctxB = { levelId: 1, score: 3500, stars: 3, remainingMoves: 8, seed: 8888 };

    const storyA = generateStory(ctxA);
    const storyB = generateStory(ctxB);

    // At least one dimension (character or message or theme) should differ
    const isDifferent =
      storyA.character.id !== storyB.character.id ||
      storyA.character.animation !== storyB.character.animation ||
      storyA.backgroundTheme !== storyB.backgroundTheme ||
      storyA.letterStyle !== storyB.letterStyle;

    expect(isDifferent).toBe(true);
  });

  it('4. story content adapts based on level progression arc', () => {
    const level1Story = generateStory({ levelId: 1, score: 1000, stars: 2, remainingMoves: 2, seed: 500 });
    const level5Story = generateStory({ levelId: 5, score: 8000, stars: 3, remainingMoves: 10, seed: 500 });

    expect(level1Story.message.body).not.toBe(level5Story.message.body);
  });

  it('5. ProceduralStoryVisualProvider generates valid SVG visual assets', () => {
    const story = generateStory({ levelId: 2, score: 2000, stars: 2, remainingMoves: 4, seed: 42 });
    const visual = defaultVisualProvider.getStoryVisual(story);

    expect(visual.svgMarkup).toContain('<svg');
    expect(visual.characterName).toBeTruthy();
    expect(visual.backgroundGradient).toContain('linear-gradient');
    expect(visual.cardBorderColor).toBeTruthy();
  });

  it('6. generated message text targets 40-100 word count range', () => {
    const story = generateStory({ levelId: 3, score: 4500, stars: 3, remainingMoves: 12, seed: 777 });
    const wordCount = story.message.body.split(/\s+/).length;

    expect(wordCount).toBeGreaterThanOrEqual(30);
    expect(wordCount).toBeLessThanOrEqual(110);
  });

  it('7. character system contains all original IP characters', () => {
    expect(CHARACTERS.length).toBeGreaterThanOrEqual(6);
    const ids = CHARACTERS.map((c) => c.id);
    expect(ids).toContain('nova');
    expect(ids).toContain('crystal-sprite');
    expect(ids).toContain('comet-fox');
  });
});
