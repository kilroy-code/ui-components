import { Rule } from '@kilroy-code/rules';
const {customElements} = window; // Defined by browser.

export function hostElement(event) { // Returns the custom element that an event handler is attached to.
  return event.target.getRootNode().host;
}
window.hostElement = hostElement;

export class RuledElement extends HTMLElement {
  connectedCallback() {
    // A browser implementation might not have attributes available to the constructor. But they are always available here.
    this.setPropertiesFromAttributes();
    // If the content references other rules -- including rules in the connectedCallback/content/template of elements 
    this.content;  // that are defined by our template -- then resetting those will cause our content to be recomputed.
    // Here we deliberately do this in the next tick, so that initialize/update/mumbeEffect rules of our shadow
    setTimeout(() => this.initialize());  // children are NOT used by our content.
  }
  initialize() { // Default initializes from attributes and invokes all our rules for any potential side effect on display.
    this.update; // Compute these two eager rules for effect, but in a different dynamic context.
    setTimeout(() => this.afterInitialize());
  }
  afterInitialize() {
  }
  setPropertiesFromAttributes() { // Sets properties from the given attributes, if any.
    const attributes = this.attributes;
    for (let index = 0; index < attributes.length; index++) {
      const attributeName = attributes[index].name,
	    propertyName = this.attributeToPropertyName(attributeName, 'en'),
	    attributeValue = this.getAttribute(attributeName),
	    parseable = attributeValue && /^-?[0-9]/.test(attributeValue);
      this[propertyName] = parseable ? JSON.parse(attributeValue) : attributeValue;
    }
  }
  setUpShadowTree() { // Create or reset shadowRoot, returning it.
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) return this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = '';
    return shadowRoot;
  }    
  get template() { // This HTML is what is displayed for our component. 
    return '<slot><i>Add content as children.</i></slot>'; // Children of the element, or this text if none.
  }
  get styles() { // This CSS is applied exclusively to our component.
    return '';
  }
  get cssState() { // On-demand custom ElementInternals object, including a CustomStateSet that can be used in css pseudo-classes.
    return this.attachInternals();
  }
  get content() { // Eager rule to setUpShadowTree and populate it with this.template. Must return tree for use by $(query).
    // Do we need content to be eager? Couldn't we just demand it explicitly from update, or put a $ in it's name?
    const tree = this.setUpShadowTree();
    this.maybeAppend('template', tree, this.template);  // No need to clone a one-off template
    this.maybeAppend('style', tree, this.styles); // Maybe this should be split, so that a change to styles doesn't cause new shadow children?
    return tree;
  }
  get update() { // Eager rule to update content. Default is to demand all rules that contain $ or [eE]ffect
    this.constructor.ruleNames.forEach(name => /\$|[eE]ffect/.test(name) && this[name]);
    return true;
  }
  get lang() { // What language is this element? Used for default in toXxxCase.
    // If lang is specified as an attribute for this element, setPropertiesFromAttributes will override this rule with a value.
    // Otherwse, this rule looks up through ancestors for a value, ultimately defaulting to 'en'.
    return this.getAttributeOrPropertyInAncestors({attributeName: 'lang', propertyName: 'lang', node: this.parentElement}) || 'en';
  }
  // Rulify and define custom element.
  static register({tagName = this.toKebabCase(this.name, 'en'), // Of the custom element.
		   ...rulifyOptions} = {}) { // Everything else is handed to rulify as-is.
    const proto = this.prototype,
	  ruleNames = this.ruleNames = (Object.getPrototypeOf(this).ruleNames || []).slice(); // A copy.
    Rule.rulify(proto, rulifyOptions);
    // Push any resulting rules onto ruleNames, for use by update(). IWBNI rulify did this for us. 
    Object.entries(Object.getOwnPropertyDescriptors(proto)).forEach(([key, {get}]) => get && ruleNames.push(key));
    customElements.define(tagName, this);
  }
  // Utilities
  set(property, value) { // Makes it easy to use this.something?.set('somePropertyName', value)
    this[property] = value;
    return this;
  }
  // The following instance methods accept a lang argument that defaults to this.lang.
  toLowerCase(string, lang = this.lang) {
    return string.toLocaleLowerCase(lang);
  }
  toUpperCase(string, lang = this.lang) {
    return string.toLocaleUpperCase(lang);
  }
  toCapitalCase(string, lang = this.lang) {
    return this.toUpperCase(string[0], lang) + this.toLowerCase(string.slice(1), lang);
  }
  toKebabCase(string, lang = this.lang) { // Converts FooBarBaz or fooBarBaz to 'foo-bar-baz'.
    return string.replace(/[A-Z]/g, (match, offset) => (offset ? '-' : '') + this.toLowerCase(match, lang));
  }
  static toKebabCase(string, lang) { // Needed for register(). lang is not optional.
    return string.replace(/[A-Z]/g, (match, offset) => (offset ? '-' : '') + match.toLocaleLowerCase(lang));
  }
  attributeToPropertyName(attributeName, lang = 'en') {
    return attributeName.split('-').map((part, index) => index ? this.toCapitalCase(part, lang) : this.toLowerCase(part, lang)).join('');
  }
  getAttributeOrPropertyInAncestors({attributeName, lang = 'en', node = this,
				     propertyName = this.attributeToPropertyName(attributeName, lang)}) {
    // Look up the tree for a property or attribute. Either attributeName or propertyName must be specified.
    // There are some subtleties in examining properties:
    // 1. Built in HTMLElement properties often default to '' instead of undefined or inheriting from parent.
    //    So if we hit an empty string property value, we keep looking.
    // 2. To skip looking in the local node, supply node:this.parentElement.
    //    This is common in a rule that uses this method. Note that an attribute will override the rule.
    attributeName ||= this.toKebabCase(propertyName, lang);
    if (node[propertyName] !== '') return node[propertyName];
    if (node.hasAttribute(attributeName)) return node.getAttribute(attributeName);
    if (node.parentElement) return this.getAttributeOrPropertyInAncestors({attributeName, lang, propertyName, node: node.parentElement});
    return undefined;
  }

  fromHTML(tag, html) { // Return an element wrapped in tag.
    let element = document.createElement(tag);
    element.innerHTML = html;
    return element;
  }
  maybeAppend(tag, parent, content = this[tag]) { // parent.append(<tag>...content</tag>>) IFF content is truthy.
    // Returns new element or null.
    // If content has a content attribute (as template elements do), use that instead.
    if (!content) return null;
    const element = this.fromHTML(tag, content);
    parent.appendChild(element.content || element);
    return element;
  }
  toggleState(name, on = !this.cssStates.states.has(name)) { // Toggle the named custom state, or force it on or off.
    const operation = on ? 'add' : 'delete';
    this.cssState.states[operation](name);
    return !!on;
  }
  doc$(query) { return document.querySelector(query); }
  shadow$(query) { return this.content.querySelector(query); }
  child$(query) { return this.querySelector(query); }
  $(query) { return this.child$(query) || this.shadow$(query) || this.doc$(query); }
}
RuledElement.register({eagerNames: ['update']});
