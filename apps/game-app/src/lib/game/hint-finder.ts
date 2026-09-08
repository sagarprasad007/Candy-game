import { cloneGrid, type Grid } from './board';
import { MatchDetector } from './match-detector';
import type { LevelConfig } from './level-manager';

export interface HintMove {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  score: number;
}

export class HintFinder {
  private matchDetector: MatchDetector;

  constructor() {
    this.matchDetector = new MatchDetector();
  }

  /**
   * Evaluates all legal adjacent swaps on the board and scores them.
   * Returns the single best HintMove candidate or null if no valid moves exist.
   * Does NOT mutate the input grid.
   */
  public findBestHint(grid: Grid, rows: number, cols: number, levelConfig?: LevelConfig): HintMove | null {
    if (!grid || grid.length === 0 || rows <= 0 || cols <= 0) return null;

    const candidates: HintMove[] = [];

    // Horizontal adjacent pairs
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const move = this.evaluateSwap(grid, rows, cols, r, c, r, c + 1, levelConfig);
        if (move) candidates.push(move);
      }
    }

    // Vertical adjacent pairs
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols; c++) {
        const move = this.evaluateSwap(grid, rows, cols, r, c, r + 1, c, levelConfig);
        if (move) candidates.push(move);
      }
    }

    if (candidates.length === 0) return null;

    // Sort descending by calculated score
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  private evaluateSwap(
    grid: Grid,
    rows: number,
    cols: number,
    r1: number,
    c1: number,
    r2: number,
    c2: number,
    levelConfig?: LevelConfig
  ): HintMove | null {
    const simGrid = cloneGrid(grid);

    // Swap tiles in simulation grid
    const tempType = simGrid[r1][c1].type;
    const tempSpecial = simGrid[r1][c1].special;
    simGrid[r1][c1].type = simGrid[r2][c2].type;
    simGrid[r1][c1].special = simGrid[r2][c2].special;
    simGrid[r2][c2].type = tempType;
    simGrid[r2][c2].special = tempSpecial;

    // Check match detection on simulated swap
    const matchResult = this.matchDetector.findMatches(simGrid, rows, cols, { r1, c1, r2, c2 });

    if (matchResult.matchedTiles.length === 0) {
      return null;
    }

    let moveScore = 0;
    const count = matchResult.matchedTiles.length;

    // Special tile creation priority
    if (matchResult.createdSpecialTile) {
      const spec = matchResult.createdSpecialTile.special;
      if (spec === 'prism') moveScore += 100;
      else if (spec === 'bomb') moveScore += 80;
      else if (spec === 'line-h' || spec === 'line-v') moveScore += 60;
    }

    // Special combo activation priority
    if (matchResult.isSpecialCombo) {
      moveScore += 120;
    }

    // Match size scoring
    if (count >= 5) moveScore += 70;
    else if (count === 4) moveScore += 40;
    else moveScore += 20;

    // Objective awareness priority: Obstacle damage (Ice / Jelly)
    const damagedIceCount = matchResult.damagedObstacles.length;
    const clearedJellyCount = matchResult.clearedJellies.length;
    const totalObstacleImpact = damagedIceCount + clearedJellyCount;

    if (totalObstacleImpact > 0) {
      moveScore += totalObstacleImpact * 50;
      if (levelConfig?.objective?.type === 'obstacle' || (levelConfig?.objective?.type as string) === 'jelly') {
        moveScore += 40; // Additional boost for matching level objective
      }
    }

    // Objective awareness priority: Target collection candy color
    if (levelConfig?.objective?.type === 'collect' && levelConfig.objective.collectType) {
      const targetColorMatches = matchResult.matchedTiles.filter(
        (t) => t.type === levelConfig.objective.collectType
      ).length;
      if (targetColorMatches > 0) {
        moveScore += targetColorMatches * 30;
      }
    }

    return {
      fromRow: r1,
      fromCol: c1,
      toRow: r2,
      toCol: c2,
      score: moveScore,
    };
  }
}
