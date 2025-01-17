import { App } from './md-element.mjs';
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
  get choice() {
    return '';
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
    this.viewParent.addEventListener('opening', event => { // Indicate whichever we are already on (if any) by disabling it.
      this.viewParent.items.forEach(item => item.toggleAttribute('disabled', item.dataset.key === App.screen));
    });
    this.addEventListener('close-menu', event => {
      let key = event.detail.initiator.dataset.key;
      this.choice = key;
      if (!this.select) return;
      event.stopPropagation();
      this.select(key);
    });
  }
}
MenuButton.register();
