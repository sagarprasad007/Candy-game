export interface BoardTile {
  id: string;
  type: string;
  special?: 'none' | 'line-h' | 'line-v' | 'bomb' | 'prism' | string;
  obstacle?: 'none' | 'ice-1' | 'ice-2' | string;
  jelly?: 'none' | 'single' | 'double' | string;
  row: number;
  col: number;
  matched?: boolean;
  falling?: boolean;
  fallDistance?: number;
  fromRow?: number;
  fromCol?: number;
  isNew?: boolean;
}

export interface SwapAnimation {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  reversing?: boolean;
}

export interface SpecialEffect {
  type: 'line-h' | 'line-v' | 'bomb' | 'prism';
  row?: number;
  col?: number;
  targetType?: string;
}

export interface DragState {
  fromRow: number;
  fromCol: number;
  dx: number;
  dy: number;
  targetRow: number;
  targetCol: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface VisualTileState {
  id: string;
  type: string;
  special?: string;
  obstacle?: string;
  jelly?: string;
  row: number;
  col: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  duration: number;
  delay: number;
  isNew?: boolean;
  matched?: boolean;
  scaleX?: number;
  scaleY?: number;
}

export interface CandyTheme {
  bgStart: string;
  bgEnd: string;
  symbol: string;
}

const CANDY_THEMES: Record<string, CandyTheme> = {
  ruby: { bgStart: '#ff5252', bgEnd: '#d90429', symbol: '🍬' },
  red: { bgStart: '#ff5252', bgEnd: '#d90429', symbol: '🍬' },
  sapphire: { bgStart: '#38bdf8', bgEnd: '#0284c7', symbol: '🍭' },
  blue: { bgStart: '#38bdf8', bgEnd: '#0284c7', symbol: '🍭' },
  emerald: { bgStart: '#34d399', bgEnd: '#059669', symbol: '🍏' },
  green: { bgStart: '#34d399', bgEnd: '#059669', symbol: '🍏' },
  amber: { bgStart: '#fbbf24', bgEnd: '#d97706', symbol: '🍊' },
  yellow: { bgStart: '#fbbf24', bgEnd: '#d97706', symbol: '🍊' },
  amethyst: { bgStart: '#c084fc', bgEnd: '#7e22ce', symbol: '🍇' },
  purple: { bgStart: '#c084fc', bgEnd: '#7e22ce', symbol: '🍇' },
  default: { bgStart: '#f472b6', bgEnd: '#db2777', symbol: '🍩' },
};

export class CanvasGameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number = 1;

  public width: number = 400;
  public height: number = 400;
  public rows: number = 8;
  public cols: number = 8;

  public cellWidth: number = 45;
  public cellHeight: number = 45;
  public cellPitchX: number = 50;
  public cellPitchY: number = 50;
  public originX: number = 10;
  public originY: number = 10;
  public gap: number = 8;

  public grid: BoardTile[][] = [];
  public selectedRow: number = -1;
  public selectedCol: number = -1;
  public swapAnimation: SwapAnimation | null = null;
  public activeEffects: SpecialEffect[] = [];
  public phase: string = 'idle';
  public disabled: boolean = false;
  public showFps: boolean = false;
  public isFever = false;
  public isDirty: boolean = true;

  private dragState: DragState | null = null;
  private particles: Particle[] = [];
  private visualTiles: Map<string, VisualTileState> = new Map();
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private phaseStartTime: number = 0;
  private swapStartTime: number = 0;
  private fps: number = 60;
  private frameTimeMs: number = 16.6;
  private prefersReducedMotion: boolean = false;

