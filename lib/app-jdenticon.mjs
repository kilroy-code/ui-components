import { App, MDElement } from './md-element.mjs';

export class AvatarJdenticon extends MDElement {
  // Clients can assign username or model.
  get model() { return null; }
  get username() { return this.model?.username || ''; }
  get size() { return 80; }
  get usernameEffect() {
    return this.jdenticonModule?.updateSvg(this.jdenticonElement, this.username) || false;
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
    return `<svg width="${this.size}" height="${this.size}"></svg>`;
  }
}
AvatarJdenticon.register();
