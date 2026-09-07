import { GameBoardLogic, type Grid, type TileData } from './board';
import { MatchDetector } from './match-detector';
import { ScoringSystem } from './scoring';
import { LevelManager, type LevelConfig } from './level-manager';

export interface GameEngineState {
  levelConfig: LevelConfig;
  grid: Grid;
  score: number;
  remainingMoves: number;
  collectedCount: number;
  destroyedObstacles: number;
  comboCount: number;
  isProcessing: boolean;
  status: 'playing' | 'won' | 'lost';
  bannerMessage?: string;
}

export class GameEngine {
  boardLogic: GameBoardLogic;
  matchDetector: MatchDetector;
  scoringSystem: ScoringSystem;
  levelManager: LevelManager;
  state: GameEngineState;

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
      grid: this.boardLogic.grid,
      score: 0,
      remainingMoves: config.moves,
      collectedCount: 0,
      destroyedObstacles: 0,
      comboCount: 0,
      isProcessing: false,
      status: 'playing',
    };
  }

  async executeMove(r1: number, c1: number, r2: number, c2: number): Promise<boolean> {
    if (this.state.isProcessing || this.state.status !== 'playing') return false;

    this.state.isProcessing = true;
    this.state.remainingMoves--;

    // Perform swap
    this.boardLogic.swapTiles(r1, c1, r2, c2);
    this.state.grid = [...this.boardLogic.grid];

    // Check for matches
    const matches = this.matchDetector.findMatches(
      this.boardLogic.grid,
      this.boardLogic.rows,
      this.boardLogic.cols
    );

    if (matches.matchedTiles.length === 0) {
      // Revert invalid swap
      await new Promise((res) => setTimeout(res, 200));
      this.boardLogic.swapTiles(r1, c1, r2, c2);
      this.state.grid = [...this.boardLogic.grid];
      this.state.remainingMoves++; // refund invalid move
      this.state.isProcessing = false;
      return false;
    }

    // Process cascading match loop
    let currentCombo = 1;
    let hasMoreMatches = true;

    while (hasMoreMatches) {
      const matchResult = this.matchDetector.findMatches(
        this.boardLogic.grid,
        this.boardLogic.rows,
        this.boardLogic.cols
      );

      if (matchResult.matchedTiles.length === 0) {
        hasMoreMatches = false;
        break;
      }

      // Calculate score & combo
      const scoreBreakdown = this.scoringSystem.calculateScore(
        matchResult.matchedTiles,
        currentCombo
      );
      this.state.score += scoreBreakdown.points;
      if (scoreBreakdown.bonusText) {
        this.state.bannerMessage = scoreBreakdown.bonusText;
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

      // Clear matched tiles
      matchResult.matchedTiles.forEach((t) => {
        this.boardLogic.grid[t.row][t.col].type = '';
        this.boardLogic.grid[t.row][t.col].special = 'none';
      });

      // Create special tile if 4+ match formed
      if (matchResult.createdSpecialTile) {
        const { row, col, special } = matchResult.createdSpecialTile;
        this.boardLogic.grid[row][col].type = 'ruby'; // fallback type
        this.boardLogic.grid[row][col].special = special;
      }

      // Apply gravity and refill
      await new Promise((res) => setTimeout(res, 250));
      this.boardLogic.applyGravityAndRefill();
      this.state.grid = [...this.boardLogic.grid];

      currentCombo++;
      this.state.comboCount = currentCombo;
    }

    // Check Win/Loss conditions
    this.checkGameStatus();
    this.state.isProcessing = false;
    return true;
  }

  useHammer(row: number, col: number): boolean {
    if (this.state.isProcessing || this.state.status !== 'playing') return false;

    const tile = this.boardLogic.grid[row][col];
    tile.type = '';
    tile.special = 'none';
    tile.obstacle = 'none';

    this.boardLogic.applyGravityAndRefill();
    this.state.grid = [...this.boardLogic.grid];
    this.state.score += 100;
    this.checkGameStatus();
    return true;
  }

  useShuffle(): boolean {
    if (this.state.isProcessing || this.state.status !== 'playing') return false;
    this.boardLogic.shuffle();
    this.state.grid = [...this.boardLogic.grid];
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
