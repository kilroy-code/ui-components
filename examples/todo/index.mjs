import { RuledElement } from '@kilroy-code/ruled-components';

/*
  persistence
  draggable
  styling
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
    for (let component = this.listComponent.lastComponent; component; component = component.preceding) {
      if (component.completed) component.remove();
    }
  }
  get listComponent() { return this.$('todo-list'); }
  get anyCompletedEffect() { return this.toggleState('anyCompleted', this.listComponent.nCompleted); }
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
  get nActive() { return this.lastComponent?.nActive || 0; }
  get nActiveEffect() { return this.statusElement.textContent = this.nActive === 1 ? '1 item left' : `${this.nActive} items left`; }
  get nCompleted() { return (this.lastComponent?.index || 0) - this.nActive; }
  get showingActive() { return true; }
  get showingActiveEffect() { return this.toggleState('showingActive', this.showingActive); }
  get showingCompleted() { return true; }
  get showingCompletedEffect() { return this.toggleState('showingCompleted', this.showingCompleted); }
  addEntry(event) {
    const title = event.target.value.trim();
    if (!title) return;
    this.lastComponent = new TodoItem({title, preceding: this.lastComponent});
    this.append(this.lastComponent);
    event.target.value = '';
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
  get index() { return 1 + (this.preceding?.index || 0); }
  get nActive() { return (this.completed ? 0 : 1) + (this.preceding?.nActive || 0); }
  get title() { return ''; }
  get titleEffect() { return this.label.textContent = this.title; }
  remove() {
    let next = this.nextElementSibling;
    if (next) next.preceding = this.preceding;                // Fix the next.preceding to hop over us.
    else app.listComponent.lastComponent = this.preceding;   // We are no longer the lastComponent.
    super.remove();
  }
  get template() {
    return `
     <li>
      <input type="checkbox" onchange="hostElement(event).completed = event.target.checked"></input>
      <label contenteditable oninput="hostElement(event).title = event.target.textContent"></label>
      <button onclick="hostElement(event).remove()">X</button>
     </li>`;
  }
  get label() { return this.$('label'); }
}
TodoItem.register();
