import { RuledElement } from '@kilroy-code/ruled-components';

export class TodoEntry extends RuledElement {
  get template() { return `<input placeholder="What needs to be done?" autofocus onchange="hostElement(event).addEntry(event)" />`; }
  get list() { return this.parentNode.querySelector('todo-list'); } // fixme
  addEntry(event) {
    this.list.append(new TodoItem({title: event.target.value}));
    event.target.value = '';
  }
}
TodoEntry.register();

export class TodoList extends RuledElement {
  get template() { return `<ul><slot/></ul>`; }
}
TodoList.register();

export class TodoItem extends RuledElement {
  constructor(props = {}) {
    super();
    Object.assign(this, props);
  }
  get title() { return ''; }
  get titleEffect() {
    this.label.textContent = this.title;
    return true;
  }
  get template() {
    return `
     <li>
      <input type="checkbox"></input>
      <label></label>
      <button onclick="hostElement(event).remove()">X</button>
     </li>`;
  }
  get label() { return this.$('label'); }
}
TodoItem.register();

export class TodoApp extends RuledElement {
  get template() {
    return `
      <todo-entry></todo-entry>
      <todo-list id="items"></todo-list>
     `;
  }
}
TodoApp.register();
