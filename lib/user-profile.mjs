import { App, MDElement } from './md-element.mjs';
const { localStorage } = window;

export class UserProfile extends MDElement {
  isUserProfile = true;
  get usernameElement() {
    return this.shadow$('[label="user name"]');
  }
  get submitElement() {
    return this.shadow$('[type="submit"]');
  }
  get username() {
    return this.usernameElement.value;
  }
  get tag() {
    return this.username; // FIXME: App.toLowerCase(this.username);
  }
  get existenceCheck() {
    if (!this.tag) return false;
    return fetch(`/persist/user/${this.tag}.json`);
  }
  get exists() {
    return this.existenceCheck?.ok;
  }
  /*
  get profile() {
    return null;
  }
  get profileEffect() {
    if (!this.profile) return false;
    if (this.exists) {
      console.warn(`${this.username} already exists.`);
      return true;
    }
    const profile = Object.assign({}, this.profile, {picture: undefined}),
	  {username} = profile,
	  path = `/persist/user/${this.tag}.json`;
    fetch(path, {
      body: JSON.stringify(profile),
      method: 'POST',
      headers: {"Content-Type": "application/json"}
    });
    // const dialog = this.shadow$('dialog'),
    // 	  anyQuestionSet = this.shadow$('security-question-selection');
    // ['q0', 'q1', 'q2'].forEach(name => {
    //   const textField = dialog.querySelector('md-outlined-text-field'),
    // 	    selectedValue = this.profile[name],
    // 	    selectedQuestion = anyQuestionSet.querySelector(`md-select-options[value="${selectedValue}"]`);
    //   console.log(name, selectedValue, selectedQuestion, textField);
    //   // textField.setAttribute('label',
    // });
    return true;
  }
  */
  setUsernameValidity(message) {
    this.usernameElement.setCustomValidity(message);
    this.usernameElement.reportValidity(); // Alas, it doesn't display immediately.
    if (message) this.submitElement.setAttribute('disabled', 'disabled');
    else this.submitElement.removeAttribute('disabled');
    return !message;
  }
  async checkUsernameAvailable() { // Returns true if available.
    this.username = undefined;
    if (!await this.exists) return this.setUsernameValidity('');
    this.setUsernameValidity("Already exists");
    console.warn(`${this.username} already exists.`);
    return false;
  }
  afterInitialize() {
    super.afterInitialize();
    this.shadow$('avatar-jdenticon').model = this;
    this.usernameElement.addEventListener('input', () => {
      this.checkUsernameAvailable();
    });
    this.usernameElement.addEventListener('change', async () => {
      if (await this.checkUsernameAvailable()) return;
      const user = this.username,
	    response = await App.confirm(`If this is you, would you like to authorize ${user} for this browser?`,
					 "User already exists");
      if (response === 'ok') App.resetUrl({screen: "Add user", user});
    });
    this.shadow$('md-outlined-button').onclick = () => this.shadow$('[type="file"]').click();
    this.shadow$('form').addEventListener('submit', async event => {
      if (!await this.checkUsernameAvailable()) return null;
      const path = `/persist/user/${this.tag}.json`,
	    key = Math.random().toString(),
	    description = this.shadow$('[label="description"]').value,
	    profile = {title: this.username, description, key},
	    myUsers = App?.switchUserScreen?.choices,
	    stored = await fetch(path, {
	      body: JSON.stringify(profile),
	      method: 'POST',
	      headers: {"Content-Type": "application/json"}
	    });
      if (!stored.ok) return console.error(stored.statusText);
      //localStorage.setItem(this.tag, key);
      myUsers.push(this.tag);
      App?.switchUserScreen?.set('choices', myUsers);
      App?.resetUrl({user: this.tag});
      //this.profile = Object.fromEntries(new FormData(event.target));
      return null;
    });
  }
  get formId() {
    return this.title;
  }
  get template() {
    return `
	  <section>
	    <slot name="headline" slot="headline"></slot>
	    <form method="dialog" slot="content" id="${this.formId}">
              <slot></slot>
              <md-outlined-text-field required
                   autocapitalize="words"
                   autocomplete="username"
                   minlength="1" maxlength="60"
                   label="user name"
                   name="username"
                   placeholder="visible to others"></md-outlined-text-field>
              <div class="avatar">
		<div>
		  Avatar
		  <md-outlined-button disabled name="pictureDriver">Use photo <i>not implemented</i></md-outlined-button>
		  <input type="file" capture="user" accept="image/*" name="picture"></input>
		</div>
		<avatar-jdenticon></avatar-jdenticon>
              </div>

	      <md-outlined-text-field label="description" name="description" maxlength="60"placeholder="displayed during membership voting"></md-outlined-text-field>

              <p>Select three security questions. These are used to add your account to a new device, or to recover after wiping a device.
                 (You will be prompted for the answers separately.) <b><i>Not implemented yet</i></b></p>
             <!--
             <security-question-selection></security-question-selection>
             <security-question-selection></security-question-selection>
             <security-question-selection></security-question-selection>-->
	    </form>
	    <div slot="actions">
              <md-filled-button type="submit" form="${this.formId}"> <!-- cannot be a fab -->
                 Go
                 <material-icon slot="icon">login</material-icon>
              </md-filled-button>
	    </div>
	  </section>
     `;
  }
  get styles() {
    return `
      section { margin: 10px; }
      [type="file"] { display: none; }
      form, div {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;
        margin: 10px;
      }
      .avatar, [slot="actions"] {
         flex-direction: row;
         justify-content: center;
      }
      .avatar > div { align-items: center; }
     [slot="actions"] { margin-top: 20px; }
    `;
  }
}
UserProfile.register();
