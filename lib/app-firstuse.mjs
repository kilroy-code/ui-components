import { App, MDElement } from './md-element.mjs';
const { localStorage } = window;

export class AppFirstuse extends MDElement {
  isFirstUse = true;
  storageKey = 'seenFirstUse';
  wasSeen() { return !!localStorage.getItem(this.storageKey); }
  setSeen() { localStorage.setItem(this.storageKey, true); return true; }
  get seen() {
    return this.wasSeen();
  }
  get seenEffect() {
    if (this.seen === this.wasSeen()) return true;
    if (this.seen) return this.setSeen();
    localStorage.clear();
    App.resetUrl(Object.fromEntries(App.url.searchParams.entries())); // Leaving hash.
    return true;
  }
}
AppFirstuse.register();
