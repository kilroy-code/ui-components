# Ruled Components

> A tiny but super efficient way to define and use Web Components.

It's the same general idea of [Lit](https://lit.dev/), but more so: smaller, faster, and more powerful.

If you look at the React, Svelte, and Lit UI frameworks, the general idea has been to have the framework keep track of the dependencies, and redraw the parts of the UI that need it when something changes. Within that model, the progression has been for each new framework to be lighter and more efficient by getting rid of issues from the previous inspiration.

We went at it from the other direction: We have a very smart, small, efficient, and _general_ dependency-tracking mechanism called [Rules](https://github.com/kilroy-code/rules), that was developed for rule-based expert systems. It's basically a way to define object properties that each works like a cell in a spreadsheet: each property defines a formula that computes the value (or side effect), keeping track of the other properties it references. When any of the dependency properties get changed, all and only the effected formula get recomputed.

Then we used that to make it super-easy to define Web Components that automatically update precisely the parts that need to update. (Given the separate general rule-engine, the Web Component part here is [incredibly tiny](./index.mjs).)

The result is pure Javascript with no build/rollup/packing required (but it can be used with any such system). Component definitions are even smaller and easier to undersand than Lit component definitions.

...smaller, faster, lighter
vs react: no vdom; updating "state var" is just an ordinary assignment, and dependencies are then tracked in any direction, not just downward in vdom; works as custom html elements within another framework (even within react!), or as a whole app, rather than being the whole app+display.
compare backbone.js

## Background

This section reviews the important information what developers need to know about elements, web components, attributes, properties, and children.

### Parameterizing Elements

The objects that appear in a browser's display and its developer tools are all HTML elements. Elements can be dynamically created in Javascript, and a static parameterization and composition of elements can be specified in HTML.

There are different types of elements for different purposes, distinguished by their `tagName`: `<p>some text</p>`, `<video src="movie.mp4"></video>`.

The behavior of a particular type of element can be further paremeterized by attributes: `<video id="instructions" type="video/mp4" width="600" controlslist="nodownload" src="movie"></video>`. HTML allows only strings to appear as attributes. Attributes and their string values can be accessed from Javascript: `element.getAttribute('src')`, `element.setAttribute('src', 'other.webm')`).

Most element attributes have a corresponding Javascript property that can be accessed directly: `element.src = 'other.webm'`. While each element can define it's own behavior, the usual practice are:
- Attributes are typically named in "kebab case" (e.g., `foo-bar-baz`) and the corresponding property is in "camel case" (e.g., `fooBarBaz`).
- When an element is created, any corresponding property is populated with the appropriate (often parsed) value.
- Setting a property from Javascript might or might not set the corresponding attribute. Dynamically setting an attribute from Javascript might or might not set the corresponding property. Therefore, many programmers treat attributes as static inputs to elements, and Javascript programs then examine/modify properties.

While attributes values cannot be objects, another way to parameterize the behavior of some elements is to provide child nodes to the element: `<p>This particular paragraph has this text.</p>`, `<video id="instructions"> <source src="movie.mp4" /> </video>`, `<ul> <li>apples</li> <li>organges</li> </ul>`.

Therefore, an element can do its work based on:
- String-valued attributes that are defined in the HTML that uses the element, and which are present from the moment the element is created.
- Properties (of any type) whose values are set either from attributes, or by Javascript after the element is created.
- Child elements that are added to the element.

### Web Components

