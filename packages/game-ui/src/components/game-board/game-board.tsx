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

  private dragStartPos: { x: number; y: number; row: number; col: number } | null = null;

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

  private handlePointerDown = (e: PointerEvent, row: number, col: number) => {
    if (this.disabled) return;
    this.dragStartPos = { x: e.clientX, y: e.clientY, row, col };
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.dragStartPos || this.disabled) return;

    const dx = e.clientX - this.dragStartPos.x;
    const dy = e.clientY - this.dragStartPos.y;
    const minSwipeDistance = 20;

    let targetRow = this.dragStartPos.row;
    let targetCol = this.dragStartPos.col;

    if (Math.abs(dx) > minSwipeDistance || Math.abs(dy) > minSwipeDistance) {
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
          from: { row: this.dragStartPos.row, col: this.dragStartPos.col },
          to: { row: targetRow, col: targetCol },
        });
        this.dragStartPos = null;
        return;
      }
    }

    this.dragStartPos = null;
  };

  private handleTouchMove = (e: TouchEvent) => {
    // Prevent default scrolling when dragging candies on mobile touch screen
    if (this.dragStartPos) {
      e.preventDefault();
    }
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
                onPointerDown={(e) => this.handlePointerDown(e, r, c)}
                onPointerUp={(e) => this.handlePointerUp(e)}
                onTouchMove={this.handleTouchMove}
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
