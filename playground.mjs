import { RuledElement } from '@kilroy-code/ruled-components';

// Compare https://lit.dev/playground/#sample=examples/hello-world
export class SimpleGreeting extends RuledElement {
  get name() { return `Somebody`; }
  get styles() { return `p { color: blue }`; }
  get template() { return `<p>Hello, ${this.name}!</p>`; }
}
SimpleGreeting.register();

// As shown in https://lit.dev/playground/#sample=examples/properties-basic
const tag = document.createElement('simple-greeting');
tag.name = 'dynamically created';
document.body.appendChild(tag);

// Compare https://lit.dev/playground/#sample=examples/full-component
export class MyElement extends RuledElement {
  get greeting() { return 'Hello'; }
  get planet() { return 'World'; }
  get styles() {
    return `
    :host {
      display: inline-block;
      padding: 10px;
      background: lightgray;
    }
    .planet {
      color: var(--planet-color, blue);
    }
  `;
  }
  get template() {
    return `
      <span onclick="hostElement(event).togglePlanet()"
        >${this.greeting}
        <span class="planet">${this.planet}</span>
      </span>
    `;
  }
  togglePlanet() {
    this.planet = this.planet === 'World' ? 'Mars' : 'World';
  }
}
MyElement.register();

// Compare https://lit.dev/playground/#sample=examples/properties-has-changed
export class DateDisplay extends RuledElement {
  get date() { return null; }
  frames = [
    {backgroundColor: '#fff'},
    {backgroundColor: '#324fff'},
    {backgroundColor: '#fff'},
  ];
  get date$() { // By default, update will compute any rule named '*$*' or '*Effect*'
    const span = this.$('span'); // Note that we surgically change one thing, rather than recomputing the whole dom subtree.
    span.textContent = this.date?.toLocaleDateString() || '';
    span.animate(this.frames, 1000); // Make it obvious that the rule fired.
    return true;
  }
  get template() {
    return `<span></span>`;
  }
}
DateDisplay.register(/*{eagerNames: ['update']}*/);
window.DateDisplay = DateDisplay;

export class DatePicker extends RuledElement {
  maybeSetDate(newDate) {
    let dateDisplay = this.$('date-display'),
	oldDate = dateDisplay.date;
    if (newDate?.toLocaleDateString() === oldDate?.toLocaleDateString()) return;
    dateDisplay.date = newDate;
  }
  chooseToday() { this.maybeSetDate(new Date()); }
  dateChanged(event) {
    const utcDate = event.target.valueAsDate;
    if (utcDate) {
      this.maybeSetDate(new Date(
	utcDate.getUTCFullYear(),
	utcDate.getUTCMonth(),
	utcDate.getUTCDate()
      ));
    }
  }
  get template() {
    return `
      <p>Choose a date:
      <input type="date" onchange="hostElement(event).dateChanged(event)"></p>
      <p><button onclick="hostElement(event).chooseToday()">Choose Today</button></p>
      <p>Date chosen: <date-display></date-display></p>
    `;
  }
}
DatePicker.register();

// Compare https://lit.dev/playground/#sample=examples/properties-custom-converter
export class DateElement extends RuledElement {
  setPropertiesFromAttributes() { // Override the inherite method to conditionally parse the date string to a Date object.
    if (this.hasAttribute('date')) this.date = new Date(this.getAttribute('date'));
  }
  get date() { return ''; } // Empty string is falsey. Rules cannot return undefined.
  get template() {
    return this.date
      ? `<p>Date is
           <span>${this.date.toLocaleDateString()}</span>
         </p>`
      : 'No date set';
  }
}
DateElement.register();
