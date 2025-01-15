import { MDElement, App } from './md-element.mjs';

export class SecurityQuestionSelection extends MDElement {
  // FIXME: The component isn't a proper formAssociated element, and the form doesn't look within the shadow DOM for
  // things that are. There is a protocol for addressing this, but I haven't done so yet.
  //
  // For now, we're going to have one md-outline-select directly whithin the profile. Ugh.
  //static get formAssociated() { return true; } // Mark as form-associated
  get label() {
    return 'security question';
  }
  get index() {
    return Array.from(this.parentElement.querySelectorAll(`security-question-selection`)).indexOf(this);
  }
  // get indexEffect() { // For when there are multiple
  //   this.securityQuestionsEffect; // Makes sure they are added before we evaluate the rest of this.
  //   this.shadow$(`md-select-option:nth-of-type(${this.index + 1})`).setAttribute('selected', 'selected');
  //   return true;
  // }
  get name() {
    const name = this.index.toString();
    this.setAttribute('name', name);
    return name;
  }
  get securityQuestions() {
    return App.securityQuestions;
  }
  get securityQuestionsEffect() {
    let select = this.shadow$('md-outlined-select'),
	innerHTML = '';
    this.securityQuestions.forEach((question, index) => {
      innerHTML += `<md-select-option value="${index}"><div slot="headline">${question}</div></md-select-option>`;
    });
    return select.innerHTML = innerHTML;
  }
  get template() {
    return `
      <md-outlined-select required label="${this.label}" name="${this.name}">
      </md-outlined-select>
     `;
  }
  // get styles() {
  //   return `md-outlined-select { width: 100%; }`;
  // }
}
SecurityQuestionSelection.register();
