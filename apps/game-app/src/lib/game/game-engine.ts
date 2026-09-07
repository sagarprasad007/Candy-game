import { GameBoardLogic, cloneGrid, type Grid, type TileData } from './board';
import { MatchDetector } from './match-detector';
import { ScoringSystem } from './scoring';
import { LevelManager, type LevelConfig } from './level-manager';

export type GamePhase =
  | 'idle'
  | 'swapping'
  | 'invalid-swap'
  | 'matching'
  | 'removing'
  | 'falling'
  | 'refilling'
  | 'cascade'
  | 'won'
  | 'lost';

export interface SpecialEffect {
  type: 'line-h' | 'line-v' | 'bomb' | 'prism';
  row?: number;
  col?: number;
  targetType?: string;
}

export interface GameEngineState {
  levelConfig: LevelConfig;
  grid: Grid;
  score: number;
  remainingMoves: number;
  collectedCount: number;
  destroyedObstacles: number;
  comboCount: number;
  streakCount: number;
  isFeverMode: boolean;
  feverMeter: number;
  isProcessing: boolean;
  status: 'playing' | 'won' | 'lost';
  phase: GamePhase;
  swapAnimation?: { fromRow: number; fromCol: number; toRow: number; toCol: number; reversing?: boolean } | null;
  bannerMessage?: string;
  activeEffects?: SpecialEffect[];
}

export class GameEngine {
  boardLogic: GameBoardLogic;
  matchDetector: MatchDetector;
  scoringSystem: ScoringSystem;
  levelManager: LevelManager;
  state: GameEngineState;
  onCascade?: (combo: number) => void;

  constructor(levelId: number) {
    this.levelManager = new LevelManager();
    const config = this.levelManager.getLevel(levelId) || this.levelManager.getLevel(1)!;

    this.boardLogic = new GameBoardLogic(config.boardRows, config.boardCols);
    this.matchDetector = new MatchDetector();
    this.scoringSystem = new ScoringSystem();

    // Place initial ice block obstacles if specified in level config
    if (config.initialIceBlocks) {
      config.initialIceBlocks.forEach((ice) => {
        if (this.boardLogic.grid[ice.row] && this.boardLogic.grid[ice.row][ice.col]) {
          this.boardLogic.grid[ice.row][ice.col].obstacle = ice.state;
        }
      });
    }

    this.state = {
      levelConfig: config,
      grid: cloneGrid(this.boardLogic.grid),
      score: 0,
      remainingMoves: config.moves,
      collectedCount: 0,
      destroyedObstacles: 0,
      comboCount: 0,
      streakCount: 0,
      isFeverMode: false,
      feverMeter: 0,
      isProcessing: false,
      status: 'playing',
      phase: 'idle',
      swapAnimation: null,
      activeEffects: [],
    };
  }

