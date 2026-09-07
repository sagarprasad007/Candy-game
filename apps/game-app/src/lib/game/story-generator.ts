// Mulberry32 deterministic random number generator
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  // Returns float in [0, 1)
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns integer in [min, max] inclusive
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Picks random element from array
  choice<T>(arr: T[]): T {
    return arr[this.range(0, arr.length - 1)];
  }
}

export type CharacterExpression = 'happy' | 'excited' | 'curious' | 'proud' | 'winking' | 'mysterious';
export type CharacterAnimation = 'bounce' | 'wave' | 'jump' | 'spin' | 'celebrate' | 'peek' | 'fly' | 'sparkle';
export type BackgroundTheme = 'starlight-valley' | 'nebula-woods' | 'crystal-cavern' | 'cosmic-garden' | 'moonlight-bay';
export type LetterStyle = 'parchment' | 'cosmic-star' | 'crystal-gem' | 'nebula-glow';
export type RevealStyle = 'envelope-unfold' | 'character-handout' | 'crystal-portal' | 'star-fade';

export interface StoryCharacter {
  id: string;
  name: string;
  type: string;
  title: string;
  expression: CharacterExpression;
  animation: CharacterAnimation;
  primaryColor: string;
  secondaryColor: string;
  badgeEmoji: string;
  svgData: string;
}

export interface StoryMessage {
  sender: string;
  greeting: string;
  body: string;
  signoff: string;
  mood: string;
  decoration: string;
}

export interface StoryContext {
  levelId: number;
  score: number;
  stars: number;
  remainingMoves: number;
  comboCount?: number;
  seed?: number;
}

export interface GeneratedStory {
  seed: number;
  character: StoryCharacter;
  message: StoryMessage;
  backgroundTheme: BackgroundTheme;
  letterStyle: LetterStyle;
  revealStyle: RevealStyle;
  particleType: 'stars' | 'sparkles' | 'hearts' | 'crystals';
  context: StoryContext;
}

