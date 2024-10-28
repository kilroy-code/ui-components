import { RuledElement } from '@kilroy-code/ruled-components';

/*
  toggle
  edit
  persistence
  draggable
  styling
  :host:state(anyCompleted)
 */

export class TodoApp extends RuledElement {
  get template() {
    return `
      <todo-entry></todo-entry>
      <todo-list></todo-list>
      <footer>
        <span></span>
        <ul>
          <li><button onclick="hostElement(event).changeFilter(event)">All</b></li>
          <li><button onclick="hostElement(event).changeFilter(event)">Active</b></li>
          <li><button onclick="hostElement(event).changeFilter(event)">Completed</b></li>
        </ul>
        <button onclick="hostElement(event).clear()">Clear completed</button>
      </footer>
     `;
  }
  get styles() {
    return `
      todo-item { display: none; }
      todo-list:state(showingActive) todo-item:state(active) { display: block; }
      todo-list:state(showingCompleted) todo-item:not(:state(active)) { display: block; }
      footer > button { display: none; }
      :host(:state(anyCompleted)) footer > button { display: block; }
    `;
  }
  changeFilter(event) {
    const filter = event.target.textContent;
    this.listComponent.showingCompleted = (filter !== 'Active');
    this.listComponent.showingActive = (filter !== 'Completed');
  }
  clear() {
    let component = this.listComponent.lastComponent;
    while (component) {
      if (component.completed) component.remove();
      component = component.previous;
    }
  }
  get listComponent() { return this.$('todo-list'); }
  get anyCompletedEffect() { return this.toggleState('anyCompleted', (this.listComponent.lastComponent?.index || 0) - this.listComponent.nRemaining); }
}
TodoApp.register();


export class TodoEntry extends RuledElement {
  get listComponent() { return app.listComponent; }
  get template() {
    return `
      <button onclick="hostElement(event).listComponent.toggleElements()">V</button>
      <input placeholder="What needs to be done?" autofocus onchange="hostElement(event).listComponent.addEntry(event)" />`;
  }
}
TodoEntry.register();


export class TodoList extends RuledElement {
  get template() { return `<ul><slot/></ul>`; }
  get listElement() { return this.$('ul'); }
  get statusElement() { return app.$('span'); }
  get lastComponent() { return null; }
  get nRemaining() { return this.lastComponent?.remaining || 0; }
  get nRemainingEffect() { return this.statusElement.textContent = this.nRemaining === 1 ? '1 item left' : `${this.nRemaining} items left`; }
  get showingActive() { return true; }
  get showingActiveEffect() { return this.toggleState('showingActive', this.showingActive); }
  get showingCompleted() { return true; }
  get showingCompletedEffect() { return this.toggleState('showingCompleted', this.showingCompleted); }
  addEntry(event) {
    const title = event.target.value.trim();
    if (!title) return;
    this.lastComponent = new TodoItem({title, previous: this.lastComponent});
    this.append(this.lastComponent);
    event.target.value = '';
  }
  toggleElements() {
    // All(showActive, showComplete) => true
    // Active(showActive, !showComplete) => true
    // Completed(!showActive, showComplete) => false

    // Competed anyCompleted => false
    // Completed !anyCompleted => true
    // Active anyCompleted => false
    // Active !anyCompleted => true
    // All anyCompleted => false
    // All !anyCompleted => treu
    
    const complete = this.showingActive;
    console.log({complete});
    let component = this.lastComponent;
    while (component) {
      component.completed = complete;
      component = component.previous;
    }
  }
}
TodoList.register();


export class TodoItem extends RuledElement {
  constructor(props = {}) {
    super();
    Object.assign(this, props);
  }
  get previous() { return null; }
  get completed() { return false; }
  get completedEffect() {
    this.$('input').checked = this.completed;
    return this.toggleState('active', !this.completed);
  }
  get index() { return 1 + (this.previous?.index || 0); }
  get remaining() { return (this.completed ? 0 : 1) + (this.previous?.remaining || 0); }
  get title() { return ''; }
  get titleEffect() { return this.label.textContent = this.title; }
  remove() {
    let next = this.nextElementSibling;
    if (next) next.previous = this.previous;                // Fix the next.previous to hop over us.
    else app.listComponent.lastComponent = this.previous;   // We are no longer the lastComponent.
    super.remove();
  }
  get template() {
    return `
     <li>
      <input type="checkbox" onchange="hostElement(event).completed = event.target.checked"></input>
      <label></label>
      <button onclick="hostElement(event).remove()">X</button>
     </li>`;
  }
  get label() { return this.$('label'); }
}
TodoItem.register();
