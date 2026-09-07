import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

@Component({
  tag: 'game-tile',
  styleUrl: 'game-tile.css',
  shadow: true,
})
export class GameTile {
  @Prop() type: string = 'ruby'; // ruby, sapphire, emerald, amber, amethyst
  @Prop() selected: boolean = false;
  @Prop() special: string = 'none'; // none, line-h, line-v, bomb, prism
  @Prop() obstacle: string = 'none'; // none, ice-1, ice-2
  @Prop() row: number = 0;
  @Prop() col: number = 0;
  @Prop() matched: boolean = false;
  @Prop() falling: boolean = false;

  @Event({ eventName: 'game-tile-selected' }) tileSelected!: EventEmitter<{ row: number; col: number }>;

  private handleClick = () => {
    this.tileSelected.emit({ row: this.row, col: this.col });
  };

  private getGemSymbol(type: string): string {
    switch (type) {
      case 'ruby': case 'red': return '◆';
      case 'sapphire': case 'blue': return '▲';
      case 'emerald': case 'green': return '⬢';
      case 'amber': case 'yellow': return '★';
      case 'amethyst': case 'purple': return '✦';
      default: return '●';
    }
  }

  render() {
    const classes = {
      'tile': true,
      [`type-${this.type}`]: true,
      'selected': this.selected,
      [`special-${this.special}`]: this.special !== 'none',
      'matched': this.matched,
      'falling': this.falling,
      'has-obstacle': this.obstacle !== 'none',
    };

    return (
      <div class={classes} onClick={this.handleClick} role="button" tabindex="0" aria-label={`Tile ${this.type} at ${this.row}, ${this.col}`}>
        <div class="tile-inner">
          <span class="gem-icon">{this.getGemSymbol(this.type)}</span>
          {this.special === 'line-h' && <div class="badge line-h">↔</div>}
          {this.special === 'line-v' && <div class="badge line-v">↕</div>}
          {this.special === 'bomb' && <div class="badge bomb">💣</div>}
          {this.special === 'prism' && <div class="badge prism">🌈</div>}
        </div>
        {this.obstacle === 'ice-1' && <div class="obstacle-overlay ice-1" title="Ice Crystal">❄️</div>}
        {this.obstacle === 'ice-2' && <div class="obstacle-overlay ice-2" title="Frozen Ice Crystal">🧊</div>}
      </div>
    );
  }
}
