import { BaseCollectionTransform, BaseTransformer } from './base-collection-transform.mjs';

export class MenuTransformer extends BaseTransformer {
  get template() {
    return this.model?.copyContent || `<md-menu-item><div slot="headline" class="title"></div></md-menu-item>`;
  }
}
MenuTransformer.register();

export class MenuButton extends BaseCollectionTransform {
  get transformerTag() {
    return 'menu-transformer';
  }
  get template() {
    return `
      <md-menu></md-menu>
      <slot name="button"><md-outlined-button><slot>Choose one</slot></md-outlined-button></slot>
      `;
  }
  get viewParent() {
    return this.shadow$('md-menu');
  }
  get button() { // As assigned or the default
    const slot = this.shadow$('slot[name="button"]'),
	  assigned = slot.assignedElements();
    if (assigned.length) return assigned[0];
    return slot.firstElementChild;
  }
  get styles() {
    return `
      md-menu { min-width: max-content; }
      :host { position: relative; }; // Allow the menu to appear relative to wherever we are.
    `;
  }
  afterInitialize() {
    super.afterInitialize();
    this.viewParent.anchorElement = this.button;
    this.button.addEventListener('click', () => this.viewParent.open = !this.viewParent.open);
    if (this.select) { // If defined
      this.addEventListener('close-menu', event => {
	event.stopPropagation();
	this.select(event.detail.initiator.dataset.key);
      });
    }
  }
}
MenuButton.register();
