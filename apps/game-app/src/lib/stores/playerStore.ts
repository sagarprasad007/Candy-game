import { browser } from '$app/environment';

export interface PlayerProgress {
  currentLevel: number;
  unlockedLevels: number[];
  completedLevels: number[];
  stars: Record<number, number>; // levelId -> stars (1-3)
  bestScores: Record<number, number>; // levelId -> score
  lives: number;
  maxLives: number;
  lastLifeRestoredTimestamp: number;
  achievements: string[];
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  animationsEnabled: boolean;
}

const DEFAULT_PROGRESS: PlayerProgress = {
  currentLevel: 1,
  unlockedLevels: [1],
  completedLevels: [],
  stars: {},
  bestScores: {},
  lives: 5,
  maxLives: 5,
  lastLifeRestoredTimestamp: Date.now(),
  achievements: [],
};

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  animationsEnabled: true,
};

class StorageStore {
  progress: PlayerProgress;
  settings: GameSettings;

  constructor() {
    this.progress = this.loadProgress();
    this.settings = this.loadSettings();
    this.checkLivesRegeneration();
  }

  private loadProgress(): PlayerProgress {
    if (!browser) return DEFAULT_PROGRESS;
    const data = localStorage.getItem('cosmic_gems_progress');
    return data ? { ...DEFAULT_PROGRESS, ...JSON.parse(data) } : DEFAULT_PROGRESS;
  }

  private loadSettings(): GameSettings {
    if (!browser) return DEFAULT_SETTINGS;
    const data = localStorage.getItem('cosmic_gems_settings');
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  }

  saveProgress(): void {
    if (browser) {
      localStorage.setItem('cosmic_gems_progress', JSON.stringify(this.progress));
    }
  }

  saveSettings(): void {
    if (browser) {
      localStorage.setItem('cosmic_gems_settings', JSON.stringify(this.settings));
    }
  }

  checkLivesRegeneration(): void {
    if (this.progress.lives >= this.progress.maxLives) return;
    const now = Date.now();
    const intervalMs = 5 * 60 * 1000; // 5 minutes per life
    const elapsed = now - (this.progress.lastLifeRestoredTimestamp || now);
    const restored = Math.floor(elapsed / intervalMs);

    if (restored > 0) {
      this.progress.lives = Math.min(this.progress.maxLives, this.progress.lives + restored);
      this.progress.lastLifeRestoredTimestamp = now;
      this.saveProgress();
    }
  }

  restoreLife(): void {
    if (this.progress.lives < this.progress.maxLives) {
      this.progress.lives++;
      this.saveProgress();
    }
  }

  consumeLife(): boolean {
    if (this.progress.lives > 0) {
      this.progress.lives--;
      this.saveProgress();
      return true;
    }
    return false;
  }

  recordLevelCompletion(levelId: number, score: number, stars: number): void {
    if (!this.progress.completedLevels.includes(levelId)) {
      this.progress.completedLevels.push(levelId);
    }

    const nextLevel = levelId + 1;
    if (!this.progress.unlockedLevels.includes(nextLevel) && nextLevel <= 6) {
      this.progress.unlockedLevels.push(nextLevel);
    }

    this.progress.stars[levelId] = Math.max(this.progress.stars[levelId] || 0, stars);
    this.progress.bestScores[levelId] = Math.max(this.progress.bestScores[levelId] || 0, score);

    // Achievements check
    if (!this.progress.achievements.includes('first_victory')) {
      this.progress.achievements.push('first_victory');
    }
    if (stars === 3 && !this.progress.achievements.includes('stellar_performance')) {
      this.progress.achievements.push('stellar_performance');
    }
    if (this.progress.completedLevels.length >= 5 && !this.progress.achievements.includes('galaxy_conqueror')) {
      this.progress.achievements.push('galaxy_conqueror');
    }

    this.saveProgress();
  }

  resetAll(): void {
    this.progress = { ...DEFAULT_PROGRESS, lastLifeRestoredTimestamp: Date.now() };
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveProgress();
    this.saveSettings();
  }
}

export const playerStore = new StorageStore();
