import { App } from './md-element.mjs';
import { MenuButton } from './menu-button.mjs';

export class AllUsersMenuButton extends MenuButton {
  get collection() {
    return App.userCollection;
  }
  get tags() {
    return this.collection.knownTags;
  }
  get choiceEffect() {
    return this.button.textContent = this.choice || 'Choose one';
  }
  select(tag) {
    console.log(`Selected ${tag}.`);
  }
}
AllUsersMenuButton.register();

export class AllOtherUsersMenuButton extends AllUsersMenuButton {
  get tags() {
    let live = new Set(this.collection.liveTags);
    return this.collection.knownTags.filter(tag => !live.has(tag));
  }
}
AllOtherUsersMenuButton.register();
