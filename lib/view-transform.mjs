import { MDElement } from './md-element.mjs';

export class ViewTransform extends MDElement { // TODO: Unify this with AttachedView
  // A component that doesn't display anything - it creates and populates a view rule from a model,
  // and keeps the view consistent with the model.
  get model() {
    return null;
  }
  get content() { // Instead of a shadow dom tree, just answer a template element
    return this.fromHTML('template', this.template);
  }
  get view() { // We will find ourself a child of a ListTransform, and are responsible for keeping the parts of our view up to date.
    // ListTransform.setKeys() is responsible for inserting our view into it's itemParent in the position that corresponds to us.
    //return this.model?.viewable || this.content.content.firstElementChild; // First content is rule to get template, second gets dock fragment. No need to clone.
    return this.content.content.firstElementChild; //fixme // First content is rule to get template, second gets dock fragment. No need to clone.
  }
}
ViewTransform.register();
