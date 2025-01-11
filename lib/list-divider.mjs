import { MDElement } from './md-element.mjs';

export class ListDivider extends MDElement {
  get copyContent() {
    return this.content.innerHTML;
  }
  get template() {
    return `<md-divider role="separator" tabindex="-1"></md-divider>`;
  }
  get title() {
    return `divider-${Array.from(this.parentElement.children).indexOf(this)}`;
  }
}
ListDivider.register();
