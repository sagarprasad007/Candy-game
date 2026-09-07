import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

export interface BoardTileData {
  id: string;
  type: string;
  special?: string;
  obstacle?: string;
  selected?: boolean;
  matched?: boolean;
  falling?: boolean;
}

@Component({
  tag: 'game-board',
  styleUrl: 'game-board.css',
  shadow: true,
})
export class GameBoard {
  @Prop() gridData: BoardTileData[][] | string = [];
  @Prop() rows: number = 8;
  @Prop() cols: number = 8;
  @Prop() selectedRow: number = -1;
  @Prop() selectedCol: number = -1;
  @Prop() disabled: boolean = false;

  private get parsedGridData(): BoardTileData[][] {
    if (typeof this.gridData === 'string') {
      try {
        return JSON.parse(this.gridData);
      } catch (e) {
        return [];
      }
    }
    return this.gridData || [];
  }

  @Event({ eventName: 'tile-swapped' }) tileSwapped!: EventEmitter<{
    from: { row: number; col: number };
    to: { row: number; col: number };
  }>;

  @Event({ eventName: 'game-tile-selected' }) gameTileSelected!: EventEmitter<{
    row: number;
    col: number;
  }>;

  private touchStart: { x: number; y: number; row: number; col: number } | null = null;

  private handleTileClick = (row: number, col: number) => {
    if (this.disabled) return;

    if (this.selectedRow !== -1 && this.selectedCol !== -1) {
      const isAdjacent =
        (Math.abs(this.selectedRow - row) === 1 && this.selectedCol === col) ||
        (Math.abs(this.selectedCol - col) === 1 && this.selectedRow === row);

      if (isAdjacent) {
        this.tileSwapped.emit({
          from: { row: this.selectedRow, col: this.selectedCol },
          to: { row, col },
        });
        return;
      }
    }

    this.gameTileSelected.emit({ row, col });
  };

  private handleTouchStart = (e: TouchEvent, row: number, col: number) => {
    if (this.disabled) return;
    const touch = e.touches[0];
    this.touchStart = { x: touch.clientX, y: touch.clientY, row, col };
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.touchStart || this.disabled) return;
    const touch = e.touches[0];
    const dx = touch.clientX - this.touchStart.x;
    const dy = touch.clientY - this.touchStart.y;
    const threshold = 15; // Low 15px threshold for instant responsive swipe

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      e.preventDefault();
      let targetRow = this.touchStart.row;
      let targetCol = this.touchStart.col;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetCol += dx > 0 ? 1 : -1;
      } else {
        targetRow += dy > 0 ? 1 : -1;
      }

      if (
        targetRow >= 0 && targetRow < this.rows &&
        targetCol >= 0 && targetCol < this.cols
      ) {
        this.tileSwapped.emit({
          from: { row: this.touchStart.row, col: this.touchStart.col },
          to: { row: targetRow, col: targetCol },
        });
      }
      this.touchStart = null;
    }
  };

  private handleTouchEnd = () => {
    this.touchStart = null;
  };

  render() {
    const gridStyle = {
      gridTemplateColumns: `repeat(${this.cols}, 1fr)`,
      gridTemplateRows: `repeat(${this.rows}, 1fr)`,
    };

    return (
      <div class={`board-container ${this.disabled ? 'disabled' : ''}`}>
        <div class="board-grid" style={gridStyle}>
          {this.parsedGridData.map((rowArr, r) =>
            rowArr.map((tile, c) => (
              <div
                key={tile.id || `${r}-${c}`}
                class="tile-wrapper"
                onTouchStart={(e) => this.handleTouchStart(e, r, c)}
                onTouchMove={(e) => this.handleTouchMove(e)}
                onTouchEnd={() => this.handleTouchEnd()}
              >
                <game-tile
                  type={tile.type}
                  special={tile.special || 'none'}
                  obstacle={tile.obstacle || 'none'}
                  selected={this.selectedRow === r && this.selectedCol === c}
                  matched={tile.matched || false}
                  falling={tile.falling || false}
                  row={r}
                  col={c}
                  onGame-tile-selected={() => this.handleTileClick(r, c)}
                  onClick={() => this.handleTileClick(r, c)}
                ></game-tile>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
}