  public onStateChange?: (state: GameEngineState) => void;

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  async executeMove(r1: number, c1: number, r2: number, c2: number): Promise<boolean> {
    if (this.state.isProcessing || this.state.status !== 'playing') return false;

    this.state.isProcessing = true;
    this.state.bannerMessage = undefined; // FIX #9 — Clear banner message at start of move
    this.state.comboCount = 0;
    this.state.remainingMoves--;
    this.state.phase = 'swapping';
    this.state.swapAnimation = { fromRow: r1, fromCol: c1, toRow: r2, toCol: c2, reversing: false };

    // Perform swap in logical board
    this.boardLogic.swapTiles(r1, c1, r2, c2);
    this.state.grid = cloneGrid(this.boardLogic.grid);
    this.notifyStateChange();

    // 180ms swap animation duration
    await new Promise((res) => setTimeout(res, 180));

    // Check for matches
    const matches = this.matchDetector.findMatches(
      this.boardLogic.grid,
      this.boardLogic.rows,
      this.boardLogic.cols,
      { r1, c1, r2, c2 }
    );

    if (matches.matchedTiles.length === 0) {
      // Revert invalid swap after a reverse animation delay
      this.state.phase = 'invalid-swap';
      this.state.swapAnimation = { fromRow: r1, fromCol: c1, toRow: r2, toCol: c2, reversing: true };
      this.notifyStateChange();
      await new Promise((res) => setTimeout(res, 180));

      this.boardLogic.swapTiles(r1, c1, r2, c2);
      this.state.grid = cloneGrid(this.boardLogic.grid);
      this.state.remainingMoves++; // refund invalid move
      this.state.streakCount = 0;
      this.state.isFeverMode = false;
      this.state.feverMeter = 0;
      this.state.phase = 'idle';
      this.state.swapAnimation = null;
      this.state.isProcessing = false;
      this.notifyStateChange();
      return false;
    }

    this.state.streakCount++;
    if (this.state.streakCount >= 4) {
      this.state.isFeverMode = true;
      this.state.bannerMessage = '🔥 FEVER MODE ACTIVE! x2 BONUS SCORE! 🔥';
    }
    this.state.feverMeter = Math.min(100, (this.state.streakCount / 4) * 100);
    this.state.swapAnimation = null;
    this.notifyStateChange();

    // Process cascading match loop
    let currentCombo = 1;
    let hasMoreMatches = true;

    while (hasMoreMatches) {
      const matchResult = this.matchDetector.findMatches(
        this.boardLogic.grid,
        this.boardLogic.rows,
        this.boardLogic.cols,
        currentCombo === 1 ? { r1, c1, r2, c2 } : undefined
      );

      if (matchResult.matchedTiles.length === 0) {
        hasMoreMatches = false;
        break;
      }

      // FIX #4 — Trigger cascade sound hook per resolution stage
      this.onCascade?.(currentCombo);

      this.state.comboCount = currentCombo;
      this.state.phase = currentCombo === 1 ? 'matching' : 'cascade';

      // FIX #5 — Populate board-wide active visual effects
      const effects: SpecialEffect[] = [];
      matchResult.matchedTiles.forEach((t) => {
        if (t.special === 'line-h') effects.push({ type: 'line-h', row: t.row });
        if (t.special === 'line-v') effects.push({ type: 'line-v', col: t.col });
        if (t.special === 'bomb') effects.push({ type: 'bomb', row: t.row, col: t.col });
        if (t.special === 'prism') effects.push({ type: 'prism', targetType: t.type });
      });
      this.state.activeEffects = effects;

      // Calculate score & combo
      const scoreBreakdown = this.scoringSystem.calculateScore(
        matchResult.matchedTiles,
        currentCombo
      );
      this.state.score += scoreBreakdown.points;
      if (scoreBreakdown.bonusText) {
        this.state.bannerMessage = scoreBreakdown.bonusText;
      } else if (currentCombo > 1) {
        this.state.bannerMessage = `COMBO x${currentCombo}! 🔥 +${scoreBreakdown.points}`;
      }

      // Track objective progress
      matchResult.matchedTiles.forEach((t) => {
        if (
          this.state.levelConfig.objective.type === 'collect' &&
          t.type === this.state.levelConfig.objective.collectType
        ) {
          this.state.collectedCount++;
        }
      });

      matchResult.damagedObstacles.forEach((obs) => {
        this.boardLogic.grid[obs.row][obs.col].obstacle = obs.newObstacleState;
        if (obs.newObstacleState === 'none') {
          this.state.destroyedObstacles++;
        }
      });

      // Phase 1: Highlight matched tiles with pop animation
      matchResult.matchedTiles.forEach((t) => {
        this.boardLogic.grid[t.row][t.col].matched = true;
      });
      this.state.grid = cloneGrid(this.boardLogic.grid);
      this.notifyStateChange();
      await new Promise((res) => setTimeout(res, 220));

      this.state.activeEffects = [];

      // Phase 2: Clear matched tiles & place created special tile
      this.state.phase = 'removing';
      matchResult.matchedTiles.forEach((t) => {
        this.boardLogic.grid[t.row][t.col].type = '';
        this.boardLogic.grid[t.row][t.col].special = 'none';
        this.boardLogic.grid[t.row][t.col].matched = false;
      });

      if (matchResult.createdSpecialTile) {
        const { row, col, special, type } = matchResult.createdSpecialTile;
        this.boardLogic.grid[row][col].type = type;
        this.boardLogic.grid[row][col].special = special;
      }

      // Phase 3: Apply gravity & spawn falling tiles from top
      this.state.phase = 'falling';
      const { fallen, newTiles } = this.boardLogic.applyGravityAndRefill();
      this.state.grid = cloneGrid(this.boardLogic.grid);
      this.notifyStateChange();
      await new Promise((res) => setTimeout(res, 320));

      // FIX #10 — Reset animation metadata cleanly after fall completes
      fallen.forEach((t) => this.boardLogic.resetTileMetadata(t));
      newTiles.forEach((t) => this.boardLogic.resetTileMetadata(t));
      this.state.grid = cloneGrid(this.boardLogic.grid);
      this.notifyStateChange();

      currentCombo++;
    }

    // Check Win/Loss conditions
    this.checkGameStatus();
    this.state.phase = this.state.status === 'playing' ? 'idle' : (this.state.status as GamePhase);
    this.state.isProcessing = false;
    this.notifyStateChange();
    return true;
  }

