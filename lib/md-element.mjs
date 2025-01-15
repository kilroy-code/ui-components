import { RuledElement } from '../base.mjs';

export let App;

export class MDElement extends RuledElement {
  static set App(app) {
    App = app;
  }
  get title() {
    return this.toCapitalCase(this.tagName.split('-').slice(1).join(' '));
  }
  traceLog(...args) {
    if (this.trace) return;
    console.log(this.tagName, ...args);
  }
}
MDElement.register();
