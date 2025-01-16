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
  activate() {
    console.log('AppFirstuse.activate', this.wasSeen());
    // If this isn't REALLY the first time (i.e., the usre asked to reset), then reset.
    if (this.wasSeen()) {
      App.resetUrl(Object.fromEntries(App.url.searchParams.entries().map(([key]) => [key, '']))); // leaving hash
      localStorage.clear();
    } // (Otherwise, leave parameters for use by whatever the first use screen contains.)
    this.setSeen();
  }
}
AppFirstuse.register();
