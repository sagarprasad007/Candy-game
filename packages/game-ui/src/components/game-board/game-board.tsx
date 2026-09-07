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

  private touchStartPos: { x: number; y: number; row: number; col: number } | null = null;

  private handleTileClick = (row: number, col: number) => {
    if (this.disabled) return;

    if (this.selectedRow !== -1 && this.selectedCol !== -1) {
      // If clicking adjacent tile, trigger swap
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
    this.touchStartPos = { x: touch.clientX, y: touch.clientY, row, col };
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (!this.touchStartPos || this.disabled) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartPos.x;
    const dy = touch.clientY - this.touchStartPos.y;
    const minSwipeDistance = 25;

    let targetRow = this.touchStartPos.row;
    let targetCol = this.touchStartPos.col;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minSwipeDistance) {
        targetCol += dx > 0 ? 1 : -1;
      }
    } else {
      if (Math.abs(dy) > minSwipeDistance) {
        targetRow += dy > 0 ? 1 : -1;
      }
    }

    if (
      (targetRow !== this.touchStartPos.row || targetCol !== this.touchStartPos.col) &&
      targetRow >= 0 && targetRow < this.rows &&
      targetCol >= 0 && targetCol < this.cols
    ) {
      this.tileSwapped.emit({
        from: { row: this.touchStartPos.row, col: this.touchStartPos.col },
        to: { row: targetRow, col: targetCol },
      });
    }

    this.touchStartPos = null;
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
                onTouchEnd={this.handleTouchEnd}
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
