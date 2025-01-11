import { ViewTransform } from './view-transform.mjs';

export class TabItem extends ViewTransform {
  get template() {
    return `<md-primary-tab part="tab"></md-primary-tab>`;
  }
  get titleEffect() {
    const primary = this.view;
    // if (this.view.active) location.hash = this.model.title; // Not of much use without persistence.
      return primary.textContent = primary.dataset.key = this.model?.title || '';
  }
}
TabItem.register();
