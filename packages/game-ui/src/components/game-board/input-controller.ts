import { CanvasGameRenderer } from './canvas-game-renderer';

export interface PointerStart {
  x: number;
  y: number;
  row: number;
  col: number;
  pointerId: number;
}

export class InputController {
  private canvas: HTMLCanvasElement;
  private renderer: CanvasGameRenderer;
  private onSwap: (from: { row: number; col: number }, to: { row: number; col: number }) => void;
  private onSelect: (cell: { row: number; col: number }) => void;

  private pointerStart: PointerStart | null = null;
  private lockedDirection: 'horizontal' | 'vertical' | null = null;
  private activePointerId: number | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    renderer: CanvasGameRenderer,
    onSwap: (from: { row: number; col: number }, to: { row: number; col: number }) => void,
    onSelect: (cell: { row: number; col: number }) => void
  ) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.onSwap = onSwap;
    this.onSelect = onSelect;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    this.canvas.addEventListener('pointermove', this.handlePointerMove, { passive: false });
    this.canvas.addEventListener('pointerup', this.handlePointerUp, { passive: false });
    this.canvas.addEventListener('pointercancel', this.handlePointerCancel, { passive: false });
  }

  public unbindEvents(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
  }

  private getCellFromCoordinates(clientX: number, clientY: number): { row: number; col: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const col = Math.floor((x - this.renderer.originX) / this.renderer.cellPitchX);
    const row = Math.floor((y - this.renderer.originY) / this.renderer.cellPitchY);

    if (row >= 0 && row < this.renderer.rows && col >= 0 && col < this.renderer.cols) {
      return { row, col };
    }
    return null;
  }

  private handlePointerDown = (e: PointerEvent): void => {
    if (this.renderer.disabled || this.renderer.phase !== 'idle') return;

    const cell = this.getCellFromCoordinates(e.clientX, e.clientY);
    if (!cell) return;

    this.pointerStart = {
      x: e.clientX,
      y: e.clientY,
      row: cell.row,
      col: cell.col,
      pointerId: e.pointerId,
    };
    this.lockedDirection = null;
    this.activePointerId = e.pointerId;

    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unavailable
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.pointerStart || e.pointerId !== this.activePointerId || this.renderer.disabled) return;

    const dx = e.clientX - this.pointerStart.x;
    const dy = e.clientY - this.pointerStart.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 8) {
      e.preventDefault();

      if (!this.lockedDirection) {
        this.lockedDirection = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }

      const maxDrag = this.renderer.cellPitchX * 0.95;
      let clampedDx = 0;
      let clampedDy = 0;
      let targetRow = this.pointerStart.row;
      let targetCol = this.pointerStart.col;

      if (this.lockedDirection === 'horizontal') {
        clampedDx = Math.max(-maxDrag, Math.min(maxDrag, dx));
        targetCol += clampedDx > 0 ? 1 : -1;
      } else {
        clampedDy = Math.max(-maxDrag, Math.min(maxDrag, dy));
        targetRow += clampedDy > 0 ? 1 : -1;
      }

      if (
        targetRow < 0 ||
        targetRow >= this.renderer.rows ||
        targetCol < 0 ||
        targetCol >= this.renderer.cols
      ) {
        targetRow = -1;
        targetCol = -1;
      }

      this.renderer.setDragState({
        fromRow: this.pointerStart.row,
        fromCol: this.pointerStart.col,
        dx: clampedDx,
        dy: clampedDy,
        targetRow,
        targetCol,
      });
    }
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (!this.pointerStart || e.pointerId !== this.activePointerId) {
      this.reset();
      return;
    }

    const start = this.pointerStart;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const distance = Math.hypot(dx, dy);
    const lockedDir = this.lockedDirection;

    this.reset();

    if (distance >= 14) {
      let targetRow = start.row;
      let targetCol = start.col;

      const dir = lockedDir || (Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical');
      if (dir === 'horizontal') {
        targetCol += dx > 0 ? 1 : -1;
      } else {
        targetRow += dy > 0 ? 1 : -1;
      }

      if (
        targetRow >= 0 &&
        targetRow < this.renderer.rows &&
        targetCol >= 0 &&
        targetCol < this.renderer.cols
      ) {
        this.onSwap({ row: start.row, col: start.col }, { row: targetRow, col: targetCol });
        return;
      }
    }

    // Tap fallback
    this.onSelect({ row: start.row, col: start.col });
  };

  private handlePointerCancel = (): void => {
    this.reset();
  };

  private reset(): void {
    if (this.activePointerId !== null) {
      try {
        this.canvas.releasePointerCapture(this.activePointerId);
      } catch {
        // Ignore
      }
    }
    this.pointerStart = null;
    this.lockedDirection = null;
    this.activePointerId = null;
    this.renderer.setDragState(null);
  }

  public destroy(): void {
    this.reset();
    this.unbindEvents();
  }
}
