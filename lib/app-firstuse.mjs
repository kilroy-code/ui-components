import { App, MDElement } from './md-element.mjs';
const { localStorage } = window;

export class AppFirstuse extends MDElement {
  isFirstUse = true;
  storageKey = 'seenFirstUse';
  wasSeen() { return !!localStorage.getItem(this.storageKey); }
  setSeen(value = true) { localStorage.setItem(this.storageKey, value); return value; }
  get seen() {
    return this.wasSeen();
  }
}
AppFirstuse.register();
