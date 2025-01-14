import { FixmeMenuButton } from './menu-button.mjs';

export class ChooserButton extends FixmeMenuButton {
  // Usage: call this.setKeys(list-of-users);
  get button() {
    return null;
  }
  get choice() {
    return "";
  }
  get choiceEffect() {
    if (!this.button) return null;
    return this.button.textContent = this.choice;
  }
  afterInitialize() {
    const button = document.createElement('md-outlined-button');
    this.button = button;
    this.append(button);
    this.addEventListener('close-menu', event => {
      event.stopPropagation();
      this.choice = event.detail.initiator.dataset.key;
    });
    super.afterInitialize();
  }
  get styles() {
    return `:host { vertical-align: bottom; position: relative; }`;
  }
}
ChooserButton.register();
