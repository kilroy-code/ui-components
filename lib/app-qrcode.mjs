import { App, MDElement } from './md-element.mjs';

export class AppQrcode extends MDElement {
  get data() { return (this.parentComponent?.url || App?.url).href; }
  get picture() { return this.getRootNode().host.picture || ''; }
  get size() { return 300; }
  get color() { return this.getCSSVar("--md-sys-color-on-secondary-container"); }
  get background() { return this.getCSSVar("--md-sys-color-secondary-container"); }
  get dotsOptions() {
    return {
      color: this.color,
      type: "rounded"
    };
  }
  get backgroundOptions() {
    return {
      color: this.background
    };
  }
  get imageOptions() {
    return {
      imageSize: 0.3,
      margin: 6
    };
  }
  get options() {
    return {
      width: this.size,
      height: this.size,
      type: 'svg',
      data: this.data,
      image: this.picture,
      dotsOptions: this.dotsOptions,
      backgroundOptions: this.backgroundOptions,
      imageOptions: this.imageOptions
    };
  }
  get qrcodeModule() {
    return App.ensureScript({
      src: 'https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js',
      async: 'async'
    });
  }
  get generator() {
    return this.qrcodeModule.loaded ? new window.QRCodeStyling(this.options) : null;
  }
  get effect() {
    const container = this.content.firstElementChild;
    container.innerHTML = '';
    this.generator?.append(container); // Note that this is backwards to what you might think.
    return true;
  }
  get template() {
    return `<div></div>`;
  }
}
AppQrcode.register();
