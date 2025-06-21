import { MDElement, App } from './md-element.mjs';
import { EditUser } from './edit-user.mjs';

// Present a way to pick among all users other than the ones already present. (TODO: allow other than all-other-users-menu-button)
// Given the choice, fetch the user data and give the user the chance to match the answers.
// If they match, make that user current and add to the set of live users.
// (TODO: allow app to specify additional actions (like joining an initial group).)
export class AuthorizeUser extends MDElement {
  get userRecord() {
    return App.userCollection[this.userChoiceButton.choice] || null;
  }
  get userRecordEffect() {
    this.questionElement.textContent = App.securityQuestions[this.userRecord?.q0];
    this.answerElement.style.display = this.questionElement.textContent ? 'inline-flex' : 'none';
    // See "Subtle Note" in base-collection-transform.mjs.
    this.userChoiceButton.querySelector('span').textContent =
      this.userChoiceButton.tags.includes(this.userRecord?.title) ?
      this.userRecord.title :
      'Pick one';
    return true;
  }
  get tagsEffect() {
    this.submitElement.toggleAttribute('disabled', !this.userChoiceButton.tags.length);
    return true;
  }
  get userChoiceButton() {
    return this.shadow$('all-other-users-menu-button');
  }
  get questionElement() {
    return this.shadow$('.question');
  }
  get answerElement() {
    return this.shadow$('md-outlined-text-field');
  }
  get submitElement() {
    return this.shadow$('md-filled-button');
  }
  static async adopt(tag) { // Add user tag to the local store of personas, update live records, make user tag active.

    try {
      const local = App.userCollection.liveTags;
      if (!local.includes(tag)) {
	App.userCollection.updateKnownRecord(tag, await App.userCollection.getLiveRecord(tag));
	// The following line will reset liveTags (which has various effects). Without the previous line, it will also create
	// the new userCollection[tag] rule with value null, which value will be replaced when the data arrives.
	// However, we can't await that arrival. (TODO: IWBNI we could.) So..., the previous line awaits for the data and
	// established the value for updateLiveTags (and it's effects) to use.
	App.userCollection.updateLiveTags([...local, tag]);
      }
      App.resetUrl({screen: App.defaultScreenTitle, user: tag, invitation: ''});
      return tag;
    } catch (error) {
      App.error(error);
    }
  }
  async onaction() {
    if (!this.userRecord?.q0) return App.alert("Please pick a user.");
    const tag = this.userChoiceButton.choice;
    if (this.userRecord?.a0 !== await EditUser.canonicalizedHash(this.answerElement.value)) return App.alert("Answer does not match.");
    this.userChoiceButton.choice = '';
    return await this.constructor.adopt(tag);
  }
  afterInitialize() {
    super.afterInitialize();
    this.submitElement.addEventListener('click', async event => {
      const button = event.target;
      button.toggleAttribute('disabled', true);
      await this.onaction(event);
      button.toggleAttribute('disabled', false);
    });
  }
  get template() {
    return `
      <section>
        <p>
          You can authorize
           <all-other-users-menu-button><span></span></all-other-users-menu-button>
          in this browser by answering the security question. <i>(Later it will require 2-of-3 or some such.)</i> This will add the user to you choices for "Switch user".
         </p>
         <slot></slot>
         <h2 class="question"></h2>
         <md-outlined-text-field required
               minlength="1" maxlength="60"
               label="answer"
               name="a0"
               placeholder="Case and spaces are normalized.">
         </md-outlined-text-field>
         <div>
           <md-filled-button>
             Go
             <material-icon slot="icon">login</material-icon>
           </md-filled-button>
         </div>
       </section>
    `;
  }
  get styles() {
    return `
      section { margin: var(--margin, 10px); }
      md-outlined-text-field { width: 100%; }
      p all-other-users-menu-button { vertical-align: bottom; }
      div { display: flex; }
      div > * { margin: auto; }
    `;
  }
}
AuthorizeUser.register();
