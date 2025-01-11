import { App } from './md-element.mjs';
import { ViewTransform } from './view-transform.mjs';

export class ListItem extends ViewTransform {
  get template() {
    return `
       <md-list-item>
         <div slot="headline"></div>
         <img slot="start" class="avatar"/>
       </md-list-item>`;
  }
  get titleEffect() {
    const title = this.model?.title;
    this.view.dataset.key = title;
    return this.headlineElement.textContent = title || '...'; // If model hasn't arrived yet.
  }
  get headlineElement() {
    return this.view.querySelector('[slot="headline"]');
  }
  get imgElement() {
    return this.view.querySelector('img');
  }
  get pictureEffect() {
    this.imgElement?.setAttribute('src', App.getPictureURL(this.model?.picture));
    return true;
  }
}
ListItem.register();
