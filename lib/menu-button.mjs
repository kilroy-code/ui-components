import { MDElement, App} from './md-element.mjs';
import { ListTransform } from './list-transform.mjs';

export class FixmeMenuButton extends ListTransform {
  get slot() {
    const slot = this.shadow$('slot');
    slot.onslotchange = () => this.anchor = undefined;
    return slot;
  }
  get anchor() { // Can be overridden or assigned.
    return this.slot.assignedElements()[0];
  }
  get menu() {
    return this.itemParent;
  }
  get viewTag() {
    return 'menu-item';
  }
  get hasOverflow() {
    return false;
  }
  get template() {
    return `
      <md-menu${this.hasOverflow === '' ? ' has-overflow' : ''}></md-menu>
      <slot></slot>
      `;
  }
  afterInitialize() {
    super.afterInitialize();
    this.menu.anchorElement = this.anchor;
    this.anchor.addEventListener('click', () => this.menu.open = !this.menu.open);
  }
}
FixmeMenuButton.register();

