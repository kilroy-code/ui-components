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
    // If this isn't REALLY the first time (i.e., the usre asked to reset), then reset.
    if (this.wasSeen()) {
      localStorage.clear();
      App.userCollection.updateLiveTags([]);
      App.groupCollection.updateLiveTags([]); // FIXME: this is specific to FairShare.
      App.resetUrl(Object.fromEntries(App.url.searchParams.entries().map(([key]) => [key, '']))); // leaving hash
    } // (Otherwise, leave parameters for use by whatever the first use screen contains.)
    this.setSeen();
  }
}
AppFirstuse.register();
