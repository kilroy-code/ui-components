import { MDElement } from './md-element.mjs';

export class ListTransform extends MDElement {
  get itemParent() {
    return this.content.firstElementChild;
  }
  get models() { // Alternatively to supplying getModel and calling setModel, one can set the models
    return [];
  }
  get modelsEffect() {
    if (!this.models.length) return false;
    let keys = this.models.map(model => model.title);
    this.setKeys(keys);
    return true;
  }
  getModel(key) {
    return this.models.find(model => model.dataset.key === key) || {title: key};
  }
  getCachedModel(key) {
    return this.getTransformer(key)?.model;
  }
  get viewTag() {
    console.warn(`Please specifify a viewTag for ${this.title}.`);
    return '';
  }
  getTransformer(key) {
    return this.transformers.find(item => item.dataset.key === key);
  }
  get transformers() { // Handy for finding things among transformers, and knowing if it has changed.
    return Array.from(this.children).filter(item => item.dataset.key !== undefined);
  }
  findFrom(key, items, start) {
    for (let i = start; i < items.length; i++) {
      if (items[i].dataset.key === key) return items[i];
    }
    return null;
  }
  createNewItem(key) {
    const insert = document.createElement(this.viewTag);
    insert.dataset.key = key;
    insert.setAttribute('slot', 'transformer');
    // Each view transform is responsible for managing view.dataset.key
    // fixme? insert.view.dataset.key = key; // insert.view demands a bunch of stuff
    const model = this.getModel(key);
    if (model?.then) { // A Promise
      model.then(model => insert.model = model);
    } else {
      insert.model = model;
    }
    return insert;
  }
  setKeys(keys) { // Adds or removes viewTag elements to maintain ordered correspondence with keys.
    const items = this.children; // A live collection that changes as elements are added/removed.
    let keyIndex = 0; // Outside the loop. We may get to the end of items and still have keys to add.
    let change = false;
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const item = items[itemIndex],
	    itemKey = item.dataset.key;
      if (!itemKey) continue; // Don't touch.

      // Remove if not in keys.
      if (!keys.includes(itemKey)) {
	item.remove();
	item.view.remove();
	change = true;
	itemIndex--;
	continue;
      }
      const key = keys[keyIndex];

      // Leave it if it matches at this position.
      if (itemKey === key) {
	keyIndex++;
	continue;
      }

      // If key is found later in children, move it to here.
      let later = this.findFrom(key, items, itemIndex + 1);
      if (later) {
	item.before(later);
	item.view.before(later.view);
	keyIndex++;
	change = true;
	continue;
      }

      // Insert new item.
      const insert = this.createNewItem(key);
      item.before(insert);
      item.view.before(insert.view);
      change = true;
      keyIndex++;
    }
    // Now add any remaining keys at end.
    while (keyIndex < keys.length) {
      const key = keys[keyIndex],
	    insert = this.createNewItem(key);
      keyIndex++;
      this.append(insert);
      this.itemParent.append(insert.view);
      change = true;
    }
    if (change) {
      // Allow dependencies to be registired before we start breaking them.
      setTimeout(() => this.transformers = undefined);
    }
    return keys;
  }
}
ListTransform.register();
