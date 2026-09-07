import type { GeneratedStory } from './story-generator';

export interface StoryVisualAsset {
  svgMarkup: string;
  characterName: string;
  expression: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundGradient: string;
  cardBorderColor: string;
  particleEmoji: string;
}

export interface StoryVisualProvider {
  getStoryVisual(story: GeneratedStory): StoryVisualAsset;
}

export class ProceduralStoryVisualProvider implements StoryVisualProvider {
  getStoryVisual(story: GeneratedStory): StoryVisualAsset {
    const char = story.character;

    // Background gradient mapping per theme
    let bgGradient = 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)';
    let borderColor = '#f472b6';
    let particle = '✨';

    switch (story.backgroundTheme) {
      case 'starlight-valley':
        bgGradient = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)';
        borderColor = '#fbbf24';
        particle = '⭐';
        break;
      case 'nebula-woods':
        bgGradient = 'linear-gradient(135deg, #2e1065 0%, #581c87 50%, #7e22ce 100%)';
        borderColor = '#c084fc';
        particle = '🌌';
        break;
      case 'crystal-cavern':
        bgGradient = 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)';
        borderColor = '#34d399';
        particle = '💎';
        break;
      case 'cosmic-garden':
        bgGradient = 'linear-gradient(135deg, #831843 0%, #be185d 50%, #e11d48 100%)';
        borderColor = '#f472b6';
        particle = '🌺';
        break;
      case 'moonlight-bay':
        bgGradient = 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)';
        borderColor = '#38bdf8';
        particle = '🌙';
        break;
    }

    return {
      svgMarkup: char.svgData,
      characterName: char.name,
      expression: char.expression,
      primaryColor: char.primaryColor,
      secondaryColor: char.secondaryColor,
      backgroundGradient: bgGradient,
      cardBorderColor: borderColor,
      particleEmoji: particle,
    };
  }
}

export const defaultVisualProvider = new ProceduralStoryVisualProvider();
