import { browser } from '$app/environment';
import { LevelManager } from '../game/level-manager';

export interface PlayerProgress {
  currentLevel: number;
  unlockedLevels: number[];
  completedLevels: number[];
  stars: Record<number, number>; // levelId -> stars (1-3)
  bestScores: Record<number, number>; // levelId -> score
  lives: number;
  maxLives: number;
  lastLifeRestoredTimestamp: number;
  lastWheelSpinTimestamp?: number;
  coins: number;
  totalPoints: number;
  achievements: string[];
  boosters: Record<string, number>; // boosterId -> count
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  musicVolume: number; // 0.0 to 1.0
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
  lastWheelSpinTimestamp: 0,
  coins: 100,
  totalPoints: 0,
  achievements: [],
  boosters: { hammer: 3, shuffle: 3, extraMoves: 1 },
};

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  musicVolume: 0.8,
  animationsEnabled: true,
};

class StorageStore {
  progress: PlayerProgress;
  settings: GameSettings;
  private levelManager = new LevelManager();

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

  restoreLife(count = 1): void {
    this.progress.lives = Math.min(this.progress.maxLives, this.progress.lives + count);
    this.saveProgress();
  }

  addCoins(amount: number): void {
    this.progress.coins = (this.progress.coins || 0) + amount;
    this.saveProgress();
  }

  addPoints(amount: number): void {
    this.progress.totalPoints = (this.progress.totalPoints || 0) + amount;
    this.saveProgress();
  }

  addBooster(type: string, count = 1): void {
    if (!this.progress.boosters) this.progress.boosters = { hammer: 3, shuffle: 3, extraMoves: 1 };
    this.progress.boosters[type] = (this.progress.boosters[type] || 0) + count;
    this.saveProgress();
  }

  useBooster(type: string): boolean {
    if (!this.progress.boosters) this.progress.boosters = { hammer: 3, shuffle: 3, extraMoves: 1 };
    if ((this.progress.boosters[type] || 0) > 0) {
      this.progress.boosters[type]--;
      this.saveProgress();
      return true;
    }
    return false;
  }

  recordWheelSpin(): void {
    this.progress.lastWheelSpinTimestamp = Date.now();
    this.saveProgress();
  }

  canSpinWheel(): boolean {
    if (!this.progress.lastWheelSpinTimestamp) return true;
    const elapsed = Date.now() - this.progress.lastWheelSpinTimestamp;
    return elapsed >= 24 * 60 * 60 * 1000; // 24 hours
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
    // Only unlock next level if stars >= 1
    if (stars >= 1 && !this.progress.unlockedLevels.includes(nextLevel)) {
      this.progress.unlockedLevels.push(nextLevel);
    }

    this.progress.stars[levelId] = Math.max(this.progress.stars[levelId] || 0, stars);
    this.progress.bestScores[levelId] = Math.max(this.progress.bestScores[levelId] || 0, score);
    this.progress.totalPoints = (this.progress.totalPoints || 0) + score;

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

