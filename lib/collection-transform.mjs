import { Rule } from '@kilroy-code/rules';

export class CollectionTransform {
  get collection() { // Where the models come from.
    return this.warn('collection');
  }
  get tags() { // Typically either this.collection.knownTags or .liveTags, or a filtering of either.
    // Note: MutableCollection.knownKeys and .liveTags, and many rules based on them,
    // do not reset if their values have not changed in the corresponding update.
    // If this tags does not change, transformers won't change either.
    return this.warn('keys');
  }
  get transformerParent() { // Where the transformers are added as children.
    // Must a children live collection, and an append() method that accepts transformer objects.
    return this.warn('modelParent');
  }
  get viewParent() { // Where the views are added as children.
    return this.warn('itemParent');
  }
  get transformerTag() { // The tagName to be used when creating a  for tag.
    // The value is passed to document.createElement, and the result of that is expected to
    // have rules, model and view, method's remove() and before(), a dataset property, and
    // be a suitable argument for this.transformerParent.append().
    return this.warn('viewTag');
  }
  get slotName() {
    return 'transformer';
  }
  warn(propertyName) {
    console.warn(`Please set ${this} ${propertyName}.`);
    return null;
  }
  createEmptyElement(tag) { // Split out so that it can be redefined in test suites
    return document.createElement(tag);
  }
  createTransformer(key) {
    const insert = this.createEmptyElement(this.transformerTag);
    insert.dataset.key = key;
    insert.setAttribute('slot', this.slotName); // Keeps it out of other slots.
    // Each view transform is responsible for managing view.dataset.key if/as appropriate.
    insert.model = this.collection[key];
    return insert;
  }
  get transformers() { // Returns a list of the transofmers, adding or removeing viewTag elements to maintain ordered correspondence with keys.
    // Note: Client must demand this to get the effect.
    const keys = this.tags;
    const transformers = [];
    const items = this.transformerParent.children; // A live collection that changes as elements are added/removed.
    const tagSet = new Set(keys);
    let keyIndex = 0; // Outside the loop. We may get to the end of items and still have keys to add.    
    let change = false;
    function findFrom(key, start) {
      for (let i = start; i < items.length; i++) {
	if (items[i].dataset.key === key) return items[i];
      }
      return null;
    }

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const item = items[itemIndex],
	    itemKey = item.dataset.key;
      if (!itemKey || item.getAttribute('slot' !== this.slotName)) continue; // Don't touch.

      // Remove if not in keys.
      if (!tagSet.has(itemKey)) {
	item.remove();
	item.view.remove();
	transformers.splice(itemIndex, 1);
	itemIndex--;
	continue;
      }
      const key = keys[keyIndex];

      // Leave it if it matches at this position.
      if (itemKey === key) {
	transformers.push(item);
	keyIndex++;
	continue;
      }

      // If key is found later in children, move it to here.
      let later = findFrom(key, itemIndex + 1);
      if (later) {
	item.before(later);
	item.view.before(later.view);
	transformers.push(later);
	keyIndex++;
	continue;
      }

      // Insert new item at this position;
      const insert = this.createTransformer(key);
      item.before(insert);
      item.view.before(insert.view);
      transformers.push(insert);
      keyIndex++;
    }
    // Now add any remaining keys at end.
    while (keyIndex < keys.length) {
      const key = keys[keyIndex],
	    insert = this.createTransformer(key);
      keyIndex++;
      this.transformerParent.append(insert);
      this.viewParent.append(insert.view);
      transformers.push(insert);
    }
    return transformers;
  }
}
Rule.rulify(CollectionTransform.prototype);
