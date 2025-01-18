import { App, MDElement } from './md-element.mjs';

export class AvatarJdenticon extends MDElement {
  // Clients can assign title or model.
  get model() { return null; }
  get title() { return this.model?.title || ''; }
  get size() { return this.model?.size || 40; }
  get titleEffect() {
    this.toggleAttribute('hasTitle', this.title); // Handy for external styling.
    return this.jdenticonModule?.updateSvg(this.jdenticonElement, this.title) || false;
  }
  get sizeEffect() {
    let svg = this.shadow$('svg'), size = this.size;
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    return true;
  }
  get jdenticonElement() {
    return this.shadow$('svg');
  }
  get jdenticonModule() {
    const script = App.ensureScript({
      src: 'https://cdn.jsdelivr.net/npm/jdenticon@3.3.0/dist/jdenticon.min.js',
      async: 'async',
      integrity: 'sha384-LfouGM03m83ArVtne1JPk926e3SGD0Tz8XHtW2OKGsgeBU/UfR0Fa8eX+UlwSSAZ',
      crossorigin: 'anonymous'
    });
    if (!script.loaded) return null;
    return window.jdenticon;
  }
  get template() {
    return `<svg></svg>`;
  }
}
AvatarJdenticon.register();
