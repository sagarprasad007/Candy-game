import { Component, Prop, Event, EventEmitter, h, Element, Watch, Method } from '@stencil/core';
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

  @Prop({ attribute: 'grid-data', mutable: true }) gridData: any = [];
  @Prop({ mutable: true }) rows: number = 8;
  @Prop({ mutable: true }) cols: number = 8;
  @Prop({ attribute: 'selected-row', mutable: true }) selectedRow: number = -1;
  @Prop({ attribute: 'selected-col', mutable: true }) selectedCol: number = -1;
  @Prop({ mutable: true }) disabled: boolean = false;
  @Prop({ mutable: true }) phase: string = 'idle';
  @Prop({ attribute: 'swap-animation', mutable: true }) swapAnimation: any = null;
  @Prop({ attribute: 'active-effects', mutable: true }) activeEffects: any = [];
  @Prop({ attribute: 'hint-move', mutable: true }) hintMove: any = null;
  @Prop({ attribute: 'is-fever', mutable: true }) isFever: boolean = false;
  @Prop({ attribute: 'show-fps', mutable: true }) showFps: boolean = false;

  @Watch('gridData')
  @Watch('rows')
  @Watch('cols')
  @Watch('selectedRow')
  @Watch('selectedCol')
  @Watch('disabled')
  @Watch('phase')
  @Watch('swapAnimation')
  @Watch('activeEffects')
  @Watch('hintMove')
  @Watch('isFever')
  @Watch('showFps')
  onPropChange() {
    this.updateRendererProps();
  }

  @Method()
  async forceRefresh() {
    this.updateRendererProps();
  }

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
    const data = this.gridData !== undefined && this.gridData !== null && (Array.isArray(this.gridData) ? this.gridData.length > 0 : true)
      ? this.gridData
      : (this.el as any)?.gridData;

    if (Array.isArray(data)) {
      return data as unknown as BoardTile[][];
    }
    if (typeof data === 'string' && data.trim().length > 0) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return [];
      }
    }
    const attrData = this.el?.getAttribute('grid-data');
    if (attrData && typeof attrData === 'string' && attrData.trim().length > 0) {
      try {
        return JSON.parse(attrData);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  private get parsedSwapAnimation(): SwapAnimation | null {
    const anim = this.swapAnimation ?? (this.el as any)?.swapAnimation;
    if (typeof anim === 'object' && anim !== null) {
      return anim as unknown as SwapAnimation;
    }
    if (typeof anim === 'string' && anim.trim().length > 0) {
      try {
        return JSON.parse(anim);
      } catch (e) {
        return null;
      }
    }
    const attrAnim = this.el?.getAttribute('swap-animation');
    if (attrAnim && typeof attrAnim === 'string' && attrAnim.trim().length > 0) {
      try {
        return JSON.parse(attrAnim);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  private get parsedActiveEffects(): SpecialEffect[] {
    const effects = this.activeEffects ?? (this.el as any)?.activeEffects;
    if (Array.isArray(effects)) {
      return effects as unknown as SpecialEffect[];
    }
    if (typeof effects === 'string' && effects.trim().length > 0) {
      try {
        return JSON.parse(effects);
      } catch (e) {
        return [];
      }
    }
    const attrEffects = this.el?.getAttribute('active-effects');
    if (attrEffects && typeof attrEffects === 'string' && attrEffects.trim().length > 0) {
      try {
        return JSON.parse(attrEffects);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  componentDidLoad() {
    if (!this.canvasEl) return;

    this.renderer = new CanvasGameRenderer(this.canvasEl);

    const rect = this.containerEl?.getBoundingClientRect();
    const w = rect?.width || this.containerEl?.clientWidth || 360;
    const h = rect?.height || this.containerEl?.clientHeight || 360;
    this.renderer.resize(w > 0 ? w : 360, h > 0 ? h : 360);

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
          if (width > 0 && height > 0) {
            this.renderer?.resize(width, height);
          }
        }
      });
      this.resizeObserver.observe(this.containerEl);
    }
  }

  componentWillRender() {
    this.updateRendererProps();
  }

  componentDidRender() {
    this.updateRendererProps();
  }

  componentDidUpdate() {
    this.updateRendererProps();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.inputController?.destroy();
    this.renderer?.destroy();
  }

  private get parsedHintMove(): { fromRow: number; fromCol: number; toRow: number; toCol: number } | null {
    const hint = this.hintMove ?? (this.el as any)?.hintMove;
    if (typeof hint === 'object' && hint !== null) {
      return hint as any;
    }
    if (typeof hint === 'string' && hint.trim().length > 0) {
      try {
        return JSON.parse(hint);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  private updateRendererProps(): void {
    if (!this.renderer) return;

    this.renderer.rows = this.rows;
    this.renderer.cols = this.cols;
    this.renderer.selectedRow = this.selectedRow;
    this.renderer.selectedCol = this.selectedCol;
    this.renderer.disabled = this.disabled;
    this.renderer.isFever = this.isFever;
    this.renderer.showFps = this.showFps;
    this.renderer.hintMove = this.parsedHintMove;
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

