import { Rule } from '@kilroy-code/rules';
import { MutableCollection, LiveRecord } from '../lib/mutable-collection.mjs';
import { CollectionTransform } from '../lib/collection-transform.mjs';


function delay(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class TestElement {
  parentElement = null;
  children = [];
  dataset = {};
  setAttribute(key, value) {
    this[key] = value.toString();
  }
  getAttribute(key) {
    return this[key];
  }
  append(element) {
    element.parentElement = this;
    this.children.push(element);
  }
  before(element) {
    element.remove();
    const index = this.parentElement.children.indexOf(this);
    this.parentElement.children.splice(index, 0, element);
  }
  remove() {
    if (!this.parentElement) return;
    const index = this.parentElement.children.indexOf(this);
    this.parentElement.children.splice(index, 1);
    this.parentElement = null;
  }
}
var tagMap = {'test-element': TestElement};
var document = {
  createElement(tag) {
    return new tagMap[tag];
  }
};
describe('TestElement', function () { // Test our TestElement harness
  let elements = Array.from({length: 6}, (_, i) => { let e = document.createElement('test-element'); e.dataset.key = i; return e; }),
      [zero, one, two, three, four, parent] = elements;
  parent.append(one);
  parent.append(three);
  one.before(zero);
  three.before(two);
  four.remove();
  it('retains order.', function () {
    [zero, one, two, three].forEach((element, i) => expect(element.dataset.key).toEqual(i));
  });
});

class Transform extends TestElement {
  get model() {
    return null;
  }
  get view() {
    return new TestElement();
  }
  // If the view is a UI Element, then it can be defined with rules that get track the models's rules.
  // But this is often used where the viewParent is expecting it's children to be a particular class
  // rather than one of our classes, and so there must be some pushing into the naked view element.
  // This is usually done on a individual basis for view.textContent, view.setAttribute, or similarly for
  // children of view. Here we roll all that up into one eager rule.
  get sideEffects() {
    this.view.title = this.model.title;
    this.view.differentiator = this.getAttribute('slot');
    return this.view.dataset.key = this.dataset.key; // Our responsibility, not CollectionTransform.
  }
}
Rule.rulify(Transform.prototype, {eagerNames: ['sideEffects']});
tagMap['transform'] = Transform;

class TestCollectionTransform extends CollectionTransform {
  get tags() { // A rule reflecting changes within the collection.
    return this.collection.knownTags;
  }
  get sideEffects() {
    this.transformers.forEach(transform => transform.sideEffects);
    return true;
  }
}
Rule.rulify(TestCollectionTransform.prototype, {eagerNames: ['sideEffects']});

class TestLiveCollectionTransform extends TestCollectionTransform {
  get tags() {
    return this.collection.liveTags;
  }
}
Rule.rulify(TestLiveCollectionTransform.prototype);

describe('CollectionTransform', function () {
  let collection, transforms = {};
  beforeAll(async function () {
    collection = new MutableCollection();
    const transformerParent = new TestElement();
    const viewParent = new TestElement();
    const transformerTag = 'transform';
    function createEmptyElement(tag) { return document.createElement(tag); }
    function getRecord(tag) {
      return Promise.resolve({title: tag});
    }
    async function getModel(tag) {
      return Promise.resolve(new LiveRecord(await getRecord(tag)));
    }


    transforms.knownTags = new TestCollectionTransform();
    Object.assign(transforms.knownTags, {collection, createEmptyElement, transformerParent, viewParent, transformerTag});
    transforms.knownTags.sideEffects; // Even an eager rule must be demanded once to kick things off.

    transforms.liveTags = new TestLiveCollectionTransform();
    Object.assign(transforms.liveTags, {collection, createEmptyElement, transformerParent, viewParent, transformerTag,
					slotName: 'live'});
    transforms.liveTags.sideEffects;

    collection.updateKnownTags(['r1', 'one', 'r2', 'four', 'three', 'r3'], getRecord);
    await delay(100); // Allow a tick for things to be updated, as a more reprentative test.
    collection.updateKnownTags(['zero', 'one', 'two', 'three', 'four'], getRecord);
    await delay(); // Things won't update until the next tick.

    collection.updateLiveTags(['five', 'three', 'six'], getModel);
    await delay(100);
    collection.updateLiveTags(['three', 'five'], getModel);
    await delay();
    //*/
  });
  function check(label, expectedTags) {
    describe(label, function () {
      let collectionTransform;
      beforeAll(function () {
	collectionTransform = transforms[label];
      });
      it('keeps transforms in correct order.', function () {
	let transformers = collectionTransform.transformers;
	expectedTags.forEach((tag, index) => {
	  const transformer = transformers[index];
	  expect(transformer.dataset.key).toBe(tag);
	});
      });
      it('keeps views in correct order.', function () {
	let transformers = collectionTransform.transformers,
	    views = collectionTransform.viewParent.children.filter(e => e.differentiator === collectionTransform.slotName);
	expectedTags.forEach((tag, index) => {
	  const transformer = transformers[index],
		view = views[index];
	  expect(view.dataset.key).toBe(tag);
	  expect(view).toBe(transformer.view);
	});
      });
      it('view properties are maintained.', function () {
	let transformers = collectionTransform.transformers;
	expectedTags.forEach((tag, index) => {
	  const transformer = transformers[index];
	  expect(transformer.model.title).toBe(tag); // In this case, where records define title === tag.
	  expect(transformer.view.title).toBe(transformer.model.title);
	});
      });
    });
  }
  check('knownTags', ['zero', 'one', 'two', 'three', 'four']);
  check('liveTags', ['three', 'five']);
});
