import type { Grid, TileData } from './board';

export interface MatchResult {
  matchedTiles: TileData[];
  createdSpecialTile?: { row: number; col: number; special: 'line-h' | 'line-v' | 'bomb' | 'prism'; type: string };
  damagedObstacles: { row: number; col: number; newObstacleState: 'none' | 'ice-1' }[];
  isSpecialCombo?: boolean;
}

export class MatchDetector {
  findMatches(grid: Grid, rows: number, cols: number, swappedPos?: { r1: number; c1: number; r2: number; c2: number }): MatchResult {
    // 0. Check explicit player Special + Special swap combination first
    if (swappedPos) {
      const { r1, c1, r2, c2 } = swappedPos;
      const tile1 = grid[r1]?.[c1];
      const tile2 = grid[r2]?.[c2];

      if (tile1 && tile2 && tile1.special !== 'none' && tile2.special !== 'none') {
        const expandedSet = new Set<TileData>([tile1, tile2]);
        const s1 = tile1.special;
        const s2 = tile2.special;

        const hasPrism = s1 === 'prism' || s2 === 'prism';
        const hasBomb = s1 === 'bomb' || s2 === 'bomb';
        const hasLine = s1 === 'line-h' || s1 === 'line-v' || s2 === 'line-h' || s2 === 'line-v';

        if (s1 === 'prism' && s2 === 'prism') {
          // Prism + Prism -> Clear entire board!
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) expandedSet.add(grid[r][c]);
          }
        } else if (hasPrism) {
          // Prism + Special -> Clear all of non-prism special's type
          const specialOther = s1 === 'prism' ? tile2 : tile1;
          const targetType = specialOther.type || 'ruby';
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (grid[r][c].type === targetType) expandedSet.add(grid[r][c]);
            }
          }
        } else if (hasBomb && hasLine) {
          // Bomb + Line -> Super 3 rows & 3 cols blast covering both swapped positions
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (
                Math.abs(r - r1) <= 1 ||
                Math.abs(c - c1) <= 1 ||
                Math.abs(r - r2) <= 1 ||
                Math.abs(c - c2) <= 1
              ) {
                expandedSet.add(grid[r][c]);
              }
            }
          }
        } else if (s1 === 'bomb' && s2 === 'bomb') {
          // Bomb + Bomb -> 5x5 explosion
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const nr = r1 + dr;
              const nc = c1 + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) expandedSet.add(grid[nr][nc]);
            }
          }
        } else if (hasLine) {
          // Line + Line -> Row AND Column cross blast
          for (let c = 0; c < cols; c++) expandedSet.add(grid[r1][c]);
          for (let r = 0; r < rows; r++) expandedSet.add(grid[r][c1]);
        }

        const matchedTiles = Array.from(expandedSet);
        const damagedObstaclesMap = new Map<string, { row: number; col: number; newObstacleState: 'none' | 'ice-1' }>();
        matchedTiles.forEach((tile) => {
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
              const key = `${r},${c}`;
              if (!damagedObstaclesMap.has(key)) {
                if (obs === 'ice-2') damagedObstaclesMap.set(key, { row: r, col: c, newObstacleState: 'ice-1' });
                else if (obs === 'ice-1') damagedObstaclesMap.set(key, { row: r, col: c, newObstacleState: 'none' });
              }
            }
          });
        });

        return {
          matchedTiles,
          damagedObstacles: Array.from(damagedObstaclesMap.values()),
          isSpecialCombo: true,
        };
      } else if (tile1 && tile2 && (tile1.special === 'prism' || tile2.special === 'prism')) {
        // Prism + Normal Candy Swap
        const prismTile = tile1.special === 'prism' ? tile1 : tile2;
        const normalTile = tile1.special === 'prism' ? tile2 : tile1;
        if (normalTile.type) {
          const expandedSet = new Set<TileData>([prismTile]);
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (grid[r][c].type === normalTile.type) expandedSet.add(grid[r][c]);
            }
          }
          const matchedTiles = Array.from(expandedSet);
          const damagedObstaclesMap = new Map<string, { row: number; col: number; newObstacleState: 'none' | 'ice-1' }>();
          matchedTiles.forEach((tile) => {
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
                const key = `${r},${c}`;
                if (!damagedObstaclesMap.has(key)) {
                  if (obs === 'ice-2') damagedObstaclesMap.set(key, { row: r, col: c, newObstacleState: 'ice-1' });
                  else if (obs === 'ice-1') damagedObstaclesMap.set(key, { row: r, col: c, newObstacleState: 'none' });
                }
              }
            });
          });

          return {
            matchedTiles,
            damagedObstacles: Array.from(damagedObstaclesMap.values()),
            isSpecialCombo: true,
          };
        }
      }
    }

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

    horizontalRuns.forEach((run) => run.forEach((t) => matchedTilesSet.add(t)));
    verticalRuns.forEach((run) => run.forEach((t) => matchedTilesSet.add(t)));

    let createdSpecialTile: MatchResult['createdSpecialTile'] = undefined;

    // Helper to find best target position (favoring player swapped position if inside run)
    const getSpecialPosition = (run: TileData[]): { row: number; col: number; type: string } => {
      const origType = run[0]?.type || 'ruby';
      if (swappedPos) {
        const matchSwapped = run.find(
          (t) => (t.row === swappedPos.r1 && t.col === swappedPos.c1) || (t.row === swappedPos.r2 && t.col === swappedPos.c2)
        );
        if (matchSwapped) return { row: matchSwapped.row, col: matchSwapped.col, type: matchSwapped.type || origType };
      }
      const midTile = run[Math.floor(run.length / 2)];
      return { row: midTile.row, col: midTile.col, type: midTile.type || origType };
    };

    // 1. Check for L-shaped or T-shaped matches (intersecting horizontal and vertical runs of same type)
    for (const hRun of horizontalRuns) {
      for (const vRun of verticalRuns) {
        if (hRun[0].type === vRun[0].type) {
          const intersection = hRun.find((ht) => vRun.some((vt) => vt.row === ht.row && vt.col === ht.col));
          if (intersection && !createdSpecialTile) {
            createdSpecialTile = {
              row: intersection.row,
              col: intersection.col,
              special: 'bomb',
              type: intersection.type || hRun[0].type,
            };
          }
        }
      }
    }

    // 2. If no L/T bomb, check for 5-in-a-row (prism) or 4-in-a-row (line-h / line-v)
    if (!createdSpecialTile) {
      const allRuns = [
        ...horizontalRuns.map((run) => ({ run, isHorizontal: true })),
        ...verticalRuns.map((run) => ({ run, isHorizontal: false })),
      ];

      // Check 5+ first
      for (const { run } of allRuns) {
        if (run.length >= 5) {
          const pos = getSpecialPosition(run);
          createdSpecialTile = { row: pos.row, col: pos.col, special: 'prism', type: pos.type };
          break;
        }
      }

      // If no 5+, check 4
      if (!createdSpecialTile) {
        for (const { run, isHorizontal } of allRuns) {
          if (run.length === 4) {
            const pos = getSpecialPosition(run);
            createdSpecialTile = {
              row: pos.row,
              col: pos.col,
              special: isHorizontal ? 'line-h' : 'line-v',
              type: pos.type,
            };
            break;
          }
        }
      }
    }

    // Handle Individual Special Tile Activations (Line Blast, Bomb, Prism)
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

    // Check adjacent obstacle damage using coordinate map to prevent duplicate hits in one step
    const damagedObstaclesMap = new Map<string, { row: number; col: number; newObstacleState: 'none' | 'ice-1' }>();
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
          const key = `${r},${c}`;
          if (!damagedObstaclesMap.has(key)) {
            if (obs === 'ice-2') {
              damagedObstaclesMap.set(key, { row: r, col: c, newObstacleState: 'ice-1' });
            } else if (obs === 'ice-1') {
              damagedObstaclesMap.set(key, { row: r, col: c, newObstacleState: 'none' });
            }
          }
        }
      });
    });

    return {
      matchedTiles: finalMatched,
      createdSpecialTile,
      damagedObstacles: Array.from(damagedObstaclesMap.values()),
    };
  }
}


