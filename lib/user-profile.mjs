import { App, MDElement } from './md-element.mjs';

export class UserProfile extends MDElement {
  get template() {
    return `
       <edit-user>
        <p>You can change your picture. <i>(In future versions, you will also be able to change your username.)</i></p>
        <p slot="securityInstructions">You can leave the security answer blank to leave it unchanged, or you can change the question and answer. (We cannot show you the current answer because we don't know it!)
       </edit-user>`;
  }
  onaction(form) {
    App.resetUrl({screen: 'Groups'});
  }
  get userEffect() {
    const edit = this.content.firstElementChild;
    const record = App.userRecord;
    const title = record?.title || 'loading';
    const picture = record?.picture || '';
    const answerElement = edit.answerElement;
    if (!App.userRecord) return false;
    edit.expectUnique = false;
    edit.title = edit.usernameElement.value = title;
    edit.usernameElement.toggleAttribute('disabled', true);
    edit.picture = picture;
    edit.shadow$('[name="q0"]').selectIndex(App.userRecord.q0);
    answerElement.hashed = App.userRecord.a0;
    answerElement.toggleAttribute('required', false);
    return true;
  }
}
UserProfile.register();
