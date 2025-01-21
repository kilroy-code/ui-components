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
      // No Iterator.map on Safari, and entries aren't normal either. Need to convert to regular Object.
      const params = Object.fromEntries(App.url.searchParams.entries());
      for (let key in params) params[key] = '';
      App.resetUrl(params); // leaving hash
    } // (Otherwise, leave parameters for use by whatever the first use screen contains.)
    this.setSeen();
  }
}
AppFirstuse.register();
