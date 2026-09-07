export interface LevelObjective {
  type: 'score' | 'collect' | 'obstacle';
  targetScore: number;
  collectType?: string; // e.g. 'sapphire'
  collectCount?: number;
  obstacleCount?: number;
}

export interface LevelConfig {
  id: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  boardRows: number;
  boardCols: number;
  moves: number;
  objective: LevelObjective;
  initialIceBlocks?: { row: number; col: number; state: 'ice-1' | 'ice-2' }[];
}

export const GAME_LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: 'Starlight Outpost',
    difficulty: 'easy',
    boardRows: 7,
    boardCols: 7,
    moves: 25,
    objective: {
      type: 'score',
      targetScore: 2500,
    },
  },
  {
    id: 2,
    title: 'Sapphire Nebula',
    difficulty: 'easy',
    boardRows: 7,
    boardCols: 7,
    moves: 22,
    objective: {
      type: 'collect',
      targetScore: 3500,
      collectType: 'sapphire',
      collectCount: 12,
    },
  },
  {
    id: 3,
    title: 'Frozen Comet',
    difficulty: 'medium',
    boardRows: 8,
    boardCols: 8,
    moves: 20,
    objective: {
      type: 'obstacle',
      targetScore: 4500,
      obstacleCount: 6,
    },
    initialIceBlocks: [
      { row: 2, col: 2, state: 'ice-1' },
      { row: 2, col: 5, state: 'ice-1' },
      { row: 3, col: 3, state: 'ice-2' },
      { row: 3, col: 4, state: 'ice-2' },
      { row: 5, col: 2, state: 'ice-1' },
      { row: 5, col: 5, state: 'ice-1' },
    ],
  },
  {
    id: 4,
    title: 'Ruby Pulsar',
    difficulty: 'medium',
    boardRows: 8,
    boardCols: 8,
    moves: 18,
    objective: {
      type: 'collect',
      targetScore: 6000,
      collectType: 'ruby',
      collectCount: 18,
    },
  },
  {
    id: 5,
    title: 'Void Anomaly',
    difficulty: 'hard',
    boardRows: 8,
    boardCols: 8,
    moves: 16,
    objective: {
      type: 'obstacle',
      targetScore: 8000,
      obstacleCount: 10,
    },
    initialIceBlocks: [
      { row: 1, col: 1, state: 'ice-2' }, { row: 1, col: 6, state: 'ice-2' },
      { row: 3, col: 3, state: 'ice-2' }, { row: 3, col: 4, state: 'ice-2' },
      { row: 4, col: 3, state: 'ice-2' }, { row: 4, col: 4, state: 'ice-2' },
      { row: 6, col: 1, state: 'ice-2' }, { row: 6, col: 6, state: 'ice-2' },
      { row: 2, col: 2, state: 'ice-1' }, { row: 5, col: 5, state: 'ice-1' },
    ],
  },
  {
    id: 6,
    title: 'Supernova Core',
    difficulty: 'hard',
    boardRows: 8,
    boardCols: 8,
    moves: 15,
    objective: {
      type: 'score',
      targetScore: 12000,
    },
  },
];

export class LevelManager {
  getLevel(id: number): LevelConfig | undefined {
    return GAME_LEVELS.find((l) => l.id === id);
  }

  getAllLevels(): LevelConfig[] {
    return GAME_LEVELS;
  }
}
