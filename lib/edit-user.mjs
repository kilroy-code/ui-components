import { App, MDElement } from './md-element.mjs';
import { AvatarImage } from './avatar-image.mjs';
const { FormData, FileReader, crypto, TextEncoder } = window;

// TODO: IWBNI we split up the components into mix-and-match pieces. But that should be after we work out how to make WebComponents participate in FormData when
// the WebComponent appears directly in the form (and the underlying form-associated components are in the shadow dom). Why do we care? Because some apps will want
// to make use of standard form handling (with GET or POST formactions).
export class EditUser extends MDElement {
  // Must be at a lower level than a screen, becuase title means different things here and there.
  static canonicalizedHash(string) {
    return this.digest(App.toUpperCase(string).normalize('NFD').replace(/\s/g, ''));
  }
  static async digest(message, algo = 'SHA-256') {
    return Array.from(
      new Uint8Array(
	await crypto.subtle.digest(algo, new TextEncoder().encode(message))
      ),
      (byte) => byte.toString(16).padStart(2, '0')
    ).join('');
  }
  get title() {
    return this.usernameElement.value || '';
  }
  get picture() {
    return '';
  }
  get tag() {
    return this.title; // FIXME: App.toLowerCase or guid
  }
  get existenceCheck() {
    if (!this.tag) return false;
    return App.userCollection.getRecord(this.tag);
  }
  get exists() {  // Note that rules automatically de-thenify promises.
    return this.existenceCheck;
  }
  setUsernameValidity(message) {
    this.usernameElement.setCustomValidity(message);
    this.usernameElement.reportValidity(); // Alas, it doesn't display immediately.
    // Not sure if we want to disable the submitElement. 'change' only fires on a change or on submit, so people might not realize
    // how to get the "User already exists" dialog.
    return !message;
  }
  get expectUnique() {
    return true;
  }
  async checkUsernameAvailable() { // Returns true if available. Forces update of username.
    if (!this.expectUnique) return true;
    this.title = undefined;
    if (!await this.exists) {
      this.setUsernameValidity('');
      return true;
    }
    await this.setUsernameValidity("Already exists");
    console.warn(`${this.title} already exists.`);
    return false;
  }
  async onaction(target) {
    const data = Object.fromEntries(new FormData(target)); // Must be now, before await.
    if (!await this.checkUsernameAvailable()) return null;
    data.title ||= this.title; // If we have disabled the changing of username, then it won't be included, and yet we need the value.
    data.a0 = (data.a0 ? await this.constructor.canonicalizedHash(data.a0) : this.answerElement.hashed);
    if (!data.picture.size) delete data.picture;
    else data.picture = await AvatarImage.fileData(data.picture);
    await App.setUser(this.tag, data); // Set the data, whether new or not.
    await this.parentComponent.onaction?.(target);
    return null;
  }
  afterInitialize() {
    super.afterInitialize();

    this.shadow$('.avatarImage').model = this;
    let select = this.shadow$('md-outlined-select'),
	innerHTML = '';
    App.securityQuestions.forEach((question, index) => {
      innerHTML += `<md-select-option value="${index}"><div slot="headline">${question}</div></md-select-option>`;
    });
    select.innerHTML = innerHTML;

    this.usernameElement.addEventListener('input', () => { 
      this.checkUsernameAvailable();
    });
    this.usernameElement.addEventListener('change', async () => { // When user commits name, give popup if not available.
      if (await this.checkUsernameAvailable()) return;
      const user = this.title;
      if (App.userCollection.liveTags.includes(user)) {
	const response = await App.confirm(`Would you like to switch to this user?`,
					   "User is already authorized in this browser.");
	if (response === 'ok') App.resetUrl({screen: 'Groups', user});
      } else {
	const response = await App.confirm(`If this is you, would you like to authorize ${user} for this browser?`,
					   "User already exists");
	if (response === 'ok') App.resetUrl({screen: "Add existing account", user});
      }
    });
    this.shadow$('input[type="file"]').addEventListener('change', async event => {
      this.picture = event.target.files[0];
    });
    this.shadow$('[slot="content"]').addEventListener('submit', event => this.onaction(event.currentTarget));
    this.shadow$('md-outlined-button').addEventListener('click',  event => {
      event.stopPropagation();
      event.preventDefault();
      this.shadow$('[type="file"]').click();
    });
  }
  get usernameElement() {
    return this.shadow$('[label="user name"]');
  }
  get answerElement() {
    return this.shadow$('[name="a0"]');
  }
  get submitElement() {
    return this.shadow$('[type="submit"]');
  }
  get formId() {
    return this.parentComponent.title;
  }
  get template() {
    // ids are set in a failed effort to work around https://github.com/material-components/material-web/issues/5344, which MD Web says is a chrome bug.
    // Found 3 elements with non-unique id #button
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
                   name="title"
                   id="${this.formId}-username"
                   placeholder="visible to others">
              </md-outlined-text-field>

	      <!-- <md-outlined-text-field label="description" name="description" maxlength="60"placeholder="displayed during membership voting"></md-outlined-text-field> -->

              <div class="avatar">
		<div>
		  Avatar
		  <md-outlined-button name="pictureDriver" id="${this.formId}-pictureDriver">Use photo</md-outlined-button>
		  <input type="file" capture="user" accept="image/*" name="picture" id="${this.formId}-picture"></input>
		</div>
		<avatar-image class="avatarImage" size="80"></avatar-image>
              </div>

              <slot name="securityInstructions"><p>Select a security question. <i>(Later there will be three.)</i> These are used to add your account to a new device, or to recover after wiping a device.</p></slot>
              <!-- <security-question-selection></security-question-selection> -->
             <md-outlined-select required label="Security question" name="q0" id="${this.formId}-q0">
             </md-outlined-select>
             <md-outlined-text-field required
               minlength="1" maxlength="60"
               label="answer"
               name="a0"
               id="${this.formId}-a0"
               placeholder="Used privately to recover account">
             </md-outlined-text-field>
            </form>
	    <div slot="actions">
              <md-filled-button type="submit" form="${this.formId}" id="${this.formId}-submit"> <!-- cannot be a fab -->
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
EditUser.register();
