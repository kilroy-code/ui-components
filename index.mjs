import { Rule } from '@kilroy-code/rules';

function pascalCaseToHyphens(string) { // 'FooBarBaz' to foo-bar-baz'
  return string.replace(/[A-Z]/g, (match, offset) => (offset ? '-' : '') + match.toLowerCase());
}

export function hostElement(event) { // Returns the custom element that an event handler is attached to.
  return event.target.getRootNode().host;
}
window.hostElement = hostElement;

export class RuledElement extends HTMLElement {
  constructor() {
    super();
    this.initialize();
  }
  $(query) { // FIXME: filled in slots?
    return this.content.querySelector(query);
  }
  initialize() { // Default initializes from attributes and invokes all our rules for any potential side effect on display.
    this.setPropertiesFromAttributes();
    setTimeout(() => { this.content; this.update; }); // Compute these two eager rules for effect, but in a different dynamic context.
  }
  setPropertiesFromAttributes() { // Sets properties from the given attributes, if any.
    const attributes = this.attributes;
    for (let index = 0; index < attributes.length; index++) {
      const attributeName = attributes[index].name,
	    attributeValue = this.getAttribute(attributeName);
      this[attributeName.toLowerCase()] = /-?[0-9]/.test(attributeValue) ? JSON.parse(attributeValue) : attributeValue;
    }
  }
  setUpShadowTree() { // Create or reset shadowRoot, returning it.
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) return this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = '';
    return shadowRoot;
  }    
  get template() { // This HTML is what is displayed for our component. 
    return '<slot>No content specified.</slot>'; // Children of the element, or this text if none.
  }
  get styles() { // This CSS is applied exclusively to our component.
    return '';
  }
  get content() { // Eager rule to setUpShadowTree and populate it with this.template. Must return tree for use by $(query).
    const tree = this.setUpShadowTree(),
	  template = document.createElement('template'),
	  style = document.createElement('style');
    template.innerHTML = this.template;
    style.innerHTML = this.styles;
    tree.append(style, template.content); // No need to cloneNode of our one-off template.
    return tree;
  }
  get update() { // Eager rule to update content. Default is to demand all rules that contain $ or [eE]ffect
    this.constructor.ruleNames.forEach(name => /\$|[eE]ffect/.test(name) && this[name]);
    return true;
  }
  // Rulify and define custom element.
  static register({tagName = pascalCaseToHyphens(this.name), // Of the custom element.
		   ...rulifyOptions} = {}) { // Everything else is handed to rulify as-is.
    const proto = this.prototype,
	  ruleNames = this.ruleNames = (Object.getPrototypeOf(this).ruleNames || []).slice(); // A copy.
    Rule.rulify(proto, rulifyOptions);
    // Push any resulting rules onto ruleNames, for use by update(). IWBNI rulify did this for us. 
    Object.entries(Object.getOwnPropertyDescriptors(proto)).forEach(([key, {get}]) => get && ruleNames.push(key));
    customElements.define(tagName, this);
  }
}
RuledElement.register({eagerNames: ['content', 'update']});
