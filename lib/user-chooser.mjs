import { App } from './md-element.mjs';
import { ChooserButton } from './chooser-button.mjs';

export class UserChooser extends ChooserButton {
  get choice() {
    return App?.url.searchParams.get('user');
  }
  afterInitialize() {
    super.afterInitialize();
    fetch(`/persist/user/list.json`)
      .then(response => response.json())
      .then(json => this.setKeys(json)); // FIXME: when can/should this be re-run?
  }
}
UserChooser.register();
