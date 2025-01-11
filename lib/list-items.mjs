import { App } from './md-element.mjs';
import { ListTransform } from './list-transform.mjs';

export class ListItems extends ListTransform {
  // A list of items built from keys:
  // setKeys(array-of-keys) builds and maintains a set of ListItem children, where each child's model is getModel(key).
  // Our shadowTree is an md-list, with each child being a view of each ListItem.
  get urlKey() {
    return '';
  }
  onSelection(key) {
    this.urlKey && App.resetUrl({[this.urlKey]: key});
  }
  onClick(event) {
    this.onSelection(this.getAttributeOrPropertyInAncestors({attributeName: 'data-key',
							     node: event.target}));
  }
  afterInitialize() {
    super.afterInitialize();
    this.shadow$('md-list').addEventListener('click', event => this.onClick(event));
  }
  get template() {
    return `<md-list></md-list><slot></slot>`;
  }
  get viewTag() {
    return 'list-item';
  }
  get styles() {
    return `
      [active] {
          background-color: var(--md-sys-color-surface-variant);
          --md-list-item-label-text-color: var(--md-sys-color-on-surface-variant);
      }
      .avatar[src=""] {display: none; }
      .avatar {
        border-radius: 50%;
        height: var(--avatar-size, 40px);
        width:  var(--avatar-size, 40px);
      }
    `;
  }
}
ListItems.register();