  // Screen shake & hit stop state
  private shakeEndTime: number = 0;
  private shakeIntensity: number = 0;
  private hitStopUntil: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    this.startLoop();
  }

  public triggerHaptic(type: 'select' | 'swap' | 'special' | 'win' | 'loss') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'select') navigator.vibrate(12);
        else if (type === 'swap') navigator.vibrate(25);
        else if (type === 'special') navigator.vibrate([40, 30, 60]);
        else if (type === 'win') navigator.vibrate([50, 50, 100, 50, 150]);
        else if (type === 'loss') navigator.vibrate([100, 50, 100]);
      } catch (_) {}
    }
  }

  public triggerScreenShake(intensity = 3, durationMs = 120) {
    if (this.prefersReducedMotion) return;
    this.shakeIntensity = intensity;
    this.shakeEndTime = performance.now() + durationMs;
    this.isDirty = true;
  }

  public triggerHitStop(durationMs = 70) {
    if (this.prefersReducedMotion) return;
    this.hitStopUntil = performance.now() + durationMs;
    this.isDirty = true;
  }

  public markDirty() {
    this.isDirty = true;
  }

  public resize(cssWidth: number, cssHeight: number): void {
    if (cssWidth <= 0 || cssHeight <= 0) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = cssWidth;
    this.height = cssHeight;

    this.canvas.width = Math.round(cssWidth * this.dpr);
    this.canvas.height = Math.round(cssHeight * this.dpr);
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;

    if (typeof this.ctx.setTransform === 'function') {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    } else {
      this.ctx.scale(this.dpr, this.dpr);
    }
    this.recalculateGeometry();
    this.syncVisualTiles(true);
    this.isDirty = true;
  }

  public recalculateGeometry(): void {
    const pad = 12;
    const availW = Math.max(100, this.width - pad * 2);
    const availH = Math.max(100, this.height - pad * 2);

    this.gap = Math.max(4, Math.floor(Math.min(availW, availH) / (this.cols * 6)));

    const sizeW = (availW - (this.cols - 1) * this.gap) / this.cols;
    const sizeH = (availH - (this.rows - 1) * this.gap) / this.rows;
    const tileSize = Math.max(10, Math.floor(Math.min(sizeW, sizeH)));

    this.cellWidth = tileSize;
    this.cellHeight = tileSize;
    this.cellPitchX = tileSize + this.gap;
    this.cellPitchY = tileSize + this.gap;

    const gridW = this.cols * this.cellPitchX - this.gap;
    const gridH = this.rows * this.cellPitchY - this.gap;

    this.originX = Math.floor((this.width - gridW) / 2);
    this.originY = Math.floor((this.height - gridH) / 2);
  }

  public getBoardGeometry() {
    return {
      cols: this.cols,
      rows: this.rows,
      boardWidth: this.width,
      boardHeight: this.height,
      cellWidth: this.cellWidth,
      cellHeight: this.cellHeight,
      cellPitchX: this.cellPitchX,
      cellPitchY: this.cellPitchY,
      boardOriginX: this.originX,
      boardOriginY: this.originY,
      gap: this.gap,
    };
  }

  public pixelToCell(x: number, y: number): { row: number; col: number } | null {
    const col = Math.floor((x - this.originX) / this.cellPitchX);
    const row = Math.floor((y - this.originY) / this.cellPitchY);

    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      return { row, col };
    }
    return null;
  }

  public cellToPixel(row: number, col: number): { x: number; y: number } {
    return {
      x: this.originX + col * this.cellPitchX,
      y: this.originY + row * this.cellPitchY,
    };
  }

  public setGrid(grid: BoardTile[][]): void {
    this.grid = grid || [];
    this.syncVisualTiles(false);
    this.isDirty = true;
  }

  public getVisualTilePosition(id: string): { x: number; y: number } | null {
    const vt = this.visualTiles.get(id);
    return vt ? { x: vt.currentX, y: vt.currentY } : null;
  }

  private syncVisualTiles(forceSnap: boolean = false): void {
    if (!this.grid || this.grid.length === 0) return;
    const now = performance.now();
    const activeIds = new Set<string>();

    for (let r = 0; r < this.rows; r++) {
      if (!this.grid[r]) continue;
      for (let c = 0; c < this.cols; c++) {
        const tile = this.grid[r][c];
        if (!tile || !tile.id || !tile.type) continue;
        activeIds.add(tile.id);

        const targetX = this.originX + c * this.cellPitchX;
        const targetY = this.originY + r * this.cellPitchY;

        if (this.visualTiles.has(tile.id)) {
          const existing = this.visualTiles.get(tile.id)!;
          existing.type = tile.type;
          existing.special = tile.special;
          existing.obstacle = tile.obstacle;
          existing.jelly = tile.jelly;
          existing.matched = tile.matched;
          existing.row = r;
          existing.col = c;

          if (forceSnap) {
            existing.startX = targetX;
            existing.startY = targetY;
            existing.currentX = targetX;
            existing.currentY = targetY;
            existing.targetX = targetX;
            existing.targetY = targetY;
          } else if (tile.falling || Math.abs(existing.targetY - targetY) > 2 || Math.abs(existing.targetX - targetX) > 2) {
            existing.startX = existing.currentX;
            existing.startY = existing.currentY;
            existing.targetX = targetX;
            existing.targetY = targetY;
            existing.startTime = now;
            existing.duration = 300;
            existing.delay = c * 12;
            existing.isNew = false;
          }
        } else {
          // Newly spawned tile
          if (forceSnap) {
            this.visualTiles.set(tile.id, {
              id: tile.id,
              type: tile.type,
              special: tile.special,
              obstacle: tile.obstacle,
              jelly: tile.jelly,
              row: r,
              col: c,
              startX: targetX,
              startY: targetY,
              targetX,
              targetY,
              currentX: targetX,
              currentY: targetY,
              startTime: now,
              duration: 0,
              delay: 0,
              isNew: false,
              matched: tile.matched,
            });
          } else {
            let spawnRow = tile.fromRow !== undefined ? tile.fromRow : -Math.max(1, tile.fallDistance || 1);
            if (spawnRow >= 0) {
              spawnRow = -1 - (this.rows - r);
            }

            const startX = targetX;
            const startY = this.originY + spawnRow * this.cellPitchY;

            this.visualTiles.set(tile.id, {
              id: tile.id,
              type: tile.type,
              special: tile.special,
              obstacle: tile.obstacle,
              jelly: tile.jelly,
              row: r,
              col: c,
              startX,
              startY,
              targetX,
              targetY,
              currentX: startX,
              currentY: startY,
              startTime: now,
              duration: 320,
              delay: Math.max(0, (this.rows - r)) * 15,
              isNew: true,
              matched: tile.matched,
            });
          }
        }
      }
    }

    // Clean up removed tiles
    for (const [id] of this.visualTiles) {
      if (!activeIds.has(id)) {
        this.visualTiles.delete(id);
      }
    }
  }

  public setPhase(phase: string): void {
    if (this.phase !== phase) {
      this.phase = phase;
      this.phaseStartTime = performance.now();
      this.isDirty = true;
    }
  }

  public setSwapAnimation(anim: SwapAnimation | null): void {
    if (JSON.stringify(this.swapAnimation) !== JSON.stringify(anim)) {
      this.swapAnimation = anim;
      if (anim) {
        this.swapStartTime = performance.now();
        this.triggerHaptic('swap');
      }
      this.isDirty = true;
    }
  }

  public setDragState(drag: DragState | null): void {
    this.dragState = drag;
    this.isDirty = true;
  }

  public setSpecialEffects(effects: SpecialEffect[]): void {
    this.activeEffects = effects || [];
    if (effects && effects.length > 0) {
      this.triggerHitStop(70);
      this.triggerScreenShake(4, 150);
      this.triggerHaptic('special');
      if (!this.prefersReducedMotion) {
        effects.forEach((eff) => this.spawnSpecialParticles(eff));
      }
    }
    this.isDirty = true;
  }

  private spawnSpecialParticles(eff: SpecialEffect): void {
    if (this.particles.length > 60) return;

    if (eff.type === 'bomb' && eff.row !== undefined && eff.col !== undefined) {
      const cx = this.originX + (eff.col + 0.5) * this.cellPitchX;
      const cy = this.originY + (eff.row + 0.5) * this.cellPitchY;
      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        this.particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 4,
          color: i % 2 === 0 ? '#fbbf24' : '#f43f5e',
          alpha: 1,
          life: 0,
          maxLife: 20 + Math.random() * 15,
        });
      }
    } else if (eff.type === 'prism') {
      for (let i = 0; i < 20; i++) {
        this.particles.push({
          x: this.originX + Math.random() * (this.cols * this.cellPitchX),
          y: this.originY + Math.random() * (this.rows * this.cellPitchY),
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          size: 4 + Math.random() * 3,
          color: `hsl(${Math.random() * 360}, 90%, 65%)`,
          alpha: 1,
          life: 0,
          maxLife: 25,
        });
      }
    }
  }

  private startLoop = (): void => {
    const loop = (now: number) => {
      if (this.lastTime) {
        const delta = now - this.lastTime;
        this.frameTimeMs = delta;
        this.fps = Math.round(1000 / Math.max(delta, 1));
      }
      this.lastTime = now;

      // Hit stop logic
      if (now < this.hitStopUntil) {
        const reqFn = typeof window !== 'undefined' ? window.requestAnimationFrame.bind(window) : (cb: Function) => setTimeout(cb, 16);
        this.animFrameId = reqFn(loop);
        return;
      }

      // Performance dirty flag check to avoid wasting battery on idle board
      let activeAnimation = false;
      for (const vTile of this.visualTiles.values()) {
        if (vTile.currentX !== vTile.targetX || vTile.currentY !== vTile.targetY || vTile.matched) {
          activeAnimation = true;
          break;
        }
      }

      if (
        this.isDirty ||
        activeAnimation ||
        this.dragState ||
        this.swapAnimation ||
        this.particles.length > 0 ||
        this.isFever ||
        now < this.shakeEndTime
      ) {
        this.render(now);
        this.updateParticles();

        if (!activeAnimation && this.particles.length === 0 && !this.dragState && !this.swapAnimation && !this.isFever) {
          this.isDirty = false;
        }
      }

      const reqFn = typeof window !== 'undefined' ? window.requestAnimationFrame.bind(window) : (cb: Function) => setTimeout(cb, 16);
      this.animFrameId = reqFn(loop);
    };
    const reqFn = typeof window !== 'undefined' ? window.requestAnimationFrame.bind(window) : (cb: Function) => setTimeout(cb, 16);
    this.animFrameId = reqFn(loop);
  };

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  public destroy(): void {
    if (this.animFrameId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.animFrameId);
    }
  }

  private render(now: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, this.width, this.height);

    // Apply Screen Shake if active
    if (now < this.shakeEndTime && !this.prefersReducedMotion) {
      const progress = (this.shakeEndTime - now) / 150;
      const rx = (Math.random() - 0.5) * this.shakeIntensity * progress;
      const ry = (Math.random() - 0.5) * this.shakeIntensity * progress;
      ctx.translate(rx, ry);
    }

    // 1. Draw Board Frame & Background Grid
    this.drawBoardBackground(now);

    // 2. Update Visual Positions & Draw Board Tiles
    for (const vTile of this.visualTiles.values()) {
      this.updateTilePosition(vTile, now);
      this.drawVisualTile(vTile, now);
    }

    // 3. Draw Board-Wide Special Effects
    this.drawActiveSpecialEffects(now);

    // 4. Draw Particles
    this.drawParticles();

    // 5. Draw Optional Performance Overlay
    if (this.showFps) {
      this.drawFpsOverlay();
    }
    ctx.restore();
  }

  private updateTilePosition(vTile: VisualTileState, now: number): void {
    const elapsed = now - (vTile.startTime + vTile.delay);
    if (elapsed <= 0) {
      vTile.currentX = vTile.startX;
      vTile.currentY = vTile.startY;
      vTile.scaleX = 1;
      vTile.scaleY = 1;
      return;
    }

    if (vTile.duration <= 0) {
      vTile.currentX = vTile.targetX;
      vTile.currentY = vTile.targetY;
      vTile.scaleX = 1;
      vTile.scaleY = 1;
      return;
    }

    const progress = Math.min(1, Math.max(0, elapsed / vTile.duration));
    let ease = 1 - Math.pow(1 - progress, 3);

    // Cartoon landing bounce / squash at end of fall
    if (progress > 0.85 && progress <= 1 && Math.abs(vTile.targetY - vTile.startY) > 5) {
      const settleProgress = (progress - 0.85) / 0.15;
      const bounceOffset = Math.sin(settleProgress * Math.PI) * 2.5;
      vTile.currentX = vTile.startX + (vTile.targetX - vTile.startX) * ease;
      vTile.currentY = vTile.startY + (vTile.targetY - vTile.startY) * ease + bounceOffset;

      if (!this.prefersReducedMotion) {
        vTile.scaleY = 0.85 + 0.15 * settleProgress;
        vTile.scaleX = 1.1 - 0.1 * settleProgress;
      }
    } else {
      vTile.currentX = vTile.startX + (vTile.targetX - vTile.startX) * ease;
      vTile.currentY = vTile.startY + (vTile.targetY - vTile.startY) * ease;
      vTile.scaleX = 1;
      vTile.scaleY = 1;
    }
  }

  private drawBoardBackground(now: number): void {
    const ctx = this.ctx;
    const gridW = this.cols * this.cellPitchX - this.gap;
    const gridH = this.rows * this.cellPitchY - this.gap;

    if (this.isFever) {
      ctx.save();
      ctx.strokeStyle = `hsl(${(now * 0.15) % 360}, 100%, 60%)`;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 16;
      ctx.strokeRect(this.originX - 6, this.originY - 6, gridW + 12, gridH + 12);
      ctx.restore();

      if (Math.random() < 0.25 && this.particles.length < 50 && !this.prefersReducedMotion) {
        this.particles.push({
          x: this.originX + Math.random() * gridW,
          y: this.originY + Math.random() * gridH,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 2,
          size: 3 + Math.random() * 3,
          color: '#fbbf24',
          alpha: 1,
          life: 0,
          maxLife: 25,
        });
      }
    }

    // Draw background cells
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = this.originX + c * this.cellPitchX;
        const y = this.originY + r * this.cellPitchY;
        const radius = 12;

        ctx.beginPath();
        ctx.roundRect(x, y, this.cellWidth, this.cellHeight, radius);

        if (this.isFever) {
          const hue = (now * 0.05 + (r + c) * 20) % 360;
          ctx.fillStyle = `hsla(${hue}, 80%, 95%, 0.65)`;
        } else {
          ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 241, 242, 0.35)';
        }
        ctx.fill();
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  private drawVisualTile(vTile: VisualTileState, now: number): void {
    const ctx = this.ctx;
    if (!vTile.type) return;

    let posX = vTile.currentX;
    let posY = vTile.currentY;
    let scaleX = vTile.scaleX || 1;
    let scaleY = vTile.scaleY || 1;
    let alpha = 1;
    let showWhiteFlash = false;

    const r = vTile.row;
    const c = vTile.col;

    // Check Drag Preview State
    const isDragged = this.dragState && this.dragState.fromRow === r && this.dragState.fromCol === c;
    const isTargetReaction = this.dragState && this.dragState.targetRow === r && this.dragState.targetCol === c;

    if (isDragged && this.dragState) {
      posX += this.dragState.dx;
      posY += this.dragState.dy;
      scaleX = 1.12;
      scaleY = 1.12;
    } else if (isTargetReaction && this.dragState) {
      posX -= this.dragState.dx * 0.35;
      posY -= this.dragState.dy * 0.35;
      scaleX = 0.96;
      scaleY = 0.96;
    }

    // Check Swap Animation State (with 15ms anticipation squash)
    if (this.swapAnimation) {
      const { fromRow, fromCol, toRow, toCol, reversing } = this.swapAnimation;
      const elapsed = now - this.swapStartTime;
      const duration = 180;

      if (elapsed < 20 && !this.prefersReducedMotion) {
        // Anticipation squash on start of swap move
        scaleX = 0.92;
        scaleY = 0.92;
      } else {
        let progress = Math.min(1, Math.max(0, elapsed / duration));

        if (reversing) {
          progress = 1 - progress;
        }

        const easedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        if (fromRow === r && fromCol === c) {
          const startX = this.originX + toCol * this.cellPitchX;
          const startY = this.originY + toRow * this.cellPitchY;
          const endX = this.originX + fromCol * this.cellPitchX;
          const endY = this.originY + fromRow * this.cellPitchY;
          posX = startX + (endX - startX) * easedProgress;
          posY = startY + (endY - startY) * easedProgress;
          scaleX = 1.08;
          scaleY = 1.08;
        } else if (toRow === r && toCol === c) {
          const startX = this.originX + fromCol * this.cellPitchX;
          const startY = this.originY + fromRow * this.cellPitchY;
          const endX = this.originX + toCol * this.cellPitchX;
          const endY = this.originY + toRow * this.cellPitchY;
          posX = startX + (endX - startX) * easedProgress;
          posY = startY + (endY - startY) * easedProgress;
          scaleX = 1.08;
          scaleY = 1.08;
        }
      }
    }

    // Newly spawned tile scale & alpha entry effect
    if (vTile.isNew) {
      const elapsed = now - (vTile.startTime + vTile.delay);
      if (elapsed > 0 && vTile.duration > 0) {
        const progress = Math.min(1, Math.max(0, elapsed / vTile.duration));
        scaleX = 0.85 + progress * 0.15;
        scaleY = 0.85 + progress * 0.15;
        alpha = Math.min(1, 0.4 + progress * 0.6);
      }
    }

    // Check Selection State
    const isSelected = this.selectedRow === r && this.selectedCol === c;
    if (isSelected && !isDragged) {
      const pulse = Math.sin(now * 0.008) * 0.04;
      scaleX = 1.12 + pulse;
      scaleY = 1.12 + pulse;
    }

    // Match Pop Punch Animation: 1 -> 1.35 (60ms ease-out) -> 0 (140ms ease-in)
    if (vTile.matched) {
      const elapsed = now - this.phaseStartTime;
      if (elapsed <= 60) {
        const p = elapsed / 60;
        const s = 1 + (1 - Math.pow(1 - p, 2)) * 0.35; // punch to 1.35x
        scaleX = s;
        scaleY = s;
        if (p > 0.8 && (vTile.special !== 'none' || this.phase === 'cascade')) {
          showWhiteFlash = true;
        }
      } else {
        const p = Math.min(1, (elapsed - 60) / 140);
        const s = 1.35 * (1 - p * p);
        scaleX = Math.max(0, s);
        scaleY = Math.max(0, s);
        alpha = 1 - p;
      }
    }

    // Render Tile Card on Canvas
    const theme = CANDY_THEMES[vTile.type] || CANDY_THEMES.default;
    const w = this.cellWidth * scaleX;
    const h = this.cellHeight * scaleY;
    const cx = posX + this.cellWidth / 2;
    const cy = posY + this.cellHeight / 2;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(cx, cy);

    const radius = 14 * Math.min(scaleX, scaleY);

    // Feature 1: Render Jelly Layer Puddle UNDER Tile Card
    if (vTile.jelly && vTile.jelly !== 'none') {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, radius + 2);
      if (vTile.jelly === 'double') {
        ctx.fillStyle = 'rgba(192, 38, 211, 0.75)';
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = 'rgba(236, 72, 153, 0.45)';
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    // Rounded rectangle card path
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, radius);

    // Tile Shadow & Glow
    if (isSelected || isDragged) {
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 16;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 4;
    }

    // Gradient Background Fill (or Peak 1-Frame White Flash)
    if (showWhiteFlash) {
      ctx.fillStyle = '#ffffff';
    } else {
      const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      grad.addColorStop(0, theme.bgStart);
      grad.addColorStop(1, theme.bgEnd);
      ctx.fillStyle = grad;
    }
    ctx.fill();

    // Glossy Inner Highlight
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = 2 * Math.min(scaleX, scaleY);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.stroke();

    // Render Symbol / Emoji
    ctx.font = `${Math.round(24 * Math.min(scaleX, scaleY))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(theme.symbol, 0, 2);

    // Render Special Badge Overlay
    if (vTile.special && vTile.special !== 'none') {
      ctx.beginPath();
      ctx.arc(w / 2 - 8 * scaleX, -h / 2 + 8 * scaleY, 9 * Math.min(scaleX, scaleY), 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.fillStyle = '#e11d48';
      ctx.font = `bold ${Math.round(11 * Math.min(scaleX, scaleY))}px sans-serif`;
      const badgeIcon =
        vTile.special === 'line-h' ? '↔' : vTile.special === 'line-v' ? '↕' : vTile.special === 'bomb' ? '💣' : '🍩';
      ctx.fillText(badgeIcon, w / 2 - 8 * scaleX, -h / 2 + 9 * scaleY);
    }

    // Translucent Crystalline Ice & Frozen Jelly Obstacle Layer (Candy remains partially visible underneath)
    if (vTile.obstacle && vTile.obstacle !== 'none') {
      ctx.save();
      const isDamaged = vTile.obstacle === 'ice-1';
      const shimmerOffset = !this.prefersReducedMotion ? Math.sin(now * 0.003 + r * 0.5 + c * 0.5) * (w * 0.2) : 0;

      // Crystalline Ice Outer Glow
      ctx.shadowColor = 'rgba(56, 189, 248, 0.75)';
      ctx.shadowBlur = isDamaged ? 6 : 12;

      // Outer Rounded Crystal Shell
      ctx.beginPath();
      ctx.roundRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, radius);

      // Translucent Ice Gradient
      const iceGrad = ctx.createLinearGradient(-w / 2 + shimmerOffset, -h / 2, w / 2 + shimmerOffset, h / 2);
      if (isDamaged) {
        iceGrad.addColorStop(0, 'rgba(224, 242, 254, 0.55)');
        iceGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.45)');
        iceGrad.addColorStop(1, 'rgba(125, 211, 252, 0.35)');
      } else {
        iceGrad.addColorStop(0, 'rgba(224, 242, 254, 0.78)');
        iceGrad.addColorStop(0.4, 'rgba(186, 230, 253, 0.65)');
        iceGrad.addColorStop(1, 'rgba(56, 189, 248, 0.55)');
      }
      ctx.fillStyle = iceGrad;
      ctx.fill();

      // Crystalline Border Highlight
      ctx.shadowBlur = 0;
      ctx.lineWidth = 2.5 * Math.min(scaleX, scaleY);
      ctx.strokeStyle = isDamaged ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.95)';
      ctx.stroke();

      // Inner Glossy Highlight Curve
      ctx.beginPath();
      ctx.ellipse(-w * 0.1, -h * 0.25, w * 0.32, h * 0.12, Math.PI / 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();

      // Visible Vector Crack Paths (Draws on damaged ice-1 or subtle facets on ice-2)
      ctx.beginPath();
      if (isDamaged) {
        // Deep Shatter Cracks
        ctx.moveTo(-w * 0.38, -h * 0.32);
        ctx.lineTo(-w * 0.05, -h * 0.02);
        ctx.lineTo(w * 0.35, -h * 0.35);
        ctx.moveTo(-w * 0.05, -h * 0.02);
        ctx.lineTo(-w * 0.15, h * 0.38);
        ctx.moveTo(-w * 0.05, -h * 0.02);
        ctx.lineTo(w * 0.32, h * 0.22);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 2.8 * Math.min(scaleX, scaleY);
      } else {
        // Subtle Crystalline Facet Lines
        ctx.moveTo(-w * 0.3, -h * 0.3);
        ctx.lineTo(-w * 0.1, -h * 0.1);
        ctx.lineTo(w * 0.25, -h * 0.28);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5 * Math.min(scaleX, scaleY);
      }
      ctx.stroke();

      // Internal Floating Ice Crystals Sparkle (Animated if motion enabled)
      if (!this.prefersReducedMotion && !isDamaged) {
        const sparkleScale = 0.8 + Math.sin(now * 0.006 + r * 2) * 0.25;
        ctx.save();
        ctx.translate(w * 0.2, -h * 0.15);
        ctx.scale(sparkleScale, sparkleScale);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  private drawActiveSpecialEffects(now: number): void {
    const ctx = this.ctx;
    if (!this.activeEffects || this.activeEffects.length === 0) return;

    const elapsed = now - this.phaseStartTime;
    const progress = Math.min(1, Math.max(0, elapsed / 260));
    const alpha = 1 - progress;

    this.activeEffects.forEach((eff) => {
      ctx.save();
      ctx.globalAlpha = alpha;

      if (eff.type === 'line-h' && eff.row !== undefined) {
        const y = this.originY + eff.row * this.cellPitchY + this.cellHeight / 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.fillRect(this.originX, y - 6, this.cols * this.cellPitchX - this.gap, 12);
      } else if (eff.type === 'line-v' && eff.col !== undefined) {
        const x = this.originX + eff.col * this.cellPitchX + this.cellWidth / 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.fillRect(x - 6, this.originY, 12, this.rows * this.cellPitchY - this.gap);
      }
      ctx.restore();
    });
  }

  private drawParticles(): void {
    const ctx = this.ctx;
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private drawFpsOverlay(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(8, 8, 85, 24);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${this.fps} FPS`, 14, 24);
    ctx.restore();
  }
}

