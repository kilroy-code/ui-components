import { App, MDElement } from './md-element.mjs';

export class UserProfile extends MDElement {
  get template() {
    return `
       <edit-user>
        <p>You can change your user name and picture.</i></p>
        <p slot="securityInstructions">You can leave the security answer blank to leave it unchanged, or you can change the question and answer. (We cannot show you the current answer because we don't know it!)</p>
       </edit-user>`;
  }
  async onaction(form) {
    await App.userCollection.updateLiveRecord(await this.findParentComponent(form).tag);
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

    edit.picture = picture;
    answerElement.hashed = record.a0;
    edit.allowedTitle = title;
    edit.title = undefined;

    edit.tag = App.user;
    // These next two cause a warning if the screen is not actually being shown:
    // Invalid keyframe value for property transform: translateX(0px) translateY(NaNpx) scale(NaN)
    edit.usernameElement.value = title;
    edit.questionElement.selectIndex(record.q0);

    return true;
  }
  afterInitialize() {
    super.afterInitialize();
    this.editElement.answerElement.toggleAttribute('required', false);
  }
}
UserProfile.register();
