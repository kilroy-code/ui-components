import { Rule } from '@kilroy-code/rules';

// Models a mutable collection of mutable records. There are different E.g., users, groups, product, etc.
//
// There is a rule property that is dynamically created for each record in the collection, named by a tag.
// Each tag must be a string unique within the collection, and distinct from any of the method names.
// It might or might not be the same as the record's title.
//
// Other rules elswhere that referenced the named property will get updated when the record property is changed as a whole.
// - The value may be initially null, and then contain an object when the information arrives over the network.
// - At that time, it may be set to a dumb object with static properties such as title, optional description and picture.
//   Such properties are not changed, except by replacing the entire record value.
// - Or the record value may be a live object of named rules, such that a rule that references, e.g., the model?.title
//   will get updated only when the title referenced record rule changes.
// - The record and it's tag-named rule may also be removed from the collection (such that referenced to that tag yield undefined).
// Thus a rule might reference, e.g., collection.someTag?.title.
//
// updateKnownTags(tags, getRecord) ensures that there is a record rule with at least the POJO returned by getRecord(tag).
// An application can use this combination in multiple ways. E.g.,:
// - An initial list of tags could be fetched and passed to updateKnownTags, and repated at interesting times during
//   the application's life cycle. getRecord(tag) might fetch a full or partial record, but in any case only the summary need
//   be saved. If updateKnownTags is called again, the older data
//   is still available as the refreshed data comes in, and the record rules are updated for any dependent rules.
//   E.g., updateKnownTags(tags, fetchPublicRecord)
// - A single live "directory" model might be connected which calls updateKnownTags once, with getRecord immediately
//   resolving to the live simple record from that directory.
//
// updateLiveTags(tags, getModel) ensures that the specified tags are full live models with rule properties. This is for
// rich data used by application such as the user's own personas or the groups that the current persona specifically belongs to.

export class LiveRecord { // Applications can subclass this to provide existing rules to be used for missing data.
  isLiveRecord = true;
  constructor(properties) {
    for (const key in properties) {
      const value = properties[key]; // Keep it, in case the object passed in by properties is bashed.
      // TODO: skip this if 'this' already has the property defined.
      Rule.attach(this, key, () => value);
    }
  }
}

export class LiveCollection {
  constructor({records, getRecordTag, ...properties} = {}) {
    Object.assign(this, properties);
    if (records) { // If a list of initial records is provided, updateKnownTags frrom that.
      getRecordTag ||= record => record.tag || record.title;
      this.updateKnownTags(records.map(getRecordTag),
			   tag => records.find(record => tag === getRecordTag(record)));
    }
  }
  get knownTags() { // The ordered list of tags last provided to updateKnownTags.
    return [];
  }
  updateKnownTags(tags, getTagRecord = tag => this.getRecord(tag)) { // Specifies or updates the set of tags for which the collection must have at least POJO records.
    this._knownTagsSet = this._removeMissingTags(tags, this.knownTags);
    for (const tag of tags) {
      if (!this[tag]?.isLiveRecord) { // Don't call getTagRecord for existing live records.
	this.updateKnownRecord(tag, getTagRecord(tag));
      }
    }
    if (this.knownTags.toString() === tags.toString()) return tags;
    return this.knownTags = tags; // Resets any referencing rules.
  }
  get liveTags() { // The ordered list of tags last provided to updateLiveTags.
    return [];
  }
  updateLiveTags(tags, getTagModel = tag => this.getLiveRecord(tag)) { // Specifies or updates the set of tags for which changes to each property are propogated.
    const liveTags = this.liveTags,
	  liveLength = liveTags.length,
	  knownTagsSet = (this._knownTagsSet ||= new Set()),
	  knownSize = knownTagsSet.size;
    for (const tag of tags) {
      if (!this[tag]?.isLiveRecord) { // Don't call getTagModel for existing live records.
	this.updateKnownRecord(tag, getTagModel(tag));
      }
      if (!knownTagsSet.has(tag)) {
	knownTagsSet.add(tag);
	this.knownTags.push(tag);
      }
    }
    // We do not downgrade live records that are no longer in live tags. Should we?
    if (this.liveTags.toString() !== tags.toString()) this.liveTags = tags;
    if (knownTagsSet.size !== knownSize) this.knownTags = this.knownTags;
    return tags;
  }
  async updateLiveRecord(tag, next = null) { // Update a single live tag, which must already have a live record.
    // If the new data is already known (as for update events) it  can be specified, else it will be retrieved.
    let record = this[tag];
    if (!record?.isLiveRecord) {
      record = await this.getLiveRecord(tag);
      if (!next) return record;
    }
    next ??= await this.getRecord(tag);
    for (let key in next) record[key] = next[key]; // Object.assign does not include rules. for...in does.
    return record;
  }

  _removeMissingTags(next, previous) { // Return a new Set from the next Array, and delete any rules from this that anot present in next.
    const nextTagSet = new Set(next);
    previous.forEach(tag => nextTagSet.has(tag) || delete this[tag]);
    return nextTagSet;
  }
  _ensureRecordRule(tag, initialValue) { // IFF not already a rule, then synchronously assign initialValue (which can be a promise) as the value of a rule at tag.
    if (tag in this) return;
    Rule.attach(this, tag, () => initialValue, {configurable: true}); // deletable
  }
  updateKnownRecord(tag, promiseOrValue = this.getRecord(tag)) { // Ensure rule at tag with either a value or a null that will assigned by value when promiseOrValue resolves.
    const thenable = promiseOrValue.then;
    this._ensureRecordRule(tag, thenable ? null : promiseOrValue);
    // There can be overlapping requests in flight. Check again that we do not override a live record.
    if (thenable) promiseOrValue.then(model => this[tag]?.isLiveRecord || (this[tag] = model));
    return this[tag];
  }
}
Rule.rulify(LiveCollection.prototype);
