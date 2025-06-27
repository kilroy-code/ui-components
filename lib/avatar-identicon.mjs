import { App, MDElement } from './md-element.mjs';

export class AvatarIdenticon extends MDElement {
  // Clients can assign title or model.
  get model() { return null; }
  get title() { return this.model?.title || ''; }
  get size() { return this.model?.size || 40; }
  get titleEffect() {
    this.toggleAttribute('hasTitle', this.title); // Handy for external styling.
    if (!this.identiconModule) return false;
    const generator = new this.identiconModule(this.title, {size: this.size, format: 'svg'});
    return this.identiconElement.src = `data:image/svg+xml;base64,${generator.toString()}`;
  }
  get sizeEffect() {
    let svg = this.shadow$('svg'), size = this.size;
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    return true;
  }
  get identiconElement() {
    return this.shadow$('img');
  }
  get identiconModule() {
    const script = App.ensureScript({
      src: '/@kilroy-code/ui-components/node_modules/identicon.js/identicon.js',
      async: 'async'
    });
    if (!script.loaded) return null;
    return window.Identicon;
  }
  get template() {
    return `<img width="${this.size}" height="${this.size}"`;
  }
}
AvatarIdenticon.register();
