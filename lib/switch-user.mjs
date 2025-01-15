import { App } from './md-element.mjs';
import { LiveList} from './live-list.mjs';

export class SwitchUser extends LiveList {
  get collection() {
    return App.userCollection;
  }
  get active() {
    return App.user;
  }
  select(tag) {
    App.resetUrl({user: tag});
  }  
}
SwitchUser.register();
