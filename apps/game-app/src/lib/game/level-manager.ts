export interface LevelObjective {
  type: 'score' | 'collect' | 'obstacle' | 'jelly';
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
  initialJellies?: { row: number; col: number; state: 'single' | 'double' }[];
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
  getLevel(id: number): LevelConfig {
    const predefined = GAME_LEVELS.find((l) => l.id === id);
    if (predefined) return predefined;

    // Procedural Level Generation for Unlimited Levels (id > 6)
    const difficulty: 'easy' | 'medium' | 'hard' =
      id % 3 === 0 ? 'hard' : id % 2 === 0 ? 'medium' : 'easy';
    const targetScore = 10000 + (id - 6) * 2500;
    const moves = Math.max(12, 22 - Math.floor((id - 6) / 2));
    const objTypeIndex = id % 4;

    const titles = ['Cosmic Cluster', 'Galactic Core', 'Quantum Realm', 'Starlight Expanse', 'Astral Horizon'];
    const title = `${titles[id % titles.length]} #${id}`;

    let objective: LevelObjective = { type: 'score', targetScore };

    if (objTypeIndex === 1) {
      const types = ['ruby', 'sapphire', 'emerald', 'amber', 'amethyst'];
      objective = {
        type: 'collect',
        targetScore,
        collectType: types[id % types.length],
        collectCount: 15 + Math.min(20, (id - 6) * 2),
      };
    } else if (objTypeIndex === 2) {
      objective = {
        type: 'obstacle',
        targetScore,
        obstacleCount: Math.min(16, 6 + Math.floor((id - 6) * 1.5)),
      };
    } else if (objTypeIndex === 3) {
      objective = {
        type: 'jelly',
        targetScore,
        obstacleCount: Math.min(16, 6 + Math.floor((id - 6) * 1.5)),
      };
    }

    const initialIceBlocks: { row: number; col: number; state: 'ice-1' | 'ice-2' }[] = [];
    if (objective.type === 'obstacle') {
      const count = objective.obstacleCount || 6;
      for (let i = 0; i < count; i++) {
        const r = (i * 2 + 1) % 8;
        const c = (i * 3 + 1) % 8;
        initialIceBlocks.push({ row: r, col: c, state: i % 2 === 0 ? 'ice-2' : 'ice-1' });
      }
    }

    const initialJellies: { row: number; col: number; state: 'single' | 'double' }[] = [];
    if (objective.type === 'jelly') {
      const count = objective.obstacleCount || 6;
      for (let i = 0; i < count; i++) {
        const r = (i * 2 + 2) % 8;
        const c = (i * 3 + 2) % 8;
        initialJellies.push({ row: r, col: c, state: i % 2 === 0 ? 'double' : 'single' });
      }
    }

    return {
      id,
      title,
      difficulty,
      boardRows: 8,
      boardCols: 8,
      moves,
      objective,
      initialIceBlocks,
      initialJellies,
    };
  }

  getAllLevels(): LevelConfig[] {
    return GAME_LEVELS;
  }
}
