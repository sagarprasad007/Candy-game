import type { TileData } from './board';

export interface ScoreBreakdown {
  points: number;
  comboMultiplier: number;
  bonusText?: string;
}

export class ScoringSystem {
  calculateScore(matchedTiles: TileData[], comboCount: number): ScoreBreakdown {
    const count = matchedTiles.length;
    let basePoints = 0;

    if (count === 3) basePoints = 30;
    else if (count === 4) basePoints = 60;
    else if (count >= 5) basePoints = 100 + (count - 5) * 20;
    else basePoints = count * 10;

    // Bonus for special tiles matched
    let specialBonus = 0;
    matchedTiles.forEach((t) => {
      if (t.special === 'line-h' || t.special === 'line-v') specialBonus += 50;
      else if (t.special === 'bomb') specialBonus += 100;
      else if (t.special === 'prism') specialBonus += 200;
    });

    const comboMultiplier = Math.max(1, comboCount);
    const totalPoints = (basePoints + specialBonus) * comboMultiplier;

    let bonusText: string | undefined = undefined;
    if (comboMultiplier === 2) bonusText = 'NICE! Combo x2';
    else if (comboMultiplier === 3) bonusText = 'GREAT! Combo x3';
    else if (comboMultiplier >= 4) bonusText = `AMAZING! Combo x${comboMultiplier}`;

    return {
      points: totalPoints,
      comboMultiplier,
      bonusText,
    };
  }

  calculateLevelEndBonus(remainingMoves: number): number {
    return remainingMoves * 150;
  }
}
