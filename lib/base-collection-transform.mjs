import { MDElement, App } from './md-element.mjs';
import { CollectionTransform } from './collection-transform.mjs';

// Subclasses are used as the transformerTag in a CollectionTransformer.
// The subclasses don't display anything - They create and populate a view rule from a model,
// and keeps the view consistent with the model.
export class BaseTransformer extends MDElement {
  get content() {  // Instead of a shadow DOM tree, just answer a template element.
    return this.fromHTML('template', this.template);
  }
  get view() {   // An element that will be appended to the CollectionTransformer's viewParent.
    return this.content.content.firstElementChild; // First content is rule to get template, second gets dock fragment. No need to clone.
  }
  get model() {  // References the model rule in the collection, so that changes the value refelect here.
    return this.collection?.[this.dataset.key] || null;
  }
  get titleTargetSelector() { // By default, our sideEffects will find this element in the view, and mirror the model title there.
    return '.title';
  }
  get pictureTargetSelector() { // By default, our sideEffects will find this element in the view, and mirror the model picture there.
    return '.picture';
  }
  get sideEffects() { // sets view dataset.key and title.
    const tag = this.dataset.key,
	  textElement = this.getViewElement(this.titleTargetSelector) || this.view,
	  pictureElement = this.getViewElement(this.pictureTargetSelector);
    this.setText(textElement, this.model?.title || tag);
    return this.view.dataset.key = tag;
  }
  get modelEffects() {
    let picture = this.getViewElement(this.pictureTargetSelector);
    if (!picture) return false;
    return picture.model = this.model;
  }
  // Some tooling for managing side effects.
  getViewElement(selector) { // Return the specified element of the view.
    return this.view.querySelector(selector);
  }
  setText(element, value) { // Set textContent in the element IFF it is found. (Silently null otherwise.)
    if (!element) return null;
    return element.textContent = value;
  }
}
BaseTransformer.register();

export class BaseCollectionTransform extends MDElement {
  // Subtle Note: This object creates BaseTransformer children by which it manages the viewParent children.
  // Do NOT ever set this object's textContent, as it will blow away the BaseTransformer children!
  get collection() { // Must be provided by client. But here it is a rule so that we update when it is set.
    return null;
  }
  get tags() { // Must be provided by client.
    return this.collection?.knownTags || [];
  }
  get transform() { // Where the work is done.
    return new CollectionTransform({source: this});
  }
  get tagsEffect() { // Demand the work.
    return this.transform.transformers;
  }
}
BaseCollectionTransform.register();