export const CHARACTERS: Omit<StoryCharacter, 'expression' | 'animation'>[] = [
  {
    id: 'nova',
    name: 'Nova',
    type: 'Star Explorer',
    title: 'Chief Celestial Navigator',
    primaryColor: '#f59e0b',
    secondaryColor: '#fef08a',
    badgeEmoji: '⭐',
    svgData: `<svg viewBox="0 0 100 100" class="character-svg"><circle cx="50" cy="45" r="30" fill="#f59e0b"/><polygon points="50,5 60,30 85,30 65,45 72,70 50,55 28,70 35,45 15,30 40,30" fill="#fbbf24" opacity="0.4"/><circle cx="40" cy="40" r="4" fill="#1e293b"/><circle cx="60" cy="40" r="4" fill="#1e293b"/><path d="M 42 52 Q 50 60 58 52" stroke="#1e293b" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="20" rx="10" ry="4" fill="#fef08a"/></svg>`,
  },
  {
    id: 'crystal-sprite',
    name: 'Glimmer',
    type: 'Crystal Guardian',
    title: 'Keeper of Prism Jewels',
    primaryColor: '#ec4899',
    secondaryColor: '#fbcfe8',
    badgeEmoji: '💎',
    svgData: `<svg viewBox="0 0 100 100" class="character-svg"><polygon points="50,15 80,40 65,85 35,85 20,40" fill="#ec4899"/><polygon points="50,15 65,40 50,85 35,40" fill="#f472b6" opacity="0.6"/><circle cx="42" cy="42" r="3.5" fill="#ffffff"/><circle cx="58" cy="42" r="3.5" fill="#ffffff"/><circle cx="42" cy="42" r="2" fill="#831843"/><circle cx="58" cy="42" r="2" fill="#831843"/><path d="M 44 54 Q 50 60 56 54" stroke="#831843" stroke-width="2.5" fill="none"/></svg>`,
  },
  {
    id: 'comet-fox',
    name: 'Vixen',
    type: 'Comet Fox',
    title: 'Starlight Trail Scout',
    primaryColor: '#f97316',
    secondaryColor: '#ffedd5',
    badgeEmoji: '🦊',
    svgData: `<svg viewBox="0 0 100 100" class="character-svg"><polygon points="20,20 35,45 10,45" fill="#ea580c"/><polygon points="80,20 90,45 65,45" fill="#ea580c"/><circle cx="50" cy="55" r="32" fill="#f97316"/><polygon points="50,55 30,85 70,85" fill="#ffffff"/><circle cx="40" cy="48" r="4" fill="#431407"/><circle cx="60" cy="48" r="4" fill="#431407"/><circle cx="50" cy="62" r="3" fill="#431407"/></svg>`,
  },
  {
    id: 'nebula-bunny',
    name: 'Pip',
    type: 'Nebula Bunny',
    title: 'Cosmic Meadow Hopper',
    primaryColor: '#a855f7',
    secondaryColor: '#f3e8ff',
    badgeEmoji: '🐰',
    svgData: `<svg viewBox="0 0 100 100" class="character-svg"><ellipse cx="38" cy="22" rx="7" ry="20" fill="#c084fc"/><ellipse cx="62" cy="22" rx="7" ry="20" fill="#c084fc"/><ellipse cx="38" cy="22" rx="4" ry="14" fill="#f3e8ff"/><ellipse cx="62" cy="22" rx="4" ry="14" fill="#f3e8ff"/><circle cx="50" cy="58" r="30" fill="#a855f7"/><circle cx="40" cy="52" r="4" fill="#3b0764"/><circle cx="60" cy="52" r="4" fill="#3b0764"/><polygon points="50,59 46,63 54,63" fill="#3b0764"/></svg>`,
  },
  {
    id: 'orbit-bot',
    name: 'Sparky',
    type: 'Orbit Bot',
    title: 'Starlight Engine Droid',
    primaryColor: '#0ea5e9',
    secondaryColor: '#e0f2fe',
    badgeEmoji: '🤖',
    svgData: `<svg viewBox="0 0 100 100" class="character-svg"><line x1="50" y1="10" x2="50" y2="25" stroke="#0ea5e9" stroke-width="4"/><circle cx="50" cy="8" r="5" fill="#ef4444"/><rect x="20" y="25" width="60" height="50" rx="14" fill="#0ea5e9"/><rect x="28" y="35" width="44" height="22" rx="6" fill="#0f172a"/><circle cx="40" cy="46" r="4" fill="#38bdf8"/><circle cx="60" cy="46" r="4" fill="#38bdf8"/><path d="M 40 64 L 60 64" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'moon-moth',
    name: 'Luna',
    type: 'Moon Moth',
    title: 'Night Sky Whisperer',
    primaryColor: '#10b981',
    secondaryColor: '#d1fae5',
    badgeEmoji: '🦋',
    svgData: `<svg viewBox="0 0 100 100" class="character-svg"><path d="M 50 50 Q 15 15 10 50 Q 20 80 50 60" fill="#34d399" opacity="0.85"/><path d="M 50 50 Q 85 15 90 50 Q 80 80 50 60" fill="#34d399" opacity="0.85"/><ellipse cx="50" cy="55" rx="8" ry="25" fill="#065f46"/><circle cx="46" cy="42" r="2.5" fill="#ffffff"/><circle cx="54" cy="42" r="2.5" fill="#ffffff"/></svg>`,
  },
];

// Narrative story templates by level progression arc
const STORY_ARCS: Record<number, { title: string; templates: { greeting: string; body: string; signoff: string }[] }> = {
  // Arc 1: Discovery (Levels 1–2)
  1: {
    title: 'Discovery of the Cosmic Gate',
    templates: [
      {
        greeting: 'Greetings, Brave Explorer!',
        body: 'The ancient Starlight Gate has glowed for the first time in a thousand orbits. Your sharp matching skills unlocked the first crystal crest! Beyond this portal lies the enchanted Starlight Valley.',
        signoff: 'May stars guide your path,',
      },
      {
        greeting: 'Salutations, Star Traveler!',
        body: 'Look! The blue gems you cleared lit up the celestial beacons along the valley trail. The ancient guardians have noticed your journey.',
        signoff: 'With cosmic excitement,',
      },
    ],
  },
  2: {
    title: 'Crossing Starlight Valley',
    templates: [
      {
        greeting: 'Incredible Victory!',
        body: 'You navigated the crystal maze of Starlight Valley with ease! A mysterious comet trail has appeared in the sky, leading toward the Nebula Woods.',
        signoff: 'Until our paths cross again,',
      },
      {
        greeting: 'Dear Adventurer,',
        body: 'The valley is glowing brighter tonight thanks to your victory. I spotted a little comet fox watching your moves from the high ridge!',
        signoff: 'Shining bright,',
      },
    ],
  },

  // Arc 2: Mystery (Levels 3–4)
  3: {
    title: 'The Whispering Nebula',
    templates: [
      {
        greeting: 'Halt, Wanderer!',
        body: 'We have entered the deep Nebula Woods. Strange sparkling mist hovers over the paths, but your spectacular match combinations cleared the shadowy ice blockers!',
        signoff: 'Ever watchful,',
      },
      {
        greeting: 'Fascinating Achievement!',
        body: 'The starlight beams you triggered exposed a hidden map carved into the ancient moonstones. Something grand is buried near Level 5!',
        signoff: 'With mysterious curiosity,',
      },
    ],
  },
  4: {
    title: 'Echoes of the Crystal Cavern',
    templates: [
      {
        greeting: 'Astonishing Skill!',
        body: 'The entrance to the Crystal Cavern was frozen solid, but your line blasts shattered the obstacles into sparkling dust. The core crystal is pulsating with warm energy!',
        signoff: 'Deep from the caverns,',
      },
      {
        greeting: 'Hail, Gem Master!',
        body: 'Deep inside the cavern, ancient inscriptions tell of a legendary Prism Gem capable of illuminating the entire Cosmic Kingdom.',
        signoff: 'Guarding the secrets,',
      },
    ],
  },

  // Arc 3: Revelation & Triumph (Levels 5–6+)
  5: {
    title: 'The Awakening of the Prism Core',
    templates: [
      {
        greeting: 'Magnificent Triumph!',
        body: 'The Prism Core has fully awakened! Radiant waves of rainbow energy are flowing through every realm of the kingdom, banishing the dark frost forever.',
        signoff: 'In awe of your power,',
      },
      {
        greeting: 'Glorious Victory, Champion!',
        body: 'Your mastery over special gem combinations unlocked the sanctuary gates. All the star creatures of the realm are celebrating your heroic feat tonight!',
        signoff: 'Forever grateful,',
      },
    ],
  },
  6: {
    title: 'Crown of the Starlight Realm',
    templates: [
      {
        greeting: 'Legendary Hero of Cosmic Gems!',
        body: 'You have conquered the final challenge of the Starlight Realm! The night sky is ablaze with fireworks and celestial praise. You are the true Gem Legend!',
        signoff: 'With eternal honor,',
      },
      {
        greeting: 'Dearest Crowned Champion,',
        body: 'Every constellation now spells your name across the heavens. Thank you for restoring light, joy, and sweetness to the Cosmic Kingdom!',
        signoff: 'Your loyal companions of Starlight,',
      },
    ],
  },
};

export function generateStory(context: StoryContext): GeneratedStory {
  const seed = context.seed ?? Math.floor(context.levelId * 1000 + context.score + context.stars * 100);
  const rng = new SeededRandom(seed);

  // 1. Select Character
  const charBase = rng.choice(CHARACTERS);
  const expression = rng.choice<CharacterExpression>(['happy', 'excited', 'curious', 'proud', 'winking']);
  const animation = rng.choice<CharacterAnimation>(['bounce', 'wave', 'jump', 'spin', 'celebrate', 'sparkle']);

  const character: StoryCharacter = {
    ...charBase,
    expression,
    animation,
  };

  // 2. Select Arc and Template
  const arcKey = Math.min(6, Math.max(1, context.levelId));
  const arc = STORY_ARCS[arcKey] || STORY_ARCS[1];
  const template = rng.choice(arc.templates);

  // 3. Dynamic Performance Injections (40–100 words target)
  let performanceNote = '';
  if (context.remainingMoves > 5) {
    performanceNote = ` You finished with ${context.remainingMoves} extra moves remaining, creating a magnificent cascade!`;
  } else if (context.stars === 3) {
    performanceNote = ' You earned a flawless 3-Star rating for your supreme tactical play!';
  } else if (context.comboCount && context.comboCount > 2) {
    performanceNote = ` Your ${context.comboCount}x mega combo set a new record in this realm!`;
  }

  const message: StoryMessage = {
    sender: `${character.name} (${character.type})`,
    greeting: template.greeting,
    body: `${template.body}${performanceNote}`,
    signoff: template.signoff,
    mood: expression,
    decoration: character.badgeEmoji,
  };

  // 4. Select Visual Themes
  const backgroundTheme = rng.choice<BackgroundTheme>([
    'starlight-valley',
    'nebula-woods',
    'crystal-cavern',
    'cosmic-garden',
    'moonlight-bay',
  ]);
  const letterStyle = rng.choice<LetterStyle>(['parchment', 'cosmic-star', 'crystal-gem', 'nebula-glow']);
  const revealStyle = rng.choice<RevealStyle>([
    'envelope-unfold',
    'character-handout',
    'crystal-portal',
    'star-fade',
  ]);
  const particleType = rng.choice<'stars' | 'sparkles' | 'hearts' | 'crystals'>([
    'stars',
    'sparkles',
    'hearts',
    'crystals',
  ]);

  return {
    seed,
    character,
    message,
    backgroundTheme,
    letterStyle,
    revealStyle,
    particleType,
    context,
  };
}
