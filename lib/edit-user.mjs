import { App, MDElement } from './md-element.mjs';
import { AvatarImage } from './avatar-image.mjs';
const { FormData, FileReader, crypto, TextEncoder } = window;

// TODO: IWBNI we split up the components into mix-and-match pieces. But that should be after we work out how to make WebComponents participate in FormData when
// the WebComponent appears directly in the form (and the underlying form-associated components are in the shadow dom). Why do we care? Because some apps will want
// to make use of standard form handling (with GET or POST formactions).
export class EditUser extends MDElement {
  // Must be at a lower level than a screen, because title means different things here and there.
  static canonicalizeString(string) { // Make spaces, case, and diacriticals irrelevant. Leave punctuation.
    return App.toUpperCase(string).normalize('NFD').replace(/\s/g, '');
  }
  static canonicalizedHash(string) {
    return this.digest(this.canonicalizeString(string));
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
    return this.usernameElement.value;
  }
  get picture() {
    return '';
  }
  get tag() { // UserProfile bashes-in the known value.
    return App.createUserTag(this); // Here we generate a promise that tag will clear, so that it can be used in methods.
  }
  get exists() {
    return App.findUser({title: this.title}) || null; // Not undefined.
  }
  setUsernameValidity(message) {
    this.usernameElement.setCustomValidity(message);
    this.usernameElement.reportValidity(); // Alas, it doesn't display immediately.
    // Not sure if we want to disable the submitElement. 'change' only fires on a change or on submit, so people might not realize
    // how to get the "User already exists" dialog.
    return !message;
  }
  get allowedTitle() {
    return '';
  }
  async checkUsernameAvailable() { // Returns true if available. Forces update of username.
    this.title = undefined;
    if (this.allowedTitle === this.title) return this.setUsernameValidity('');
    if (!await this.exists) return this.setUsernameValidity('');
    await this.setUsernameValidity("Already exists");
    console.warn(`${this.usernameElement.value} already exists.`);
    return false;
  }
  async onaction(target) {
    if (!await this.parentComponent.validate()) return;
    const data = Object.fromEntries(new FormData(target)); // Must be now, before await.
    if (!await this.checkUsernameAvailable()) return null;
    data.a0 = (data.a0 ? await this.constructor.canonicalizedHash(data.a0) : this.answerElement.hashed);
    if (!data.picture.size) data.picture = this.picture;
    else data.picture = await AvatarImage.fileData(data.picture);
    // It would be nice if md-chip-set was a form control with value, so that it would appear in data, above. Oh well.
    data.cosigners = this.cosignersElement.chips.map(chip => chip.dataset.tag);
    try {
      const tag = await this.tag;
      await App.setUser(tag, data); // Set the data, whether new or not.
      await this.parentComponent.onaction?.(target);
    } catch (error) {
      App.error(error);
    }
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
      const user = this.usernameElement.value;
      if (App.userCollection.liveTags.includes(user)) {
	const response = await App.confirm(`Would you like to switch to this user?`,
					   "User is already authorized in this browser.");
	if (response === 'ok') App.resetUrl({screen: App.defaultScreenTitle, user});
      } else {
	const response = await App.confirm(`If this is you, would you like to authorize ${user} for this browser?`,
					   "User already exists");
	if (response === 'ok') App.resetUrl({screen: "Add existing account", user});
      }
    });
    this.shadow$('input[type="file"]').addEventListener('change', async event => {
      this.picture = event.target.files[0];
    });
    this.shadow$('[slot="content"]').addEventListener('submit', async event => {
      const button = event.target;
      button.toggleAttribute('disabled', true);
      await this.onaction(event.target);
      button.toggleAttribute('disabled', false);
    });
    this.shadow$('[name="pictureClear"]').addEventListener('click',  event => {
      event.stopPropagation();
      event.preventDefault();
      this.shadow$('[type="file"]').value = null;
      this.picture = '';
    });
    this.shadow$('[name="pictureDriver"]').addEventListener('click',  event => {
      event.stopPropagation();
      event.preventDefault();
      this.shadow$('[type="file"]').click();
    });
    this.addButton.disabledKey = null;
    this.addButton.addEventListener('close-menu', event => { // TODO: make this mechanism cleaner.
      let choice = event.detail.initiator.dataset.key;
      this.addSigner(choice);
      setTimeout(() => this.addButton.choice = '');
      this.addButton.toggleDisabled(choice, true);
    });
    this.shadow$('.cosigners a').addEventListener('click', event => { // TODO: generify
      App.alert("Each selected co-signer can act as this user, and transfer money to/from this user by being the cosigner and paying a positive/negative amount.", "Shared or Joint Accounts");
    });
  }
  get usernameElement() {
    return this.shadow$('[label="user name"]');
  }
  get questionElement() {
    return this.shadow$('[name="q0"]');
  }
  get answerElement() {
    return this.shadow$('[name="a0"]');
  }
  get submitElement() {
    return this.shadow$('[type="submit"]');
  }
  get addButton() {
    return this.shadow$('all-users-menu-button');
  }
  get cosignersElement() {
    return this.shadow$('md-chip-set');
  }
  addSigner(tag) { // TODO: do not hardcode size.
    const parent = this.cosignersElement;
    parent.insertAdjacentHTML('beforeend', `
<md-input-chip avatar label="${App.getUserTitle(tag)}" data-tag="${tag}">
  <avatar-image size="24" slot="icon" tag="${tag}"></avatar-image>
</md-input-chip>`);
    parent.lastChild.addEventListener('remove', event => { // IWBNI this even bubbled.
      this.addButton.toggleDisabled(event.target.dataset.tag, false);
    });
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
		  Your Image
		  <avatar-image class="avatarImage" size="80"></avatar-image>
		</div>
		<div>
		  <md-outlined-button name="pictureDriver" id="${this.formId}-pictureDriver">Use photo</md-outlined-button>
		  <md-outlined-button name="pictureClear" id="${this.formId}-pictureClearr">Clear photo</md-outlined-button>
		  <input type="file" accept=".jpg,.jpeg,.png,.webp" name="picture" id="${this.formId}-picture"></input>
		</div>
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

             <div class="cosigners">
               <a href="#">Co-signers</a>
               <md-chip-set></md-chip-set>
               <all-users-menu-button></all-users-menu-button>
             </div>
            <slot name="afterSecurity"></slot>

            </form>
	    <div slot="actions">
              <md-filled-button type="submit" form="${this.formId}" id="${this.formId}-submit"> <!-- cannot be a fab -->
                 Go
                 <material-icon slot="icon">login</material-icon>
              </md-filled-button>
	    </div>
            <slot name="extra"></slot>
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
        // justify-content: space-between;
        gap: 10px;
        margin: 10px;
      }
      .avatar, [slot="actions"] {
         flex-direction: row;
         justify-content: center;
      }
      .avatar > div { align-items: center; }
      [slot="actions"] { margin-top: 20px; }
      .cosigners {
         display: flex;
         flex-direction: row;
         gap: 10px;
         align-items: center;
       }
    `;
  }
}
EditUser.register();
