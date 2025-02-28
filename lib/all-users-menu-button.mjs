import { App } from './md-element.mjs';
import { MenuButton } from './menu-button.mjs';

export class AllUsersMenuButton extends MenuButton {
  get includeNewUser() {
    return false;
  }
  get collection() {
    return App.userCollection;
  }
  get tags() {
    let tags = this.collection.knownTags;
    if (this.includeNewUser === false) return tags; // Specifying attribute include-new-user will result in empty string.
    return ['0', ...tags];
  }
  get choiceEffect() {
    return this.button.textContent = this.collection[this.choice]?.title || 'Choose one';
  }
  get disabledKey() {
    return this.choice;
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
