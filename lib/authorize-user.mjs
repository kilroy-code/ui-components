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
  get userChoiceButton() {
    return this.shadow$('all-other-users-menu-button');
  }
  get questionElement() {
    return this.shadow$('.question');
  }
  get answerElement() {
    return this.shadow$('md-outlined-text-field');
  }
  static adopt(tag) {
    const local = App.userCollection.liveTags;
    App.userCollection.updateLiveTags([...local, tag]);
    App.resetUrl({screen: 'Groups', user: tag});
    return tag;
  }
  async onaction() {
    if (!this.userRecord?.q0) return App.confirm("Please pick a user.");
    const tag = this.userChoiceButton.choice;
    if (this.userRecord?.a0 !== await EditUser.canonicalizedHash(this.answerElement.value)) return App.confirm("Answer does not match.");
    this.userChoiceButton.choice = '';
    return this.constructor.adopt(tag);
  }
  afterInitialize() {
    super.afterInitialize();
    let submit = this.shadow$('md-filled-button');
    submit.addEventListener('click', event => this.onaction(event));
  }
  get template() {
    return `
      <section>
        <p>
          You can authorize
           <all-other-users-menu-button><span></span></all-other-users-menu-button>
          in this browser by answering the security question. <i>(Later it will require 2-of-3 or some such.)</i> This will add the user to you choices for "Switch user".
         </p>
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
