import { describe, it, expect, beforeEach } from 'vitest';
import { GameBoardLogic, createRandomTile, type Grid } from '../game/board';
import { MatchDetector } from '../game/match-detector';
import { GameEngine } from '../game/game-engine';

describe('Match-3 Game Engine & Special Logic Tests', () => {
  let detector: MatchDetector;

  beforeEach(() => {
    detector = new MatchDetector();
  });

  function createEmptyGrid(rows = 8, cols = 8): Grid {
    const grid: Grid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          id: `tile-${r}-${c}`,
          type: '',
          special: 'none',
          obstacle: 'none',
          row: r,
          col: c,
        });
      }
      grid.push(row);
    }
    return grid;
  }

  // 1. 3 horizontal match
  it('1. detects 3 horizontal match correctly', () => {
    const grid = createEmptyGrid();
    grid[0][0].type = 'ruby';
    grid[0][1].type = 'ruby';
    grid[0][2].type = 'ruby';

    const res = detector.findMatches(grid, 8, 8);
    expect(res.matchedTiles.length).toBe(3);
    expect(res.createdSpecialTile).toBeUndefined();
  });

  // 2. 3 vertical match
  it('2. detects 3 vertical match correctly', () => {
    const grid = createEmptyGrid();
    grid[0][0].type = 'sapphire';
    grid[1][0].type = 'sapphire';
    grid[2][0].type = 'sapphire';

    const res = detector.findMatches(grid, 8, 8);
    expect(res.matchedTiles.length).toBe(3);
    expect(res.createdSpecialTile).toBeUndefined();
  });

  // 3. 4 horizontal -> line-h & type preservation
  it('3. creates line-h special tile for 4 horizontal match preserving original candy type', () => {
    const grid = createEmptyGrid();
    for (let c = 0; c < 4; c++) grid[1][c].type = 'emerald';

    const res = detector.findMatches(grid, 8, 8);
    expect(res.matchedTiles.length).toBe(4);
    expect(res.createdSpecialTile).toBeDefined();
    expect(res.createdSpecialTile?.special).toBe('line-h');
    expect(res.createdSpecialTile?.type).toBe('emerald');
  });

  // 4. 4 vertical -> line-v & type preservation
  it('4. creates line-v special tile for 4 vertical match preserving original candy type', () => {
    const grid = createEmptyGrid();
    for (let r = 0; r < 4; r++) grid[r][2].type = 'amber';

    const res = detector.findMatches(grid, 8, 8);
    expect(res.matchedTiles.length).toBe(4);
    expect(res.createdSpecialTile).toBeDefined();
    expect(res.createdSpecialTile?.special).toBe('line-v');
    expect(res.createdSpecialTile?.type).toBe('amber');
  });

  // 5. 5 match -> prism
  it('5. creates prism special tile for 5 in a row', () => {
    const grid = createEmptyGrid();
    for (let c = 0; c < 5; c++) grid[3][c].type = 'amethyst';

    const res = detector.findMatches(grid, 8, 8);
    expect(res.matchedTiles.length).toBe(5);
    expect(res.createdSpecialTile?.special).toBe('prism');
    expect(res.createdSpecialTile?.type).toBe('amethyst');
  });

  // 6. L shape -> bomb
  it('6. creates bomb special tile for L-shaped match preserving type', () => {
    const grid = createEmptyGrid();
    grid[2][2].type = 'ruby';
    grid[2][3].type = 'ruby';
    grid[2][4].type = 'ruby';
    grid[3][2].type = 'ruby';
    grid[4][2].type = 'ruby';

    const res = detector.findMatches(grid, 8, 8);
    expect(res.createdSpecialTile?.special).toBe('bomb');
    expect(res.createdSpecialTile?.type).toBe('ruby');
  });

  // 7. T shape -> bomb
  it('7. creates bomb special tile for T-shaped match', () => {
    const grid = createEmptyGrid();
    grid[1][1].type = 'sapphire';
    grid[1][2].type = 'sapphire';
    grid[1][3].type = 'sapphire';
    grid[2][2].type = 'sapphire';
    grid[3][2].type = 'sapphire';

    const res = detector.findMatches(grid, 8, 8);
    expect(res.createdSpecialTile?.special).toBe('bomb');
    expect(res.createdSpecialTile?.type).toBe('sapphire');
  });

  // 8. special activation
  it('8. activates line-h blast clearing entire row', () => {
    const grid = createEmptyGrid();
    grid[0][0].type = 'ruby';
    grid[0][1].type = 'ruby';
    grid[0][2].type = 'ruby';
    grid[0][1].special = 'line-h';

    const res = detector.findMatches(grid, 8, 8);
    expect(res.matchedTiles.length).toBe(8);
  });

  // 9. special combinations via player swap
  it('9. activates special combinations when player swaps two special tiles (bomb + line)', () => {
    const grid = createEmptyGrid();
    grid[4][4].type = 'ruby';
    grid[4][4].special = 'bomb';
    grid[4][5].type = 'sapphire';
    grid[4][5].special = 'line-h';

    const res = detector.findMatches(grid, 8, 8, { r1: 4, c1: 4, r2: 4, c2: 5 });
    expect(res.isSpecialCombo).toBe(true);
    expect(res.matchedTiles.length).toBeGreaterThan(15);
  });

  // 10. obstacle damage
  it('10. damages adjacent obstacles when candies match', () => {
    const grid = createEmptyGrid();
    grid[0][0].type = 'ruby';
    grid[0][1].type = 'ruby';
    grid[0][2].type = 'ruby';
    grid[1][1].obstacle = 'ice-2';

    const res = detector.findMatches(grid, 8, 8);
    expect(res.damagedObstacles.length).toBe(1);
    expect(res.damagedObstacles[0]).toEqual({ row: 1, col: 1, newObstacleState: 'ice-1' });
  });

  // 11. duplicate obstacle damage prevention
  it('11. prevents duplicate obstacle damage in single match resolution step', () => {
    const grid = createEmptyGrid();
    grid[0][1].type = 'ruby';
    grid[1][0].type = 'ruby';
    grid[1][2].type = 'ruby';
    grid[0][0].type = 'ruby';
    grid[0][2].type = 'ruby';
    grid[1][1].obstacle = 'ice-1';

    const res = detector.findMatches(grid, 8, 8);
    const ice1Damages = res.damagedObstacles.filter((o) => o.row === 1 && o.col === 1);
    expect(ice1Damages.length).toBe(1);
  });

  // 12. gravity & 13. exact fall distance & 14. new tile creation
  it('12, 13, 14. applies gravity, accurate fall distance, and generates new tiles', () => {
    const board = new GameBoardLogic(4, 4);
    board.grid[3][0].type = '';
    board.grid[2][0].type = '';

    const originalTile1 = board.grid[1][0];
    const originalTile0 = board.grid[0][0];

    const { fallen, newTiles } = board.applyGravityAndRefill();

    expect(fallen.length).toBe(2);
    expect(newTiles.length).toBe(2);

    expect(originalTile1.row).toBe(3);
    expect(originalTile1.fallDistance).toBe(2);
    expect(originalTile0.row).toBe(2);
    expect(originalTile0.fallDistance).toBe(2);

    expect(newTiles[0].row).toBe(0);
    expect(newTiles[0].fallDistance).toBe(2);
    expect(newTiles[1].row).toBe(1);
    expect(newTiles[1].fallDistance).toBe(2);
    expect(newTiles[0].isNew).toBe(true);
  });

  // 15. invalid swap & 16. valid swap
  it('15 & 16. handles invalid swap reversion and valid move execution', async () => {
    const engine = new GameEngine(1);
    const grid = engine.boardLogic.grid;

    // Fill grid with alternating types so no background matches exist
    for (let r = 0; r < engine.boardLogic.rows; r++) {
      for (let c = 0; c < engine.boardLogic.cols; c++) {
        grid[r][c].type = (r + c) % 2 === 0 ? 'ruby' : 'sapphire';
        grid[r][c].special = 'none';
      }
    }

    const initialMoves = engine.state.remainingMoves;
    const invalidSuccess = await engine.executeMove(0, 0, 0, 1);
    expect(invalidSuccess).toBe(false);
    expect(engine.state.remainingMoves).toBe(initialMoves);

    grid[0][0].type = 'ruby';
    grid[0][1].type = 'emerald';
    grid[0][2].type = 'ruby';
    grid[0][3].type = 'ruby';

    const validSuccess = await engine.executeMove(0, 1, 0, 0);
    expect(validSuccess).toBe(true);
    expect(engine.state.remainingMoves).toBe(initialMoves - 1);
  });

  // 17. cascade & 18. combo reset
  it('17 & 18. tracks cascades and resets combo per move', async () => {
    const engine = new GameEngine(1);
    expect(engine.state.comboCount).toBe(0);

    const grid = engine.boardLogic.grid;
    grid[0][0].type = 'ruby';
    grid[0][1].type = 'emerald';
    grid[0][2].type = 'ruby';
    grid[0][3].type = 'ruby';

    await engine.executeMove(0, 1, 0, 0);
    expect(engine.state.comboCount).toBeGreaterThanOrEqual(1);

    grid[1][0].type = 'sapphire';
    grid[1][1].type = 'ruby';
    grid[1][2].type = 'sapphire';
    grid[1][3].type = 'sapphire';

    await engine.executeMove(1, 1, 1, 0);
    expect(engine.state.comboCount).toBeGreaterThanOrEqual(1);
  });

  // 19. win condition & 20. loss condition
  it('19 & 20. checks win and loss conditions', () => {
    const engine = new GameEngine(1);
    engine.state.score = 5000;
    engine.checkGameStatus();
    expect(engine.state.status).toBe('won');

    const losingEngine = new GameEngine(1);
    losingEngine.state.remainingMoves = 0;
    losingEngine.state.score = 0;
    losingEngine.checkGameStatus();
    expect(losingEngine.state.status).toBe('lost');
  });
});
