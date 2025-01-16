import { MDElement, App } from './md-element.mjs';
import { UserProfile } from './user-profile.mjs';

export class AuthorizeUser extends MDElement {
  get userRecord() {
    return App.userCollection[this.userChoiceButton.choice] || {title: 'Pick one'};
  }
  get userRecordEffect() {
    this.questionElement.textContent = App.securityQuestions[this.userRecord.q0];
    this.answerElement.style.display = this.questionElement.textContent ? 'inline-flex' : 'none';
    return this.userChoiceButton.textContent = this.userRecord.title;
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
  afterInitialize() {
    super.afterInitialize();
    let submit = this.shadow$('md-filled-button');
    submit.addEventListener('click', async () => {
      if (!this.userRecord.q0) return App.confirm("Please pick a user.");
      const tag = this.userChoiceButton.choice;
      if (this.userRecord.a0 !== await UserProfile.canonicalizedHash(this.answerElement.value)) return App.confirm("Answer does not match.");
      const local = App.userCollection.liveTags;
      App.userCollection.updateLiveTags([...local, tag]);
      App.resetUrl({screen: 'Groups', user: tag});
      return true;
    });
  }
  get template() {
    return `
      <section>
        <p>
          You can authorize
           <all-other-users-menu-button></all-other-users-menu-button>
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
