import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

@Component({
  tag: 'game-modal',
  styleUrl: 'game-modal.css',
  shadow: true,
})
export class GameModal {
  @Prop() isOpen: boolean = false;

  @Event({ eventName: 'modal-closed' }) modalClosed!: EventEmitter<void>;

  private handleBackdropClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.modalClosed.emit();
    }
  };

  render() {
    if (!this.isOpen) return null;

    return (
      <div class="modal-backdrop" onClick={this.handleBackdropClick}>
        <div class="modal-card">
          <div class="modal-header">
            <h2>
              <slot name="title">Modal Title</slot>
            </h2>
            <button class="close-btn" onClick={() => this.modalClosed.emit()}>
              ✕
            </button>
          </div>

          <div class="modal-body">
            <slot name="content">Modal Content goes here...</slot>
          </div>

          <div class="modal-footer">
            <slot name="actions">
              <button class="default-btn" onClick={() => this.modalClosed.emit()}>
                Close
              </button>
            </slot>
          </div>
        </div>
      </div>
    );
  }
}
