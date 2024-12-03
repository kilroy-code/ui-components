import { RuledElement } from '@kilroy-code/ruled-components';

/*
  draggable
  styling
 */

export class TodoApp extends RuledElement {  // The top-level element of the app.
  get template() { // The private HTML inside this element.
    return `
      <section>
	<todo-entry></todo-entry>
	<todo-list></todo-list>
	<footer>
	  <span></span>
	  <span>
	    <label><input type="radio" name="filter" onchange="hostElement(event).changeFilter(event)" value="All"/>All</label>
	    <label><input type="radio" name="filter" onchange="hostElement(event).changeFilter(event)" value="Active"/>Active</label>
	    <label><input type="radio" name="filter" onchange="hostElement(event).changeFilter(event)" value="Completed"/>Completed</label>
	  </span>
	  <button onclick="hostElement(event).clear()">Clear completed</button>
	</footer>
     </section>`;
  }
  get styles() { // The private styling for our template.
    return `
      section { background: white; margin-bottom: 40px; box-shadow: 0 2px 4px 0 rgba(0,0,0,.2),0 25px 50px 0 rgba(0,0,0,.1); }
      todo-entry { display: block; }
      todo-item { display: none; }
      todo-list:state(showingActive) todo-item:state(active) { display: block; }
      todo-list:state(showingCompleted) todo-item:not(:state(active)) { display: block; }
      footer, footer > button { display: none; }
      :host(:state(anyItems)) footer { display: block; }
      :host(:state(anyCompleted)) footer > button { display: block; }
    `;
  }
  changeFilter(event) {
    const filter = event.target.value;
    this.listComponent.showingCompleted = (filter !== 'Active');
    this.listComponent.showingActive = (filter !== 'Completed');
    location.hash = filter; // Let URL reflect state.
  }
  clear() {
    for (let component = this.listComponent.lastComponent; component; component = component.preceding) {
      if (component.completed) component.remove();
    }
  }
  get listComponent() { return this.$('todo-list'); }
  get anyCompletedEffect() { return this.toggleState('anyCompleted', this.listComponent.nCompleted); }
  get anyItemsEffect() { return this.toggleState('anyItems', this.listComponent.nItems); }
  initialize() {
    super.initialize();
    const read = key => JSON.parse(localStorage.getItem(key)),
	  count = read('n') || 0,
	  list = this.listComponent,
	  hash = location.hash || '#All',
	  target = this.$(`input[value=${hash.slice(1)}]`); // The filter radio button.
    target.checked = true;
    this.changeFilter({target});
    for (let index = 0; index < count; index++) {
      list.addItem(read(index));
    }
  }
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  }
  delete(key) { localStorage.removeItem(key); }
}
TodoApp.register(); // Does two things: 1) Defines an HTML Element named todo-app (following rules for WebComponents). 2) Tracks dependencies on every get definition.


export class TodoEntry extends RuledElement {
  get listComponent() { return app.listComponent; }
  get template() {
    return `
      <button onclick="hostElement(event).listComponent.toggleElements()">V</button>
      <input placeholder="What needs to be done?" autofocus onchange="hostElement(event).listComponent.addEntry(event)" />`;
  }
  get styles() {
    return `
      input::placeholder { font-style: italic; }
      input { height: 65px; font: 300 24px "Helvetica Neue", Helvetica, Arial, sans-serif; width: calc(100% - 16px - 60px); padding: 16px 16px 16px 60px; border: none; }
    `;
  }
}
TodoEntry.register();


export class TodoList extends RuledElement {
  get template() { return `<ul><slot/></ul>`; }
  get styles() {
    return `
       ul { list-style: none; padding: 0; font-size: 24px; font-weight: 400; }
    `;
  }
  get listElement() { return this.$('ul'); }
  get statusElement() { return app.$('span'); }
  get lastComponent() { return null; }
  get lastComponentEffect() { return app.save('n', this.lastComponent?.count || 0); }
  get nItems() { return this.lastComponent?.count || 0; }
  get nActive() { return this.lastComponent?.nActive || 0; }
  get nActiveEffect() { return this.statusElement.textContent = this.nActive === 1 ? '1 item left' : `${this.nActive} items left`; }
  get nCompleted() { return this.nItems - this.nActive; }
  get showingActive() { return true; }
  get showingActiveEffect() { return this.toggleState('showingActive', this.showingActive); }
  get showingCompleted() { return true; }
  get showingCompletedEffect() { return this.toggleState('showingCompleted', this.showingCompleted); }
  addEntry(event) {
    const title = event.target.value.trim();
    if (!title) return;
    this.addItem({title});
    event.target.value = '';
  }
  addItem(properties) {
    this.lastComponent = new TodoItem({preceding: this.lastComponent, ...properties});
    this.append(this.lastComponent);
  }
  toggleElements() {
    const complete = !!this.nActive;
    for (let component = this.lastComponent; component; component = component.preceding) {
      component.completed = complete;
    }
  }
}
TodoList.register();


export class TodoItem extends RuledElement {
  constructor(props = {}) {
    super();
    Object.assign(this, props);
  }
  get preceding() { return null; }
  get completed() { return false; }
  get completedEffect() {
    this.$('input').checked = this.completed;
    return this.toggleState('active', !this.completed);
  }
  get count() { return 1 + (this.preceding?.count || 0); }
  get nActive() { return (this.completed ? 0 : 1) + (this.preceding?.nActive || 0); }
  get title() { return ''; }
  get titleEffect() { return this.label.textContent = this.title; }
  get storedEffect() { return app.save(this.count - 1, {title: this.title, completed: this.completed}); }
  remove() {
    let next = this.nextElementSibling;
    if (next) next.preceding = this.preceding;                // Fix the next.preceding to hop over us.
    else app.listComponent.lastComponent = this.preceding;   // We are no longer the lastComponent.
    app.delete(this.count - 1);
    super.remove();
  }
  get template() {
    return `
     <li>
      <input type="checkbox" onchange="hostElement(event).completed = event.target.checked"></input>
      <span contenteditable oninput="hostElement(event).title = event.target.textContent"></span>
      <button onclick="hostElement(event).remove()">X</button>
     </li>`;
  }
  get label() { return this.$('span'); }
}
TodoItem.register();
