import { Component, Prop, Event, EventEmitter, h, Element } from '@stencil/core';
import { CanvasGameRenderer, type BoardTile, type SwapAnimation, type SpecialEffect } from './canvas-game-renderer';
import { InputController } from './input-controller';

export interface BoardTileData {
  id: string;
  type: string;
  special?: string;
  obstacle?: string;
  row?: number;
  col?: number;
  selected?: boolean;
  matched?: boolean;
  falling?: boolean;
  fallDistance?: number;
  fromRow?: number;
  fromCol?: number;
  isNew?: boolean;
}

@Component({
  tag: 'game-board',
  styleUrl: 'game-board.css',
  shadow: true,
})
export class GameBoard {
  @Element() el!: HTMLElement;

  @Prop() gridData: BoardTileData[][] | string = [];
  @Prop() rows: number = 8;
  @Prop() cols: number = 8;
  @Prop() selectedRow: number = -1;
  @Prop() selectedCol: number = -1;
  @Prop() disabled: boolean = false;
  @Prop() phase: string = 'idle';
  @Prop() swapAnimation: SwapAnimation | string | null = null;
  @Prop() activeEffects: SpecialEffect[] | string = [];
  @Prop() showFps: boolean = false;

  @Event({ eventName: 'tile-swapped' }) tileSwapped!: EventEmitter<{
    from: { row: number; col: number };
    to: { row: number; col: number };
  }>;

  @Event({ eventName: 'game-tile-selected' }) gameTileSelected!: EventEmitter<{
    row: number;
    col: number;
  }>;

  private canvasEl!: HTMLCanvasElement;
  private containerEl!: HTMLElement;
  private renderer?: CanvasGameRenderer;
  private inputController?: InputController;
  private resizeObserver?: ResizeObserver;

  private get parsedGridData(): BoardTile[][] {
    if (typeof this.gridData === 'string') {
      try {
        return JSON.parse(this.gridData);
      } catch (e) {
        return [];
      }
    }
    return (this.gridData as unknown as BoardTile[][]) || [];
  }

  private get parsedSwapAnimation(): SwapAnimation | null {
    if (typeof this.swapAnimation === 'string') {
      try {
        return JSON.parse(this.swapAnimation);
      } catch (e) {
        return null;
      }
    }
    return this.swapAnimation || null;
  }

  private get parsedActiveEffects(): SpecialEffect[] {
    if (typeof this.activeEffects === 'string') {
      try {
        return JSON.parse(this.activeEffects);
      } catch (e) {
        return [];
      }
    }
    return this.activeEffects || [];
  }

  componentDidLoad() {
    if (!this.canvasEl) return;

    this.renderer = new CanvasGameRenderer(this.canvasEl);
    this.updateRendererProps();

    this.inputController = new InputController(
      this.canvasEl,
      this.renderer,
      (from, to) => this.tileSwapped.emit({ from, to }),
      (cell) => this.gameTileSelected.emit(cell)
    );

    if (typeof ResizeObserver !== 'undefined' && this.containerEl) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          this.renderer?.resize(width, height);
        }
      });
      this.resizeObserver.observe(this.containerEl);
    } else {
      const rect = this.containerEl?.getBoundingClientRect();
      if (rect) this.renderer.resize(rect.width, rect.height);
    }
  }

  componentDidUpdate() {
    this.updateRendererProps();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.inputController?.destroy();
    this.renderer?.destroy();
  }

  private updateRendererProps(): void {
    if (!this.renderer) return;

    this.renderer.rows = this.rows;
    this.renderer.cols = this.cols;
    this.renderer.selectedRow = this.selectedRow;
    this.renderer.selectedCol = this.selectedCol;
    this.renderer.disabled = this.disabled;
    this.renderer.showFps = this.showFps;
    this.renderer.setPhase(this.phase);
    this.renderer.setSwapAnimation(this.parsedSwapAnimation);
    this.renderer.setSpecialEffects(this.parsedActiveEffects);
    this.renderer.setGrid(this.parsedGridData);
  }

  render() {
    return (
      <div class={`board-container ${this.disabled ? 'disabled' : ''}`} ref={(el) => (this.containerEl = el as HTMLElement)}>
        <canvas ref={(el) => (this.canvasEl = el as HTMLCanvasElement)} class="board-canvas"></canvas>
      </div>
    );
  }
}

