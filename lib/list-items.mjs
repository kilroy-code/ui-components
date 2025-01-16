//import { App } from './md-element.mjs';
//import { ListTransform } from './list-transform.mjs';
import { BaseCollectionTransform, BaseTransformer } from './base-collection-transform.mjs';

export class ListTransformer extends BaseTransformer {
  get template() {
    return `
       <md-list-item>
         <div slot="headline" class="title"></div>
         <avatar-image slot="start" class="picture"></avatar-image>
       </md-list-item>`;
  }
}
ListTransformer.register();

export class ListItems extends BaseCollectionTransform {
  get transformerTag() {
    return 'list-transformer';
  }
  get template() {
    return `
      <md-list></md-list>
      <slot name="empty"></slot>
      <slot></slot>
      `;
  }
  get viewParent() {
    return this.shadow$('md-list');
  }
  afterInitialize() {
    super.afterInitialize();
    if (this.select) { // If defined
      this.viewParent.addEventListener('click', event => {
	event.stopPropagation();
	this.select(this.getAttributeOrPropertyInAncestors({attributeName: 'data-key',
							    node: event.target}));
      });
    }
  }
  get styles() {
    return `
      md-list:has(*) ~ slot[name="empty"] { display: none; }
      slot[name="empty"]::slotted(*) { margin: var(--margins, 10pt); }
      [active] {
          background-color: var(--md-sys-color-surface-variant);
          --md-list-item-label-text-color: var(--md-sys-color-on-surface-variant);
      }
    `;
  }
}
ListItems.register();
