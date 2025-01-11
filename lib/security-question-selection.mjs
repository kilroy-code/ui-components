import { MDElement } from './md-element.mjs';

export class SecurityQuestionSelection extends MDElement {
  static get formAssociated() { return true; } // Mark as form-associated
  get label() {
    return 'security question';
  }
  get index() {
    return Array.from(this.parentElement.querySelectorAll(`security-question-selection`)).indexOf(this);
  }
  get indexEffect() {
    this.shadow$(`md-select-option:nth-of-type(${this.index + 1})`).setAttribute('selected', 'selected');
    return true;
  }
  get name() {
    const name = 'q' + this.index;
    this.setAttribute('name', name);
    return name;
  }
  get template() {
    return `
      <md-outlined-select required label="${this.label}" name="${this.name}">
         <md-select-option value="0"><div slot="headline">What is your quest?</div></md-select-option>
         <md-select-option value="1"><div slot="headline">What is your favorite color?</div></md-select-option>
         <md-select-option value="2"><div slot="headline">What is the capital of Assyria?</div></md-select-option>
         <md-select-option value="3"><div slot="headline">What is the airspeed velocity of an unladen swallow?</div></md-select-option>
         <md-select-option value="4"><div slot="headline">How do you feel about these questions?</div></md-select-option>
      </md-outlined-select>
     `;
  }
  get styles() {
    return `md-outlined-select { width: 100%; }`;
  }
}
SecurityQuestionSelection.register();
