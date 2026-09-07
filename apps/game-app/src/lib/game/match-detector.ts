import type { Grid, TileData } from './board';

export interface MatchResult {
  matchedTiles: TileData[];
  createdSpecialTile?: { row: number; col: number; special: 'line-h' | 'line-v' | 'bomb' | 'prism' };
  damagedObstacles: { row: number; col: number; newObstacleState: 'none' | 'ice-1' }[];
}

export class MatchDetector {
  findMatches(grid: Grid, rows: number, cols: number): MatchResult {
    const matchedTilesSet = new Set<TileData>();
    const horizontalRuns: TileData[][] = [];
    const verticalRuns: TileData[][] = [];

    // Horizontal match scan
    for (let r = 0; r < rows; r++) {
      let currentRun: TileData[] = [];
      for (let c = 0; c < cols; c++) {
        const tile = grid[r][c];
        if (!tile.type) {
          if (currentRun.length >= 3) horizontalRuns.push(currentRun);
          currentRun = [];
          continue;
        }

        if (currentRun.length === 0 || currentRun[0].type === tile.type) {
          currentRun.push(tile);
        } else {
          if (currentRun.length >= 3) horizontalRuns.push(currentRun);
          currentRun = [tile];
        }
      }
      if (currentRun.length >= 3) horizontalRuns.push(currentRun);
    }

    // Vertical match scan
    for (let c = 0; c < cols; c++) {
      let currentRun: TileData[] = [];
      for (let r = 0; r < rows; r++) {
        const tile = grid[r][c];
        if (!tile.type) {
          if (currentRun.length >= 3) verticalRuns.push(currentRun);
          currentRun = [];
          continue;
        }

        if (currentRun.length === 0 || currentRun[0].type === tile.type) {
          currentRun.push(tile);
        } else {
          if (currentRun.length >= 3) verticalRuns.push(currentRun);
          currentRun = [tile];
        }
      }
      if (currentRun.length >= 3) verticalRuns.push(currentRun);
    }

    // Add runs to matchedTilesSet
    let createdSpecialTile: MatchResult['createdSpecialTile'] = undefined;

    const processRun = (run: TileData[], isHorizontal: boolean) => {
      run.forEach((t) => matchedTilesSet.add(t));
      const midTile = run[Math.floor(run.length / 2)];

      if (run.length === 4 && !createdSpecialTile) {
        createdSpecialTile = {
          row: midTile.row,
          col: midTile.col,
          special: isHorizontal ? 'line-h' : 'line-v',
        };
      } else if (run.length >= 5 && !createdSpecialTile) {
        createdSpecialTile = {
          row: midTile.row,
          col: midTile.col,
          special: run.length >= 5 ? 'prism' : 'bomb',
        };
      }
    };

    horizontalRuns.forEach((run) => processRun(run, true));
    verticalRuns.forEach((run) => processRun(run, false));

    // Handle Special Tile Activations (Line Blast, Bomb, Prism)
    const expandedMatchedSet = new Set<TileData>(matchedTilesSet);
    matchedTilesSet.forEach((tile) => {
      if (tile.special === 'line-h') {
        for (let c = 0; c < cols; c++) expandedMatchedSet.add(grid[tile.row][c]);
      } else if (tile.special === 'line-v') {
        for (let r = 0; r < rows; r++) expandedMatchedSet.add(grid[r][tile.col]);
      } else if (tile.special === 'bomb') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = tile.row + dr;
            const nc = tile.col + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              expandedMatchedSet.add(grid[nr][nc]);
            }
          }
        }
      } else if (tile.special === 'prism') {
        const targetType = tile.type || 'ruby';
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (grid[r][c].type === targetType) expandedMatchedSet.add(grid[r][c]);
          }
        }
      }
    });

    const finalMatched = Array.from(expandedMatchedSet);

    // Check adjacent obstacle damage (e.g. ice blocks)
    const damagedObstacles: MatchResult['damagedObstacles'] = [];
    finalMatched.forEach((tile) => {
      const neighbors = [
        { r: tile.row - 1, c: tile.col },
        { r: tile.row + 1, c: tile.col },
        { r: tile.row, c: tile.col - 1 },
        { r: tile.row, c: tile.col + 1 },
        { r: tile.row, c: tile.col },
      ];

      neighbors.forEach(({ r, c }) => {
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          const obs = grid[r][c].obstacle;
          if (obs === 'ice-2') {
            damagedObstacles.push({ row: r, col: c, newObstacleState: 'ice-1' });
          } else if (obs === 'ice-1') {
            damagedObstacles.push({ row: r, col: c, newObstacleState: 'none' });
          }
        }
      });
    });

    return {
      matchedTiles: finalMatched,
      createdSpecialTile,
      damagedObstacles,
    };
  }
}
