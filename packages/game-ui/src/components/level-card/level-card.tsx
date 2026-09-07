import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

@Component({
  tag: 'level-card',
  styleUrl: 'level-card.css',
  shadow: true,
})
export class LevelCard {
  @Prop() level: number = 1;
  @Prop() stars: number = 0; // 0 to 3
  @Prop() bestScore: number = 0;
  @Prop() locked: boolean = false;
  @Prop() difficulty: string = 'easy'; // easy, medium, hard
  @Prop() levelTitle: string = '';

  @Event({ eventName: 'level-selected' }) levelSelected!: EventEmitter<number>;

  private handleClick = () => {
    if (!this.locked) {
      this.levelSelected.emit(this.level);
    }
  };

  render() {
    const starArray = [1, 2, 3];

    return (
      <div
        class={`card ${this.locked ? 'locked' : 'unlocked'} diff-${this.difficulty}`}
        onClick={this.handleClick}
        role="button"
        tabindex={this.locked ? -1 : 0}
      >
        <div class="card-header">
          <span class="level-num">Level {this.level}</span>
          <span class={`difficulty-badge ${this.difficulty}`}>{this.difficulty.toUpperCase()}</span>
        </div>

        {this.levelTitle && <div class="level-title">{this.levelTitle}</div>}

        <div class="card-body">
          {this.locked ? (
            <div class="lock-icon">🔒</div>
          ) : (
            <div class="stars-row">
              {starArray.map((s) => (
                <span key={s} class={`star ${s <= this.stars ? 'earned' : 'unearned'}`}>
                  ★
                </span>
              ))}
            </div>
          )}
        </div>

        <div class="card-footer">
          {!this.locked && <span class="score-text">Best: {this.bestScore.toLocaleString()}</span>}
          {this.locked && <span class="locked-text">Locked</span>}
        </div>
      </div>
    );
  }
}
