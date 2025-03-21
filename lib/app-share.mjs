import { App, MDElement } from './md-element.mjs';

export class AppShare extends MDElement {
  get url() {
    return App?.url;
  }
  get picture() {
    return '';
  }
  get description() {
    return '';
  }
  afterInitialize() { // Invoke browser's share() when our button is clicked.
    this.shadow$('md-filled-button').onclick = () => navigator.share({title: App.title, text: this.description, url: this.url, });
  }
  get template() {
    return `
       <section>
          <slot name="qr"></slot>
          <app-qrcode></app-qrcode>

          <slot name="social"></slot>
          <div>
            <md-filled-button>
              <material-icon slot="icon">share</material-icon>
              share
            </md-filled-button>
          </div>
       </section>
    `;
  }
  get styles() {
    return `
      app-qrcode, div:has(md-filled-button) {
        margin-left: auto;
        margin-right: auto;
        display: block;
        width: fit-content;
      }
      section {margin: 10px; }
    `;
  }
}
AppShare.register();
