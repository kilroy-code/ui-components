import { App, MDElement } from './md-element.mjs';

export class AppQrcode extends MDElement {
  get data() { return (this.parentComponent?.url || App?.url).href; }
  get picture() { return this.getRootNode().host.picture || ''; }
  get size() { return 300; }
  get color() { return this.getCSSVar("--md-sys-color-on-secondary-container"); }
  get background() { return this.getCSSVar("--md-sys-color-secondary-container"); }
  get shape() { return 'rounded'; }
  get errorCorrectionLevel() { return 'Q'; }
  sendObject(object) { // Display high-density data as JSON.
    this.data = JSON.stringify(object);
    this.errorCorrectionLevel = 'L';
    this.color = "#000000";
    this.background = "#FFFFFF";
    this.shape = 'square';
  }
  get dotsOptions() {
    return {
      color: this.color,
      roundSize: false, //
      type: this.shape
    };
  }
  get cornersSquareOptions() {
    return {
      color: this.color,
      type: this.shape
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
  get qrOptions() {
    return {
      errorCorrectionLevel: this.errorCorrectionLevel
    };
  }
  get options() {
    return {
      width: this.size,
      height: this.size,
      margin: 0,
      type: 'svg',
      data: this.data,
      image: this.picture,
      qrOptions: this.qrOptions,
      dotsOptions: this.dotsOptions,
      cornersSquareOptions: this.cornersSquareOptions,
      backgroundOptions: this.backgroundOptions,
      imageOptions: this.imageOptions
    };
  }
  get qrcodeModule() {
    return App.ensureScript({
      src: 'https://unpkg.com/qr-code-styling@1.8.0/lib/qr-code-styling.js',
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
