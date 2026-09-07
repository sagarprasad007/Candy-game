import { describe, it, expect } from 'vitest';
import { MatchDetector } from '../game/match-detector';
import { GameBoardLogic, createRandomTile } from '../game/board';
import { ScoringSystem } from '../game/scoring';
import { GameEngine } from '../game/game-engine';

describe('Match-3 Game Logic Tests', () => {
  it('detects a valid 3-tile horizontal match', () => {
    const detector = new MatchDetector();
    const boardLogic = new GameBoardLogic(5, 5);

    // Force 3 rubies in row 0
    boardLogic.grid[0][0] = { id: '1', type: 'ruby', special: 'none', obstacle: 'none', row: 0, col: 0 };
    boardLogic.grid[0][1] = { id: '2', type: 'ruby', special: 'none', obstacle: 'none', row: 0, col: 1 };
    boardLogic.grid[0][2] = { id: '3', type: 'ruby', special: 'none', obstacle: 'none', row: 0, col: 2 };
    boardLogic.grid[0][3] = { id: '4', type: 'sapphire', special: 'none', obstacle: 'none', row: 0, col: 3 };

    const result = detector.findMatches(boardLogic.grid, 5, 5);
    expect(result.matchedTiles.length).toBeGreaterThanOrEqual(3);
    expect(result.matchedTiles.some(t => t.id === '1')).toBe(true);
  });

  it('rejects 2-tile match as invalid', () => {
    const detector = new MatchDetector();
    const boardLogic = new GameBoardLogic(5, 5);

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        boardLogic.grid[r][c] = { id: `${r}-${c}`, type: r % 2 === 0 ? 'emerald' : 'amber', special: 'none', obstacle: 'none', row: r, col: c };
      }
    }

    // Only 2 rubies
    boardLogic.grid[0][0].type = 'ruby';
    boardLogic.grid[0][1].type = 'ruby';
    boardLogic.grid[0][2].type = 'amethyst';

    const result = detector.findMatches(boardLogic.grid, 5, 5);
    const rubyMatches = result.matchedTiles.filter(t => t.type === 'ruby');
    expect(rubyMatches.length).toBe(0);
  });

  it('calculates expected scoring and combo multipliers', () => {
    const scoring = new ScoringSystem();
    const tiles = [
      { id: '1', type: 'ruby', special: 'none', obstacle: 'none', row: 0, col: 0 },
      { id: '2', type: 'ruby', special: 'none', obstacle: 'none', row: 0, col: 1 },
      { id: '3', type: 'ruby', special: 'none', obstacle: 'none', row: 0, col: 2 },
    ] as any;

    const baseScore = scoring.calculateScore(tiles, 1);
    expect(baseScore.points).toBe(30);

    const comboScore = scoring.calculateScore(tiles, 2);
    expect(comboScore.points).toBe(60);
    expect(comboScore.bonusText).toContain('Combo x2');
  });

  it('triggers level win state when target score reached', () => {
    const engine = new GameEngine(1);
    engine.state.score = 3000;
    engine.checkGameStatus();
    expect(engine.state.status).toBe('won');
  });

  it('triggers level loss state when moves reach 0 without completing objective', () => {
    const engine = new GameEngine(1);
    engine.state.remainingMoves = 0;
    engine.state.score = 500;
    engine.checkGameStatus();
    expect(engine.state.status).toBe('lost');
  });
});
