export interface TileData {
  id: string;
  type: string; // ruby, sapphire, emerald, amber, amethyst
  special: 'none' | 'line-h' | 'line-v' | 'bomb' | 'prism';
  obstacle: 'none' | 'ice-1' | 'ice-2';
  row: number;
  col: number;
  matched?: boolean;
  falling?: boolean;
  fallDistance?: number;
  fromRow?: number;
  fromCol?: number;
  isNew?: boolean;
}

export type Grid = TileData[][];

export const TILE_TYPES = ['ruby', 'sapphire', 'emerald', 'amber', 'amethyst'];

export function createRandomTile(row: number, col: number, allowedTypes = TILE_TYPES): TileData {
  const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
  return {
    id: `tile-${row}-${col}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    special: 'none',
    obstacle: 'none',
    row,
    col,
  };
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.map((tile) => ({ ...tile })));
}

export class GameBoardLogic {
  rows: number;
  cols: number;
  grid: Grid;

  constructor(rows = 8, cols = 8, initialGrid?: Grid) {
    this.rows = rows;
    this.cols = cols;
    this.grid = initialGrid || this.generateInitialBoard();
  }

  generateInitialBoard(): Grid {
    let board: Grid;
    let hasMatches = true;

    // Keep generating until board has no starting match-3
    do {
      board = [];
      for (let r = 0; r < this.rows; r++) {
        const row: TileData[] = [];
        for (let c = 0; c < this.cols; c++) {
          row.push(createRandomTile(r, c));
        }
        board.push(row);
      }
      hasMatches = this.checkMatchesOnBoard(board).length > 0;
    } while (hasMatches);

    return board;
  }

  private checkMatchesOnBoard(board: Grid): TileData[] {
    const matchedTiles = new Set<TileData>();

    // Horizontal
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 2; c++) {
        const t1 = board[r][c];
        const t2 = board[r][c + 1];
        const t3 = board[r][c + 2];
        if (t1.type && t1.type === t2.type && t2.type === t3.type) {
          matchedTiles.add(t1);
          matchedTiles.add(t2);
          matchedTiles.add(t3);
        }
      }
    }

    // Vertical
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows - 2; r++) {
        const t1 = board[r][c];
        const t2 = board[r + 1][c];
        const t3 = board[r + 2][c];
        if (t1.type && t1.type === t2.type && t2.type === t3.type) {
          matchedTiles.add(t1);
          matchedTiles.add(t2);
          matchedTiles.add(t3);
        }
      }
    }

    return Array.from(matchedTiles);
  }

  swapTiles(r1: number, c1: number, r2: number, c2: number): void {
    const temp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = temp;

    this.grid[r1][c1].row = r1;
    this.grid[r1][c1].col = c1;
    this.grid[r2][c2].row = r2;
    this.grid[r2][c2].col = c2;
  }

  applyGravityAndRefill(): { fallen: TileData[]; newTiles: TileData[] } {
    const fallen: TileData[] = [];
    const newTiles: TileData[] = [];

    for (let c = 0; c < this.cols; c++) {
      let emptySlots = 0;

      for (let r = this.rows - 1; r >= 0; r--) {
        if (!this.grid[r][c].type) {
          emptySlots++;
        } else if (emptySlots > 0) {
          const tile = this.grid[r][c];
          const newRow = r + emptySlots;
          tile.fromRow = r;
          tile.fromCol = c;
          tile.row = newRow;
          tile.falling = true;
          tile.fallDistance = emptySlots;
          tile.isNew = false;
          this.grid[newRow][c] = tile;
          this.grid[r][c] = {
            id: `empty-${r}-${c}`,
            type: '',
            special: 'none',
            obstacle: 'none',
            row: r,
            col: c,
          };
          fallen.push(tile);
        }
      }

      for (let r = 0; r < emptySlots; r++) {
        const newTile = createRandomTile(r, c);
        newTile.fromRow = r - emptySlots;
        newTile.fromCol = c;
        newTile.falling = true;
        newTile.fallDistance = emptySlots;
        newTile.isNew = true;
        this.grid[r][c] = newTile;
        newTiles.push(newTile);
      }
    }

    return { fallen, newTiles };
  }

  resetTileMetadata(tile: TileData): void {
    tile.falling = false;
    tile.fallDistance = 0;
    tile.fromRow = undefined;
    tile.fromCol = undefined;
    tile.isNew = false;
  }

  shuffle(): void {
    const allTiles: TileData[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        allTiles.push(this.grid[r][c]);
      }
    }

    for (let i = allTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
    }

    let idx = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = allTiles[idx++];
        t.row = r;
        t.col = c;
        this.grid[r][c] = t;
      }
    }
  }
}
