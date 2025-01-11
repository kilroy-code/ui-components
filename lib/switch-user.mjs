import { App } from './md-element.mjs';
import { ChoiceAmongLocallyStoredOptions } from './choice-among-locally-stored-options.mjs';

export class SwitchUser extends ChoiceAmongLocallyStoredOptions {
  isSwitchUser = true;
  get urlKey() {
    return 'user';
  }
  get choiceModelEffect() {
    if (!this.choiceModel) return false;
    App.avatarElement.src = App.getUserPictureURL();
    return true;
  }
}
SwitchUser.register();
