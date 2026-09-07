import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

@Component({
  tag: 'life-counter',
  styleUrl: 'life-counter.css',
  shadow: true,
})
export class LifeCounter {
  @Prop() lives: number = 5;
  @Prop() maxLives: number = 5;
  @Prop() nextLifeTime: string = ''; // e.g. "04:59"

  @Event({ eventName: 'restore-life-requested' }) restoreLifeRequested!: EventEmitter<void>;

  render() {
    const hearts = [];
    for (let i = 0; i < this.maxLives; i++) {
      hearts.push(
        <span key={i} class={`heart ${i < this.lives ? 'filled' : 'empty'}`}>
          ❤️
        </span>
      );
    }

    return (
      <div class="life-container">
        <div class="hearts-wrapper">{hearts}</div>
        <div class="life-text">
          {this.lives} / {this.maxLives}
        </div>

        {this.lives < this.maxLives && (
          <div class="regeneration-info">
            {this.nextLifeTime && <span class="timer">⏱️ {this.nextLifeTime}</span>}
            <button class="refill-btn" onClick={() => this.restoreLifeRequested.emit()}>
              + Restore
            </button>
          </div>
        )}
      </div>
    );
  }
}
