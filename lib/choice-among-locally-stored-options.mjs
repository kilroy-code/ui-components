import { App } from './md-element.mjs';
import { ListItems } from './list-items.mjs';
const { localStorage } = window;

export class ChoiceAmongLocallyStoredOptions extends ListItems {
  get choice() {
    return  App?.getParameter(this.urlKey) || this.choices[0] || '';
  }
  get choiceElement() {
    return this.transformers.find(item => item.dataset.key === this.choice) || null;
  }
  get choiceModel() {
    return this.choiceElement?.model || null;
  }
  get choiceEffect() {
    if (App.resetUrl({[this.urlKey]: this.choice})) {
      this.choice = undefined; // Allow it to pick up new dependencies.
    }
    // Done here rather than in click handler, so that it's also true however it got set.
    this.transformers.forEach(item => item.view?.removeAttribute('active'));
    this.choiceElement?.view?.setAttribute('active', 'active');
    return true;
  }

  get localCollectionKey() { // key used for locally storing the list of keys
    return `${this.urlKey}-choices`;
  }
  get choices() { // List of alts. Initially from local storage, and can then be explicity set.
    let storedString = localStorage.getItem(this.localCollectionKey),
	choices = JSON.parse(storedString || '[]'),
	specifiedUser = App?.getParameter(this.urlKey);
    if (specifiedUser && !choices.includes(specifiedUser)) choices.push(specifiedUser);
    return choices;
  }
  get choicesEffect() {
    localStorage.setItem(this.localCollectionKey, JSON.stringify(this.choices));
    return this.setKeys(this.choices);
  }
}
ChoiceAmongLocallyStoredOptions.register();
