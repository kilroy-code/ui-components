import { App, MDElement } from './md-element.mjs';
const { localStorage, FormData, FileReader, crypto, TextEncoder } = window;

async function digest(message, algo = 'SHA-256') {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest(algo, new TextEncoder().encode(message))
    ),
    (byte) => byte.toString(16).padStart(2, '0')
  ).join('');
}
function fileData(fileObject) {
  const reader = new FileReader();
  const promise = new Promise(resolve => reader.onload = event => resolve(event.target.result));
  reader.readAsDataURL(fileObject);
  return promise;
}

export class UserProfile extends MDElement {
  static canonicalizedHash(string) {
    return digest(App.toUpperCase(string).normalize('NFD').replace(/\s/g, ''));
  }
  isUserProfile = true;
  get usernameElement() {
    return this.shadow$('[label="user name"]');
  }
  get submitElement() {
    return this.shadow$('[type="submit"]');
  }
  get username() {
    return this.usernameElement.value || '';
  }
  get tag() {
    return this.username; // FIXME: App.toLowerCase(this.username);
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
    // Not sure if we want to do this. 'change' only fires on a change or on submit, so people might not realize
    // how to get the "User already exists" dialog.
    //if (message) this.submitElement.setAttribute('disabled', 'disabled');
    //else this.submitElement.removeAttribute('disabled');
    return !message;
  }
  async checkUsernameAvailable() { // Returns true if available.
    this.username = undefined;
    if (!await this.exists) {
      this.setUsernameValidity('');
      return true;
    }
    this.setUsernameValidity("Already exists");
    console.warn(`${this.username} already exists.`);
    return false;
  }
  afterInitialize() {
    super.afterInitialize();

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

    this.shadow$('avatar-jdenticon').model = this;
    /*
    this.shadow$('md-outlined-button').addEventListener('click',  event => {
      event.stopPropagation();
      this.shadow$('[type="file"]').click();
    });
    */
    let select = this.shadow$('md-outlined-select'),
	innerHTML = '';
    App.securityQuestions.forEach((question, index) => {
      innerHTML += `<md-select-option value="${index}"><div slot="headline">${question}</div></md-select-option>`;
    });
    select.innerHTML = innerHTML;


    const formElement = this.shadow$('[slot="content"]');
    formElement.addEventListener('submit', async event => {
      console.log('submit', event.target, formElement);
      if (!await this.checkUsernameAvailable()) return null;
      const data = Object.fromEntries(new FormData(formElement));
      data.a0 = await this.constructor.canonicalizedHash(data.a0);
      if (!data.picture.size) delete data.picture;
      else data.picture = await fileData(data.picture);
      console.log(data);
      App.setUser(data.title, data);
      //App?.resetUrl({user: this.tag});
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
                   name="title"
                   placeholder="visible to others">
              </md-outlined-text-field>
              <div class="avatar">
		<div>
		  Avatar
		  <!-- <md-outlined-button name="pictureDriver" id="${this.formId}PictureDriver">Use photo</md-outlined-button>-->
		  <input type="file" capture="user" accept="image/*" name="picture" id="${this.formId}Picture"></input>
		</div>
		<avatar-jdenticon size="80"></avatar-jdenticon>
              </div>

	      <!-- <md-outlined-text-field label="description" name="description" maxlength="60"placeholder="displayed during membership voting"></md-outlined-text-field> -->

              <p>Select a security question. <i>(Later there will be three.)</i> These are used to add your account to a new device, or to recover after wiping a device.</p>
              <!-- <security-question-selection></security-question-selection> -->
             <md-outlined-select required label="Security question" name="q0">
             </md-outlined-select>
             <md-outlined-text-field required
               minlength="1" maxlength="60"
               label="answer"
               name="a0"
               placeholder="Used privately to recover account">
             </md-outlined-text-field>
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
      section { margin: var(--margin, 10px); }
      /*[type="file"] { display: none; }*/
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
