import { Rule } from '@kilroy-code/rules';
import { LiveCollection, LiveRecord } from '../lib/mutable-collection.mjs';

describe('LiveRecord', function () {
  const data = {a: 17};
  const liveRecord = new LiveRecord(data);
  class Referencer {
    get a() { return liveRecord.a; }
  }
  Rule.rulify(Referencer.prototype);
  let referencer = new Referencer();
  let capturedA = referencer.a;
  it('defines property for property passed to constructor.', function () {
    expect(capturedA).toBe(data.a); // captured in case next test runs first
  });
  it('referencing rules update when live record rule is changed.', function () {
    liveRecord.a = 42;
    expect(referencer.a).toBe(42);
  });
});
	 
describe('LiveCollection', function () {
  const collection = new LiveCollection();
  class Referencer {
    get knownTags() { return collection.knownTags; }
    get liveTags() { return collection.liveTags; }
    get a() { return collection.a; }
    get b() { return collection.b; }
    get c() { return collection.c || null; } // because collection.c can be deleted.
    get d() { return collection.d; }
    get e() { return collection.e; }
    get f() { return collection.f; }
    get bDescription() { return this.b.description; }
    get fDescription() { return this.f.description; }
  }
  Rule.rulify(Referencer.prototype);
  const referencer = new Referencer();
  const data = {
    a: {title: 'a-title'},
    b: {title: 'b-title', description: 'b-description'},
    c: {title: 'c-title'},
    d: {title: 'd-title'},
    e: {title: 'e-title'},
    f: {title: 'f-title', description: 'f-description'},
  };
  function getRecordSync(tag) {
    return Object.assign({}, data[tag]); // fresh object
  }
  describe('setup from records', function () {
    it('populates knownTags.', function () {
      let records = [{title: 'a'}, {title: 'b'}],
	  collection = new LiveCollection({records});
      expect(collection.knownTags).toEqual(['a', 'b']);
      expect(collection.a.title).toBe('a');
      expect(collection.b.title).toBe('b');
    });
  });
  describe('knownTags', function () {
    let original, afterFirstUpdate;
    beforeAll(function () {
      original = referencer.knownTags;
      collection.updateKnownTags(['a', 'b', 'c'], getRecordSync);
      afterFirstUpdate = referencer.knownTags;
    });
    it('is initially empty.', function () {
      expect(original.length).toBe(0);
    });
    it('updates after updateKnownTags()', function () {
      expect(referencer.knownTags).not.toBe(original);
      expect(referencer.knownTags.includes('a')).toBeTruthy();
      expect(referencer.knownTags.includes('b')).toBeTruthy();
      // May or may not include 'c', depending on the order the tests are run.
    });
    it('ensures named references for tags.', function () {
      expect(referencer.a.title).toBe('a-title');
      expect(referencer.b.title).toBe('b-title');
    });
    it('only updates if actually changed.', function () {
      let before = referencer.knownTags;
      collection.updateKnownTags(JSON.parse(JSON.stringify(before)), getRecordSync);
      expect(referencer.knownTags).toBe(before);
    });
    describe('when repeated', function () {
      let referenceABefore, referenceAAfter;
      beforeAll(function () {
	referenceABefore = referencer.a;
	collection.updateKnownTags(['a', 'b'], getRecordSync);
      });
      it('updates knownTags references.', function () {
	expect(referencer.knownTags).not.toBe(afterFirstUpdate);
	expect(referencer.knownTags.includes('a')).toBeTruthy();
	expect(referencer.knownTags.includes('b')).toBeTruthy();
	expect(referencer.knownTags.includes('c')).toBeFalsy();
      });
      it('updates record references.', function () {
	expect(referenceABefore).not.toBe(referenceAAfter);
	expect(referencer.a.title).toBe('a-title');
      });
      it('removes tags that are no longer present.', function () {
	expect(collection.c?.title).toBeFalsy();
	expect(referencer.c?.title).toBeFalsy();
      });
    });
    describe('with asynchronous records', function () {
      let preAsyncA, initialAsyncA, initialAsyncD;
      function getRecordAsync(tag) {
	return Promise.resolve(getRecordSync(tag));
      }
      beforeAll(function () {
	preAsyncA = referencer.a;
	collection.updateKnownTags(['a', 'b', 'd'], getRecordAsync);
	initialAsyncA = referencer.a;
	initialAsyncD = referencer.d;
      });
      it('initially sets NEW record rules to null.', function () {
	expect(initialAsyncD).toBe(null);
      });
      it('does not reset existing record rules until the new record comes in.', function () {
	expect(initialAsyncA).toBe(preAsyncA);
      });
      it('sets record rules when they come in.', function () {
	expect(referencer.a.title).toBe('a-title');
	expect(referencer.d.title).toBe('d-title');
      });
    });
    describe('liveTags', function () {
      let beforeLive, afterLive;
      function getModelSync(tag) {
	const record = getRecordSync(tag);
	const liveRecord = new LiveRecord(record);
	return liveRecord;
      }
      beforeAll(function () {
	beforeLive = referencer.liveTags;
	collection.updateLiveTags(['b', 'e'], getRecordSync); // fixme getModelSync);
	afterLive = referencer.liveTags;
      });
      it('is initially empty.', function () {
	expect(beforeLive.length).toBe(0);
      });
      it('updates after updateLiveTags()', function () {
	expect(afterLive.length).not.toBe(original);
	expect(afterLive.includes('b')).toBeTruthy();
	expect(afterLive.includes('e')).toBeTruthy();
	expect(afterLive.includes('a')).toBeFalsy(); // Not in the list for live.
      });
      it('ensures named references for tags.', function () {
	expect(referencer.b.title).toBe('b-title');
	expect(collection.e.title).toBe('e-title');	
      });
      it('does not remove unmentioned tags.', function () {
	expect(referencer.a.title).toBe('a-title');
      });
      it('only updates if actually changed.', function () {
	let before = referencer.liveTags;
	collection.updateLiveTags(JSON.parse(JSON.stringify(before)), getRecordSync);
	expect(referencer.liveTags).toBe(before);
      });
      describe('with asynchronous records', function () {
	let preAsyncB, initialAsyncB, initialAsyncF;
	function getModelAsync(tag) {
	  return Promise.resolve(getModelSync(tag));
	}
	beforeAll(function () {
	  preAsyncB = referencer.b;
	  collection.updateLiveTags(['f', 'b'], getModelAsync);
	  initialAsyncB = referencer.b;
	  initialAsyncF = referencer.f;
	});
	it('initially sets NEW record rules to null.', function () {
	  expect(initialAsyncF).toBe(null);
	});
	it('does not reset existing record rules untl the new record comes in.', function () {
	  expect(initialAsyncB).toBe(preAsyncB);
	});
	it('sets record rules when they come in.', function () {
	  expect(referencer.b.title).toBe('b-title');
	  expect(referencer.f.title).toBe('f-title');
	});
	it('listed record rules update their rule properties rather than the whole record.', function () {
	  let initialDescriptionB = referencer.bDescription;
	  let initialDescriptionF = referencer.fDescription;
	  collection.b.description = 'b-description-2';
	  collection.f.description = 'f-description-2';
	  expect(initialDescriptionB).toBe('b-description');
	  expect(referencer.bDescription).toBe('b-description-2');
	  expect(initialDescriptionF).toBe('f-description');
	  expect(referencer.fDescription).toBe('f-description-2');
	});
      });
    });
  });
});
