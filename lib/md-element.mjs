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
  getParent(node = this) { // parentElement or the shadow DOM host .
    return node?.parentElement || node?.getRootNode()?.host || null;
  }
  findDefiningAncestor(propertyName, node = this.getParent(this)) { // Answer the first among node and ancestors that defines propertyName.
    // Rejoins from shadow dom back to the host.
    if (!node) return null;
    if (propertyName in node) return node;
    return this.findDefiningAncestor(propertyName, this.getParent(node));
  }
  findParentComponent(node) {
    return this.findDefiningAncestor('parentComponent', node);
  }
  get parentComponent() { // A good place to look for default values.
    // Being a rule, references will change when the RULE value is re-assigned, but it does NOT change automatically when re-parented.
    // (MutationObserver could be used to track that, but that is not set up here.)
    // Appears to be valid when referenced in normal or eager rules (and of course, afterInitialize).
    return this.findParentComponent(this.getParent(this));
  }
}
MDElement.register();