  async useHammer(row: number, col: number): Promise<boolean> {
    if (this.state.isProcessing || this.state.status !== 'playing') return false;

    this.state.isProcessing = true;
    this.state.bannerMessage = undefined;
    this.state.phase = 'removing';

    const tile = this.boardLogic.grid[row][col];
    tile.matched = true;
    this.state.grid = cloneGrid(this.boardLogic.grid);
    this.notifyStateChange();
    await new Promise((res) => setTimeout(res, 200));

    tile.type = '';
    tile.special = 'none';
    tile.obstacle = 'none';
    tile.matched = false;

    this.state.phase = 'falling';
    const { fallen, newTiles } = this.boardLogic.applyGravityAndRefill();
    this.state.grid = cloneGrid(this.boardLogic.grid);
    this.notifyStateChange();
    await new Promise((res) => setTimeout(res, 320));

    fallen.forEach((t) => this.boardLogic.resetTileMetadata(t));
    newTiles.forEach((t) => this.boardLogic.resetTileMetadata(t));

    this.state.grid = cloneGrid(this.boardLogic.grid);
    this.state.score += 100;
    this.checkGameStatus();
    this.state.phase = this.state.status === 'playing' ? 'idle' : (this.state.status as GamePhase);
    this.state.isProcessing = false;
    this.notifyStateChange();
    return true;
  }

  async useShuffle(): Promise<boolean> {
    if (this.state.isProcessing || this.state.status !== 'playing') return false;

    this.state.isProcessing = true;
    this.state.bannerMessage = undefined;
    this.state.phase = 'refilling';
    this.notifyStateChange();

    await new Promise((res) => setTimeout(res, 150));
    this.boardLogic.shuffle();
    this.state.grid = cloneGrid(this.boardLogic.grid);
    this.notifyStateChange();
    await new Promise((res) => setTimeout(res, 250));

    this.state.phase = 'idle';
    this.state.isProcessing = false;
    this.notifyStateChange();
    return true;
  }

  checkGameStatus(): void {
    const obj = this.state.levelConfig.objective;
    let isObjectiveMet = false;

    if (obj.type === 'score') {
      isObjectiveMet = this.state.score >= obj.targetScore;
    } else if (obj.type === 'collect') {
      isObjectiveMet =
        this.state.collectedCount >= (obj.collectCount || 0) &&
        this.state.score >= obj.targetScore;
    } else if (obj.type === 'obstacle') {
      isObjectiveMet =
        this.state.destroyedObstacles >= (obj.obstacleCount || 0) &&
        this.state.score >= obj.targetScore;
    }

    if (isObjectiveMet) {
      this.state.status = 'won';
      const moveBonus = this.scoringSystem.calculateLevelEndBonus(this.state.remainingMoves);
      this.state.score += moveBonus;
    } else if (this.state.remainingMoves <= 0) {
      this.state.status = 'lost';
    }
  }
}
