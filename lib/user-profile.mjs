import { App, MDElement } from './md-element.mjs';

export class UserProfile extends MDElement {
  get template() {
    return `
       <edit-user>
        <p>You can change your picture. <i>(In future versions, you will also be able to change your username.)</i></p>
        <p slot="securityInstructions">You can leave the security answer blank to leave it unchanged, or you can change the question and answer. (We cannot show you the current answer because we don't know it!)
       </edit-user>`;
  }
  async onaction(form) {
    await App.userCollection.updateLiveRecord(this.findParentComponent(form).tag);
    App.resetUrl({screen: App.defaultScreenTitle});
  }
  get editElement() {
    return this.content.firstElementChild;
  }
  get userEffect() { // Update edit-user with our data.
    const edit = this.editElement;
    const record = App.userRecord;
    const title = record?.title || 'loading';
    const picture = record?.picture || '';
    const answerElement = edit.answerElement;
    if (!App.userRecord) return false;

    edit.usernameElement.toggleAttribute('disabled', true);
    edit.picture = picture;
    answerElement.hashed = App.userRecord.a0;

    edit.title = title;
    // These next two cause a warning if the screen is not actually being shown:
    // Invalid keyframe value for property transform: translateX(0px) translateY(NaNpx) scale(NaN)
    edit.usernameElement.value = title;
    edit.shadow$('[name="q0"]').selectIndex(App.userRecord.q0);

    return true;
  }
  afterInitialize() {
    super.afterInitialize();
    this.editElement.expectUnique = false;
    this.editElement.answerElement.toggleAttribute('required', false);
  }
}
UserProfile.register();
