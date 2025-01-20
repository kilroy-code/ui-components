import { Rule } from '@kilroy-code/rules';

export class CollectionTransform {
  constructor(properties = {}) {
    Object.assign(this, properties);
  }
  get tags() { // Typically either this.collection.knownTags or .liveTags, or a filtering of either.
    // Note: MutableCollection.knownKeys and .liveTags, and many rules based on them,
    // do not reset if their values have not changed in the corresponding update.
    // If this tags does not change, transformers won't change either.
    return this.fromSource('tags');
  }
  get collection() { // Where the models come from.
    return this.fromSource('collection', null);
  }
  get transformerParent() { // Where the transformers are added as children.
    // Must have children live collection, and an append() method that accepts transformer objects.
    // Test suite sets this, but in practice, I think it always uses the default.
    return this.fromSource('transformerParent', this.source);
  }
  get viewParent() { // Where the views are added as children.
    return this.fromSource('viewParent');
  }
  get transformerTag() { // The tagName to be used when creating a  for tag.
    // The value is passed to document.createElement, and the result of that is expected to
    // have rules, model and view, method's remove() and before(), a dataset property, and
    // be a suitable argument for this.transformerParent.append().
    return this.fromSource('transformerTag');
  }
  get slotName() {
    return this.fromSource('slotName', 'transformer');
  }
  get source() {
    return null;
  }
  /* TODO: something like this? But how does it initially get demanded?
     Or at least make some of the above be simple properties?
  get resetEffect() { // There is little reason to assign any of the previous five, but if
    // someone does, this attempts to reset transformers and views.
    this.collection, this.transformerParent, this.viewParent; this.transformerTag, this.slotName;
    const tags = this.tags;
    this.tags = [];
    // Allow transformers and views to be removed.
    return setTimeout(() => this.tags = tags); // And re-added based on the new values.
  }
  */
  fromSource(propertyName, defaultValue) {
    return this.source?.[propertyName] || (defaultValue !== undefined ? defaultValue : this.warn(propertyName));
  }
  warn(propertyName) {
    console.warn(`Please set ${this} ${propertyName} or source.`);
    return null;
  }
  createEmptyElement(tag) { // Split out so that it can be redefined in test suites
    return document.createElement(tag);
  }
  createTransformer(key) {
    const insert = this.createEmptyElement(this.transformerTag);
    insert.dataset.key = key;
    insert.setAttribute('slot', this.slotName); // Keeps it out of other slots.
    insert.collection = this.collection; // Transformer rules such as model will reference the collection[tag].
    // Each transformer is responsible for managing view.dataset.key if/as appropriate.
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
    const viewChildren = this.viewParent.children;
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const item = items[itemIndex],
	    itemKey = item.dataset.key;
      if (!itemKey || item.getAttribute('slot') !== this.slotName) continue; // Don't touch.

      // It is possible for item.view to have changed since last time (e.g., if it depends on
      // an item model that has changed). There are cases (ListDivider.copyContent) where it is damn
      // hard to avoid that, and it is also very easy for this to happen accidentally (and damn hard
      // to debug). So here we fix things up if that happens.
      let viewCandidate = this.viewParent.children[keyIndex];
      if (viewCandidate && (viewCandidate !== item.view)) { // Only bother with this if the view is not what is expected.
	let match = viewCandidate.dataset.key === itemKey; // Keys must be unique, so this completely tells us if the candidate is right.
	if (!match) { // It is theoretically possible that the ordering is different. Find the right view child by key.
	  let children = this.viewParent.children;
	  for (let i = 0; i < children.length; i++) {
	    if (children[i].dataset.key === itemKey) {
	      viewCandidate  = children[i];
	      break;
	    }
	  }
	}
	// Now check again:
	if (viewCandidate && (viewCandidate !== item.view)) {
	  if (viewCandidate) viewCandidate.replaceWith(item.view); // Update to current view.
	  else console.warn(`Unable to locate view match for ${itemKey}.`);
	}
      }

      // Remove if not in keys.
      if (!tagSet.has(itemKey)) {
	item.remove();
	let viewChild = viewChildren[keyIndex];
	item.view.remove();
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
