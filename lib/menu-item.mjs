import { ViewTransform } from './view-transform.mjs';

export class MenuItem extends ViewTransform {
  get template() {
    return this.model?.copyContent || `<md-menu-item><div slot="headline"></div></md-menu-item>`; //fixme
  }
  get titleEffect() { // If model.title changes, update ourself in place (wherever we may appear).
    const headline = this.view.querySelector('[slot="headline"]'),
	  title = this.model?.title || '';
    this.view.dataset.key = title;
    if (!headline) return title;
    return headline.textContent = title;
  }
}
MenuItem.register();
