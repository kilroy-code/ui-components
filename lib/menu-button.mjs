import { MDElement, App} from './md-element.mjs';
import { ListTransform } from './list-transform.mjs';
import { BaseTransformer } from './base-transformer.mjs';
import { CollectionTransform } from './collection-transform.mjs';

export class MenuTransformer extends BaseTransformer {
  get template() {
    return this.model?.copyContent || `<md-menu-item><div slot="headline" class="title"></div></md-menu-item>`;
  }
}
MenuTransformer.register();

export class MenuButton extends MDElement {
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
  get collection() { // Must be provided by client. But here it is a rule so that we update when it is set.
    return null;
  }
  get transform() { // Where the work is done. MenuButton instance to define collection and tags.
    return new CollectionTransform({source: this, transformerTag: 'menu-transformer', debug: this.debug});
  }
  get tagsEffect() { // Demand the work.
    return this.transform.transformers;
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

/*
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
*/