However, you cannot specialize the behavior of a built in element by subclassing it. [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) are self-contained HTMLElements that are defined by an application or library, instead of by the browser. 
- Instead of having to define a mass of convention-laden HTML (like [this](https://m2.material.io/components/text-fields/web#other-variations), the app or library just defines a tag-name that can be used as if it were built in to the browser: `<my-text-field value="winning">Enter Label</my-text-field>`. 
- Web components can be composed into more complex components or whole apps. 
- Web components can also be used within any other framework or design tool.
- Web components can be subclassed.

A Web Component generally uses its attributes, properties, and any child elements to define a "shadow DOM" tree of elements that are displayed instead of the component. The elements in this shadow DOM tree are internal to the component, and applications that use the component don't have to worry about them. If one thinks of the attributes, properties and children as "inputs", the shadow DOM tree is the "output". 

A web component might examine its children "inputs" in order to figure out what to render in its shadow DOM tree, or it might want to just pass them through directly. The browser's [slot mechanism](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot) allows a child to be given as a child of the web component, but then get rendered within the corresponding slot of the shadow DOM tree.

### Rules

Ruled Components combines the power of [Web Components](web-components) with the power of Rules - something that has not been done before. 

Rules are special kind of property that automatically tracks dependencies. An application defines a rule as a getter -- a function with no parameters that computes a value. The value is then memoized - cached so that subsequent calls do not recompute the value or perform any side-effects produced by the computation. However, a setter is automatically defined by the system such that any new explicit assignment to a rule will clear the cached value of all the rules that depended on the assigned value _and only those rules.__ 

Most rules are "lazy": when a value is not cached, the rule will only be computed when something asks for the value. (This is also known as "demand-driven evaluation".) This means that rules can be defined for all potentially necessary computation, but only the ones that are actually needed are computed. 

In addition, a rule can be declared to be "eager", which means that after its value is uncached, it will automatically be re-demanded on the next tick. This is useful for rules that perform side effects such as updating ordinary objects (or elements) that are not rule-based. For example, an application can demand an eager rule that uses other rules to set some text in an element. Once that is done and the value cached, the text in the element will remain valid. However, if any of the dependencies change -- i.e., the other rules that this eager one deppended on -- then the rule's cache will be cleared and then the eager rule will be automatically re-executed, updating the text once again.

Compare this, for example, with React, in which any element and its descendants will be recomputed in their entirety when a depency changes. Here, only the immediately dependend rules (and their side-effects) are uncached, which also clears their immediate dependents, and so forth. In practice, this means that particular values - text, colors, small structures - are recommputed rather than whole parts of the DOM tree.

A rule can compute and cache any kind of value except `undefined`. (Setting a rule property to `undefined` is how it gets unchached and its dependencies reset.) The value can even be a Promise, and rule references will _automatically_ wait for the promise to resolve, and then automatically cached the resolved value instead. There's no need to know whether a referenced value is asynchronous, and no need to use `await` or `then`. There is one subtle catch. However, a rule must not use await or an asynchronous callback to suspend execution "in the middle" of a rule, because then the dependencies cannot be tracked after the suspension. (Indeed, a Javascript getter cannot use `await` anway.) It is fine if one rule produces a Promise as a value, and another rule references the first value. (Just don't try to combine them into one rule.)


## Easy Web Components

This package makes it easy to create your own [Web Components](#web-components) that can be [composed and parameterized](#parameterizing-elements) like any other element, and in additional convient ways.

### RuledElement

The RuledElement class uses rules to set up [web component](#web-component). It automatically populates properties from any corresponding initial attributes, demands a rule called `content` that is defined to create or clear the shadow DOM, populates it, and then explicitly demands any eager rules. 

The DOM is populated through two rules that may be overridden by subclasses: `template` should return the HTML that should be parsed and added to the DOM, and `styles` should return the CSS that will style that DOM (and not effect other components). These two rules _can_ be defined to reference other rules, such that changes to the required rules woud cause the shadow DOM to get cleared and recomputed. That's not too bad, as is just the shadow DOM within this component. However, it's even better to keep the template stable, and then update specific aspects through individual eager properties. 

To define a ruled component, one must define a class that extends RuledElement, and then call call the class's static `register()` method:

- This creates the association between the class and the custom element. By default, the tagName for a subclass of RuledElement is each word of the class name separated by dashes. E.g., the tagName for RuledElement is ruled-element.
- This processes the rules. By default, all `get` properties are rules, and all rules whose name contains the string "effect" or "Effect" are eager.


### ViewTransformer

The [slot mechanism](#web-components) mechanism is great when you want the user of your web component to be able to supply a child that will appear directly in your shadow DOM tree. But sometimes you need to wrap it in something else, or otherwise transform it. And sometimes you need to transform something that is not a child of your component because it is used elswhere in the DOM.

It would be best, if you own the model and the details of the view, to have the view simply be a property of the model. E.g., a model might have many view properties of different names, computing whatever they need to do. But often you don't own the model and thus cannot add a rule-based property to it. A ViewTransformer allows you to create a non-visual, rule-based component that lives as a somewhat inert child of the mode or anywhere else that is conveient. 

Meanwhile, it would best, if you own the place where the view is ultimately used, to simply append the view directly wherever needed. But somteimes the place where the view is going expects to have particular elements as children, without those children being "wrapped" in some other computation. Instead of a ViewTransformer _being_ a visual component to be used elsehwere, it computes a property called `view` that can be of any type -- including elements that you do not own -- and which is then appended elswhere as needed. Thus a ViewTransformer usually has no shadow DOM tree display, but instead produces an output element (or tree) of any kind that can become a child of a differnt element.

For example, suppose you have:

```
<your-component for="input-data">
  <!-- your component creates a shadow DOM of
    <thirdparty-component>
      <thirdparty-child/> <!-- Let's say that thirdparty-component requires this child. -->
	</thirdparty-component> -->
</your-component>
<video>
  <source id="input-data" src="whatever"></source>
</video>
```

You need to transform the `source` input into a suitable `thirdparty-child` input, without consuming it -- i.e., without changing where it appears in the DOM. Note that neither `<source>` nor `<thirdparty-child>` are your components, so they cannot be redefined to use the RuledElements mechanisms. You could write some complicated code within YourCopmponent to do this, but this isn't very re-usable. E.g., suppose the transormation is different depending on the type of the `input-data` element, or if the same transformation is needed in other components. In this case, you can create YourTransformer as subclass ViewTransformer:

```
<your-component for="input-data">
  <!-- your component creates a shadow DOM of
    <thirdparty-component>
      <thirdparty-child/> <!-- Let's say that thirdparty-component requires this child. -->
	</thirdparty-component> -->
  <your-transformer for="input-data"/>
</your-component>
<video>
  <source id="input-data" src="whatever"></source>
</video>
```

ViewTransformer has a `model` property and a `view` property:

- The model property is generally supplied by Javascript, or determined by a rule based on the component's properties, parent element, or children.
- Where an ordinary RuledElement attaches children to a shadow DOM tree for internal use, a ViewTransformer creates an element (often with children) that are available as the view property, specifically for use by other components who append the view to wherever it needs to appear.

In this example, `your-component` creates a `your-transformer` with the `source` is the model, and appends it as a child of `your-component` so that it doesn't get garbage-collected. Then, instead of passing `your-transformer` directly into the shadow DOM as a child of `third-party-component`, it passes the `view` of the `your-transformer`. In this way, the various rules in `your-transformer` can be written to keep `thirdparty-child` up to date as the application makes changes to the model (i.e., to `source` in this example).

This mechanism is particularly useful in conjunction with ListTransformer.

### ListTransformer

A ListTransformer is responsible for maintaining a set of ViewTransformers and using their views within its ownt shadow DOM tree.




----
## Examples

Ruled Components makes it easy to define a reusable component. Here's our version of [Lit's Hello World](https://lit.dev/playground/#sample=examples/hello-world):

```
import { RuledElement } from '@kilroy-code/ruled-components';
export class SimpleGreeting extends RuledElement {            // 1. Define your component class to inherit from RuledElement.
  get name() { return `Somebody`; }                           // 2. Define a getter rule for anything you want to compute or change.
  get template() { return `<p>Hello, ${this.name}!</p>`; }    // 3. Define a getter rule for the `template` HTML describeing the internal structure.
  get styles() { return `p { color: blue }`; }                // 4. Optionally define a `style` rule that will be applied only to your component.
}
SimpleGreeting.register();                                    // 5. Register your class.
```

After adding `<simple-greeting id="example" name="World"></simple-greeting>` to the DOM, Javascript can do: `example.name = "Everyone"`, and the display updates automatically.

All the usual Web Component mechanisms are there if you need them, but for most cases, here's what you need to know:

creates a tag with dashes in the name. the tag can be used (e.g., in the html source) before the class is defined.
internal "template" structure called the shadow dom. 
  internal structure can include a style element, which will apply only to the component
  elements you define in this internal structure are not visible (e.g., to query selection) outside your component
like any built-in element, a component can have attributes and child elements supplied by the rest of the page. (See [Using templates and slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots) for more on how child elements get used within your template structure.)

The above example is meant to match up with Lit, and it works the same way. In both cases, assigning a new value to `name` will cause the `template` and everything within it to be recomputed. However, we can do much better than that. A more efficient way to define this example in Ruled Components is:

```
import { RuledElement } from '@kilroy-code/ruled-components';
export class SimpleGreeting extends RuledElement {
  get name() { return `Somebody`; }
  get nameTarget() { return this.$('span'); } // Find the internal span element. Computed just once and then cached.
  get nameEffect() {                // By default, a rule named '*Effect*' will be run automatically if any of its dependencies change.
    this.nameTarget.textContent = this.name; // Change only and exactly what you want. The DOM structure does not change.
	return true;                    // Rules must return anything except undefined.
  }
  get template() { return `<p>Hello, <span></span>!</p>`; }  // Independent of this.name.
  get styles() { return `p { color: blue }`; }
}
SimpleGreeting.register(); 
```
With this definition, the internal structure does not get recomputed. Now we're starting to see the power of rule-based systems.


## Rules

All the flexibility of the [Rules package](https://github.com/kilroy-code/rules) is available to component and app builders. But for most cases, here's what you need to know:

1. By default, a getter becomes a rule when the class is registered. (RuledElement.register(options) calls [Rule.rulify(options)](https://github.com/kilroy-code/rules?tab=readme-ov-file#rulify).
2. Rules aren't evaluated until something asks for the property value. When that happens, the rule keeps track of any other rules -- in any instance globally  -- that it depends on.
3. A setter is automatically defined for each rule. If the property is assigned, the setter will r

---
test suite
make it easy to define state and to use state in styles.
make it easy to use form validation and css???
should template and styles come from slots if specified in the html doc? particularly if there is a template or style child?
https://www.smashingmagazine.com/2022/01/web-frameworks-guide-part1/
https://todomvc.com

---
Reasons for this concept:
- Provides an extended set of HTML Elements that follow good design practice (e.g., Material design). These are just like the built-ins, but richer:
  - Easily used directly in Javascript, setting properties.
  - Easily used directly in HTML, setting attributes there (and even inline event handlers if you liked) 
  - This includes new elements that take other elements as children. A particularly nice example is a the list-items element that can take a template as a child.
- These richer elements can be subclassed to override or extend their behavior.
  - You can change the behavior an a provided component to do what you want.
  - You can define your own "view" components with "rules" for properties (including element.style) that will automatically update when their dependencies change.
- All of this is testable outside the browser in test frameworks. (But we then need to include a dom/querySelector package!)  
