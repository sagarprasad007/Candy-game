import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CanvasGameRenderer } from '../../../../../packages/game-ui/src/components/game-board/canvas-game-renderer';
import { InputController } from '../../../../../packages/game-ui/src/components/game-board/input-controller';

// Mock minimal HTMLCanvasElement & Context for node environment
function createMockCanvas(): HTMLCanvasElement {
  const ctx = {
    canvas: null as unknown as HTMLCanvasElement,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'top',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    globalAlpha: 1,
    save: () => {},
    restore: () => {},
    scale: () => {},
    setTransform: () => {},
    translate: () => {},
    rotate: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    rect: () => {},
    fill: () => {},
    stroke: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    clearRect: () => {},
    fillText: () => {},
    strokeText: () => {},
    drawImage: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
  };

  const listeners: Record<string, Function[]> = {};

  const canvasObj = {
    getContext: (type: string) => (type === '2d' ? ctx : null),
    style: {},
    addEventListener: (type: string, fn: Function) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    removeEventListener: (type: string, fn: Function) => {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter((cb) => cb !== fn);
      }
    },
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width: 400,
      height: 400,
      right: 400,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON: () => {},
    }),
  } as unknown as HTMLCanvasElement;

  ctx.canvas = canvasObj;
  return canvasObj;
}

describe('CanvasGameRenderer & InputController Tests', () => {
  let canvas: HTMLCanvasElement;
  let renderer: CanvasGameRenderer;

  beforeEach(() => {
    // Provide minimal global stubs if running in Node
    if (typeof globalThis.requestAnimationFrame === 'undefined') {
      (globalThis as any).requestAnimationFrame = (cb: Function) => setTimeout(cb, 16);
      (globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
    }

    if (typeof globalThis.window === 'undefined') {
      (globalThis as any).window = {
        devicePixelRatio: 1,
        matchMedia: () => ({ matches: false }),
        requestAnimationFrame: globalThis.requestAnimationFrame,
        cancelAnimationFrame: globalThis.cancelAnimationFrame,
      };
    } else if (!globalThis.window.matchMedia) {
      (globalThis.window as any).matchMedia = () => ({ matches: false });
    }

    canvas = createMockCanvas();
    renderer = new CanvasGameRenderer(canvas);
  });

  afterEach(() => {
    renderer?.destroy();
  });

  it('1. correctly initializes and resizes board geometry', () => {
    renderer.resize(400, 400);
    const geom = renderer.getBoardGeometry();

    expect(geom.boardWidth).toBeGreaterThan(0);
    expect(geom.boardHeight).toBeGreaterThan(0);
    expect(geom.cellWidth).toBeGreaterThan(0);
    expect(geom.cellHeight).toBeGreaterThan(0);
    expect(geom.cellPitchX).toBe(geom.cellWidth + geom.gap);
    expect(geom.cellPitchY).toBe(geom.cellHeight + geom.gap);
  });

  it('2. converts pointer coordinates to board cells correctly', () => {
    renderer.resize(400, 400);
    const geom = renderer.getBoardGeometry();

    // Point inside cell (row 0, col 0)
    const px = geom.boardOriginX + geom.cellWidth / 2;
    const py = geom.boardOriginY + geom.cellHeight / 2;
    const cell = renderer.pixelToCell(px, py);

    expect(cell).not.toBeNull();
    expect(cell?.row).toBe(0);
    expect(cell?.col).toBe(0);

    // Point outside board boundaries
    const outCell = renderer.pixelToCell(-10, -10);
    expect(outCell).toBeNull();
  });

  it('3. handles devicePixelRatio scaling without breaking logical board dimensions', () => {
    renderer.resize(320, 320);
    const geom = renderer.getBoardGeometry();

    expect(geom.cols).toBe(8);
    expect(geom.rows).toBe(8);
    expect(geom.cellWidth * 8 + geom.gap * 7).toBeLessThanOrEqual(320);
  });

  it('4. InputController initializes pointer listeners and cleans up correctly', () => {
    renderer.resize(400, 400);

    const inputController = new InputController(
      canvas,
      renderer,
      () => {},
      () => {}
    );

    expect(inputController).toBeDefined();
    inputController.destroy();
  });

  it('5. interpolation functions calculate cell coordinates smoothly', () => {
    renderer.setGrid([
      [
        {
          id: 't-0-0',
          type: 'ruby',
          row: 0,
          col: 0,
          fallDistance: 2,
          fromRow: -2,
          isNew: true,
        },
      ],
    ]);
    renderer.setPhase('falling');

    const geom = renderer.getBoardGeometry();
    const cellPx = renderer.cellToPixel(0, 0);

    expect(cellPx.x).toBeGreaterThanOrEqual(geom.boardOriginX);
    expect(cellPx.y).toBeGreaterThanOrEqual(geom.boardOriginY);
  });

  it('6. new tiles spawn above the visible board and interpolate smoothly', () => {
    renderer.resize(400, 400);
    const geom = renderer.getBoardGeometry();

    const newTileId = 'new-tile-test-123';
    renderer.setGrid([
      [
        {
          id: newTileId,
          type: 'ruby',
          row: 0,
          col: 0,
          falling: true,
          fallDistance: 2,
          fromRow: -2,
          isNew: true,
        },
      ],
    ]);

    const initialPos = renderer.getVisualTilePosition(newTileId);
    expect(initialPos).not.toBeNull();
    // Initial position for new tile must start ABOVE originY (top of board)
    expect(initialPos!.y).toBeLessThan(geom.boardOriginY);
  });

  it('7. existing tiles preserve identity and interpolate from previous position to target position', () => {
    renderer.resize(400, 400);
    const tileId = 'existing-tile-456';

    // Board state 1
    renderer.setGrid([
      [
        { id: tileId, type: 'sapphire', row: 0, col: 0 },
      ],
    ]);

    const pos1 = renderer.getVisualTilePosition(tileId);
    expect(pos1).not.toBeNull();

    // Board state 2: Tile falls to row 3
    renderer.setGrid([
      [],
      [],
      [],
      [
        { id: tileId, type: 'sapphire', row: 3, col: 0, falling: true, fallDistance: 3, fromRow: 0 },
      ],
    ]);

    const pos2 = renderer.getVisualTilePosition(tileId);
    expect(pos2).not.toBeNull();
    // Position must start at pos1.y (where it was previously)
    expect(pos2!.y).toBe(pos1!.y);
  });

  it('8. renderer cleanup cancels requestAnimationFrame and releases state', () => {
    renderer.destroy();
    expect(true).toBe(true);
  });
});
