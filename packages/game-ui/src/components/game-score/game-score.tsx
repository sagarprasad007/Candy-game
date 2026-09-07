import { Component, Prop, h } from '@stencil/core';

@Component({
  tag: 'game-score',
  styleUrl: 'game-score.css',
  shadow: true,
})
export class GameScore {
  @Prop() score: number = 0;
  @Prop() target: number = 10000;
  @Prop() moves: number = 25;
  @Prop() maxMoves: number = 25;

  render() {
    const progressPct = Math.min(100, Math.round((this.score / (this.target || 1)) * 100));

    return (
      <div class="score-container">
        <div class="score-card">
          <div class="score-label">SCORE</div>
          <div class="score-value">{this.score.toLocaleString()}</div>
        </div>

        <div class="progress-section">
          <div class="target-info">
            <span>Target: {this.target.toLocaleString()}</span>
            <span>{progressPct}%</span>
          </div>
          <div class="bar-background">
            <div class="bar-fill" style={{ width: `${progressPct}%` }}></div>
          </div>
        </div>

        <div class="moves-card">
          <div class="moves-label">MOVES</div>
          <div class={`moves-value ${this.moves <= 5 ? 'critical' : ''}`}>{this.moves}</div>
        </div>
      </div>
    );
  }
}
