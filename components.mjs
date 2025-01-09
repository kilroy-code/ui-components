import { RuledElement } from './base.mjs';
import { Rule } from '@kilroy-code/rules';
import '@material/web/all.js';

const {customElements, CustomEvent, URL, localStorage, getComputedStyle} = window; // Defined by browser.

export let App;

export class MDElement extends RuledElement {
  get title() {
    return this.toCapitalCase(this.tagName.split('-').slice(1).join(' '));
  }
}
MDElement.register();

export class MaterialIcon extends MDElement {
  get template() {
    return `
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <md-icon class="material-icons"><slot></slot></md-icon>
    `;
  }
}
MaterialIcon.register();

export class AppQrcode extends MDElement {
  get data() { return (this.getRootNode().host.url || App?.url).href; }
  get picture() { return this.getRootNode().host.picture || ''; }
  get size() { return 300; }
  get color() { return getComputedStyle(this).getPropertyValue("--md-sys-color-on-secondary-container"); }
  get background() { return getComputedStyle(this).getPropertyValue("--md-sys-color-secondary-container"); }
  get dotsOptions() {
    return {
      color: this.color,
      type: "rounded"
    };
  }
  get backgroundOptions() {
    return {
      color: this.background
    };
  }
  get imageOptions() {
    return {
      imageSize: 0.3,
      margin: 6
    };
  }
  get options() {
    return {
      width: this.size,
      height: this.size,
      type: 'svg',
      data: this.data,
      image: this.picture,
      dotsOptions: this.dotsOptions,
      backgroundOptions: this.backgroundOptions,
      imageOptions: this.imageOptions
    };
  }
  get qrcodeModule() {
    return App.ensureScript({
      src: 'https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js',
      async: 'async'
    });
  }
  get generator() {
    return this.qrcodeModule.loaded ? new window.QRCodeStyling(this.options) : null;
  }
  get effect() {
    const container = this.content.firstElementChild;
    container.innerHTML = '';
    this.generator?.append(container); // Note that this is backwards to what you might think.
    return true;
  }
  get template() {
    return `<div></div>`;
  }
}
AppQrcode.register();

export class AvatarJdenticon extends MDElement {
  // Clients can assign username or model.
  get model() { return null; }
  get username() { return this.model?.username || ''; }
  get size() { return 80; }
  get usernameEffect() {
    return this.jdenticonModule?.updateSvg(this.jdenticonElement, this.username) || false;
  }
  get jdenticonElement() {
    return this.shadow$('svg');
  }
  get jdenticonModule() {
    const script = App.ensureScript({
      src: 'https://cdn.jsdelivr.net/npm/jdenticon@3.3.0/dist/jdenticon.min.js',
      async: 'async',
      integrity: 'sha384-LfouGM03m83ArVtne1JPk926e3SGD0Tz8XHtW2OKGsgeBU/UfR0Fa8eX+UlwSSAZ',
      crossorigin: 'anonymous'
    });
    if (!script.loaded) return null;
    return window.jdenticon;
  }
  get template() {
    return `<svg width="${this.size}" height="${this.size}"></svg>`;
  }
}
AvatarJdenticon.register();

export class AppShare extends MDElement {
  get url() {
    return App?.url;
  }
  get picture() {
    return '';
  }
  afterInitialize() {
    this.shadow$('md-filled-button').onclick = () => navigator.share({url: this.url, title: App.title});
  }
  get template() {
    return `
       <section>
          <slot name="qr"></slot>
          <app-qrcode></app-qrcode>

          <slot name="social"></slot>
          <div>
            <md-filled-button>
              <material-icon slot="icon">share</material-icon>
              share
            </md-filled-button>
          </div>
       </section>
    `;
  }
  get styles() {
    return `
      app-qrcode, div:has(md-filled-button) {
        margin-left: auto;
        margin-right: auto;
        display: block;
        width: fit-content;
      }
      section {margin: 10px; }
    `;
  }
}
AppShare.register();

export class ViewTransform extends MDElement { // TODO: Unify this with AttachedView
  // A component that doesn't display anything - it creates and populates a view rule from a model,
  // and keeps the view consistent with the model.
  get model() {
    return null;
  }
  get content() { // Instead of a shadow dom tree, just answer a template element
    return this.fromHTML('template', this.template);
  }
  get view() {
    return this.content.content.firstElementChild; // First content is rule to get template, second gets dock fragment. No need to clone.
  }
}
ViewTransform.register();

export class ListTransform extends MDElement {
  get itemParent() {
    return this.content.firstElementChild;
  }
  get models() { // Alternatively to supplying getModel and calling setModel, one can set the models
    return [];
  }
  get modelsEffect() {
    if (!this.models.length) return false;
    let keys = this.models.map(model => model.title);
    this.setKeys(keys);
    return true;
  }
  getModel(key) {
    return this.models.find(model => model.dataset.key === key) || {title: key};
  }
  get viewTag() {
    console.warn(`Please specifify a viewTag for ${this.title}.`);
    return '';
  }
  getViewTagChildren() { // Fresh list each time.
    return Array.from(this.children).filter(child => child.dataset.hasOwnProperty('key'));
  }
  findFrom(key, items, start) {
    for (let i = start; i < items.length; i++) {
      if (items[i].dataset.key === key) return items[i];
    }
    return null;
  }
  createNewItem(key) {
    const insert = document.createElement(this.viewTag);
    insert.setAttribute('slot', 'transformer');
    insert.model = this.getModel(key);
    insert.dataset.key = insert.view.dataset.key = key;
    console.log('create', insert, insert.view);
    return insert;
  }
  setKeys(keys) { // Adds or removes viewTag elements to maintain ordered correspondence with keys.
    const items = this.children; // A live collection that changes as elements are added/removed.
    let keyIndex = 0; // Outside the loop. We may get to the end of items and still have keys to add.
    console.log(this.tagName, 'setKeys', keys);
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const item = items[itemIndex],
	    itemKey = item.dataset.key;
      console.log({itemIndex, keyIndex, item, itemKey});
      if (!itemKey) continue; // Don't touch.

      // Remove if not in keys.
      if (!keys.includes(itemKey)) {
	item.remove();
	item.view.remove();
	itemIndex--;
	continue;
      }
      const key = keys[keyIndex];

      // Leave it if it matches at this position.
      if (itemKey === key) {
	keyIndex++;
	continue;
      }

      // If key is found later in children, move it to here.
      let later = this.findFrom(key, items, itemIndex + 1);
      if (later) {
	item.before(later);
	item.view.before(later.view);
	keyIndex++;
	continue;
      }

      // Insert new item.
      const insert = this.createNewItem(key);
      item.before(insert);
      item.view.before(insert.view);
      keyIndex++;
    }
    // Now add any remaining keys at end.
    while (keyIndex < keys.length) {
      const key = keys[keyIndex],
	    insert = this.createNewItem(key);
      console.log({keyIndex, key, insert});
      keyIndex++;
      this.append(insert);
      this.itemParent.append(insert.view);
    }
    return keys;
  }
}
ListTransform.register();


export class ListDivider extends MDElement {
  get copyContent() {
    return this.content.innerHTML;
  }
  get template() {
    return `<md-divider role="separator" tabindex="-1"></md-divider>`;
  }
  get title() {
    return `divider-${Array.from(this.parentElement.children).indexOf(this)}`;
  }
}
ListDivider.register();

export class ListItem extends ViewTransform {
  get template() {
    return `<md-list-item></md-list-item>`;
  }
  get titleEffect() {
    return this.view.textContent = this.view.dataset.key = this.model?.title;
  }
}
ListItem.register();

export class ListItems extends ListTransform {
  // A list of items built from keys:
  // setKeys(array-of-keys) builds and maintains a set of ListItem children, where each child's model is getModel(key).
  // Our shadowTree is an md-list, with each child being a view of each ListItem.
  get template() {
    return `<md-list></md-list><slot></slot>`;
  }
  get viewTag() {
    return 'list-item';
  }
}
ListItems.register();


export class MenuItem extends ViewTransform {
  get template() {
    return this.model?.copyContent || `<md-menu-item><div slot="headline"></div></md-menu-item>`;
  }
  get titleEffect() { // If model.title changes, update ourself in place (wherever we may appear).
    const headline = this.view.querySelector('[slot="headline"]'),
	  title = this.model?.title || '';
    if (title === 'H') console.log({title, headline});
    this.view.dataset.key = title;
    if (!headline) return title;
    return headline.textContent = title;
  }
}
MenuItem.register();

export class MenuButton extends ListTransform {
  get slot() {
    const slot = this.shadow$('slot');
    slot.onslotchange = () => this.anchor = undefined;
    return slot;
  }
  get anchor() { // Can be overridden or assigned.
    return this.slot.assignedElements()[0];
  }
  get menu() {
    return this.itemParent;
  }
  get viewTag() {
    return 'menu-item';
  }
  get hasOverflow() {
    return false;
  }
  get template() {
    return `
      <md-menu${this.hasOverflow === '' ? ' has-overflow' : ''}></md-menu>
      <slot></slot>
      `;
  }
  afterInitialize() {
    super.afterInitialize();
    this.menu.anchorElement = this.anchor;
    this.anchor.addEventListener('click', () => this.menu.open = !this.menu.open);
  }
}
MenuButton.register();

export class TabItem extends ViewTransform {
  get template() {
    return `<md-primary-tab part="tab"></md-primary-tab>`;
  }
  get titleEffect() {
    const primary = this.view;
    // if (this.view.active) location.hash = this.model.title; // Not of much use without persistence.
      return primary.textContent = primary.dataset.key = this.model?.title || '';
  }
}
TabItem.register();

export class MenuTabs extends ListTransform {
  get viewTag() {
    return 'tab-item';
  }
  get template() {
    return `<md-tabs part="tabs"></md-tabs>`;
  }
  get tabs() {
    return this.shadow$('md-tabs');
  }
  activateKey(key) {
    let index = 0, models = this.models;
    for (const tab of this.tabs.tabs) {
      // It is possible to call this before the md-primary-tab[data-key] is set by TabItem.titleEffect.
      // So we get the dataset.key from the corresponding model.
      // Alternatively, we could go next tick, but that would be awkward to debug.
      tab.active = key === models[index++].dataset.key;
    }
  }
  afterInitialize() {
    super.afterInitialize();
    this.tabs.addEventListener('change', event => {
      this.dispatchEvent(new CustomEvent('close-menu', {detail: {initiator: event.target.activeTab}, bubbles: true, composed: true}));
    });
  }
  get visibleModels() {
    return this.models;
  }
  get modelsEffect() {
    super.__modelsEffect();
    // We don't have tabs children yet (wait for next tick, but collect the required values now in this dynamic extent.
    const {models, visibleModels, tabs} = this;
    setTimeout(() => {
      let index = 0;
      for (const tab of tabs.tabs) {
	const model = models[index++],
	      isVisible = visibleModels.includes(model);
	tab.style.display = isVisible ? '' : 'none';
      }
    });
    return true;
  }
}
MenuTabs.register();

export class BasicApp extends MDElement {
  constructor() {
    super();
    App = window.App = this;
  }
  get htmlElement() {
    return this.doc$('html');
  }
  get headElement() {
    return this.doc$('html > head');
  }
  get langEffect() { // If html[lang] is not set, set it from this.lang rule, and return whatever value is used.
    // Note: does not change html[lang] once set, even if code assigns this.lang.
    const key = 'lang';
    if (this.htmlElement.hasAttribute(key)) return this.htmlElement.getAttribute(key);
    this.htmlElement.setAttribute(key, this.lang);
    return this.lang;
  }
  get title() { // Priority is overriding rule, the element's attribute, the head title content, or hostname.
    return this.doc$('html > head > title')?.textContent || location.hostname;
  }
  get titleEffect() { // Ensure there is a head title element.
    // Note: does not change html>head>title once it exists, even if code assigns this.title.
    return this.headElement.querySelector('title') || this.maybeAppend('title', this.headElement);
  }
  get viewportEffect() { // Ensure there is a mobile-ready head vieport element.
    let viewport = this.doc$('html > head > meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      viewport.setAttribute('content', 'initial-scale=1, width=device-width');
      this.headElement.append(viewport);
    }
    return viewport;
  }
  get screens() {
    return Array.from(this.children);
  }
  get screensEffect() {
    this.screens.forEach(screen => screen.dataset.key = screen.title);
    return true;
  }
  findScreen(indicator) {
    return this.screens.find(screen => screen[indicator]);
  }
  get switchUserScreen() {
    return this.findScreen('isSwitchUser');
  }
  get addUserScreen() {
    return this.findScreen('isAddUser');
  }
  get createUserScreen() {
    return this.findScreen('isCreateUser');
  }
  get firstUseScreen() {
    return this.findScreen('isFirstUse');
  }
  get url() { // location.href, as a URL. Instead of assigning this, call resetUrl.
    return new URL(location.href);
  }
  urlWith(parameters) { // Answer a copy of url with parameters set appropriately. (E.g. screen => hash, and everything else in query params.)
    const url = new URL(this.url.href);
    for (const key in parameters) {
      const value = parameters[key];
      if (key === 'screen') url.hash = value;
      else url.searchParams.set(key, value);
    }
    return url;
  }
  resetUrl(parameters, updateHistory = true) { // After updating url as by urlWith(), this:
    // 1. resets url if there are any changes, so that anthing dependent on it can be recomputed.
    // 2. optionally adds to history if updateHistory and there are any changes.
    // Answers true if there is a change.
    const previous = this.url.href, // Before this change.
	  next = this.urlWith(parameters);
    //console.log('resetUrl from:', previous, 'to:', next.href, parameters);
    if (previous === next.href) return false;
    this.url = new URL(next);
    if (!updateHistory) return true;
    const params = Object.fromEntries(next.searchParams.entries());
    params.screen = next.hash.slice(1);
    //console.log('pushState', params);
    history.pushState(params, this.title, next.href);
    return true;
  }
  get screen() { // The currently displayed screen.
    return decodeURIComponent(this.url.hash.slice(1));
  }
  get screenEffect() { // Recononicalize url and screen.
    this.resetUrl({screen: this.screen});
    this.screen = undefined; // Allow it to be recomputed.
    this.shadow$('.screen-label').textContent = this.screen;
    this.shadow$('menu-tabs').activateKey(this.screen);
    // In this implementation, we make only the active screen visible.
    // Alternatives might, e.g., scroll down or across.
    this.screens.forEach(screen => screen.style.display = (screen.title === this.screen) ? '' : 'none');
    return true;
  }
  ensureScript(urlOrAttributes) { // Returns the specified script element, creating it if necessary.
    // Argument can be the url, or a dictionary of attributeName => value.
    // The returned script element will have a rule attached called 'loaded', that will reflect the actual loaded state.
    const attributes = urlOrAttributes.src ? urlOrAttributes : {src: urlOrAttributes};
    let script = this.headElement.querySelector(`[src="${attributes.src}"]`);
    if (script) return script;
    script = document.createElement('script');
    for (let name in attributes) script.setAttribute(name, attributes[name]);
    Rule.attach(script, 'loaded', () => false);
    script.onload = () => script.loaded = true;
    this.headElement.append(script);
    return script;
  }
  onhashchange() { // Set current screen to that defined by the hash.
    //console.log('onhashchange', location.hash);
    this.resetUrl({screen: location.hash.slice(1)}, false);
  }
  onpopstate(event) {
    //console.log('onpopstate', location.href, event.state);
    if (event.state) this.resetUrl(event.state, false);
  }
  afterInitialize() {
    super.afterInitialize();
    window.addEventListener('hashchange', event => this.onhashchange(event));
    window.addEventListener('popstate', event => this.onpopstate(event));
    const userMenuItems = this.shadow$('slot[name="user-menu"]').assignedElements();
    this.shadow$('#user').models = userMenuItems;
    this.shadow$('#navigation').models = this.screens.filter(s => !userMenuItems.includes(s));
    const tabs = this.shadow$('menu-tabs');
    tabs.models = this.screens;
    tabs.visibleModels = this.shadow$('slot:not([name]').assignedElements().filter(e => !(e instanceof ListDivider));

    const screenKeys = this.screens.map(s => s.dataset.key);
    this.addEventListener('close-menu', event => {
      const key = event.detail.initiator.dataset.key,
	    isScreen = screenKeys.includes(key);
      if (key === 'Firstuse') this.firstUseScreen?.set('seen', !this.firstUseScreen?.seen);
      if (isScreen) this.resetUrl({screen: key});
      // Unfortunately, I have not figured out how to intercept this at the submenu, so we need to trampoline.
      else this.switchUserScreen?.set('user', key);
    });

    // Initial state.
    if (location.hash) return setTimeout(() => this.onhashchange()); // Next tick, after things instantiate.
    const title = (this.firstUseScreen?.seen ? this.screens[0] : this.firstUseScreen).title;
    this.resetUrl({screen: title});
    return true;
  }
  confirm(message, headline = '') {
    const dialog = this.shadow$('md-dialog:has(#confirm)');
    dialog.querySelector('[slot="headline"]').textContent = headline;
    dialog.querySelector('form').textContent = message; // Accept cleansed html here?
    const resolution = new Promise(resolve => dialog.onclose = () => resolve(dialog.returnValue));
    dialog.show();
    return resolution;
  }
  get template() {
    return `
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link href="style.css" rel="stylesheet">
  <header>
    <menu-button id="navigation">
      <md-icon-button><md-icon class="material-icons">menu</md-icon></md-icon-button>
    </menu-button>
    <span>${this.title}<span class="screen-label"></span></span>
    <menu-tabs></menu-tabs>
    <menu-button id="user" has-overflow>
      <md-icon-button>
         <material-icon>account_circle</material-icon>
      </md-icon-button>
    </menu-button>
  </header>
  <main>
    <slot name="first-use"><i>Add content to appear on first use.</i></slot>
    <slot name="user-menu"><i>Add content to appear in user menu.</i></slot>
    <slot><i>Add contentto appear as tabs.</i></slot>
  </main>
  <md-dialog>
    <div slot="headline"></div>
    <form slot="content" id="confirm" method="dialog"></form>
    <div slot="actions">
      <md-text-button form="confirm" value="ok" type="submit">Ok</md-text-button>      
      <md-text-button form="confirm" value="cancel" type="submit">Cancel</md-text-button>
    </div>
  </md-dialog>
`;
  }
  get styles() {
    return `
  header {
    background-color: var(--md-sys-color-primary-container);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
  header > menu-tabs {
    --md-primary-tab-container-color: var(--md-sys-color-primary-container);
    --md-primary-tab-active-indicator-color: var(--md-sys-color-on-primary-container);
    --md-primary-tab-icon-color: var(--md-sys-color-on-primary-container);
  }
  header, header md-icon, header material-icon, header menu-tabs::part(tab) {
    color: var(--md-sys-color-on-primary-container);
  }
  .screen-label::before { content: ": "; }
  @media (max-width:700px) { header > menu-tabs { display: none; } }
  @media (min-width:700px) { header .screen-label { display: none; } }
`;
  }
}
BasicApp.register();

// Bug: groups.setKey([]) causes it to dissappear from tabs.
export class SwitchUser extends ListTransform { // A submenu populated from setKeys/getModel.
  isSwitchUser = true;
  get viewTag() {
    return 'menu-item';
  }
  get titleEffect() {
    return this.shadow$('md-sub-menu > md-menu-item[slot="item"] > div[slot="headline"]').textContent = this.title;
  }
  get template() {
    return `
      <md-sub-menu>
        <md-menu-item slot="item">
          <div slot="headline"></div>
        </md-menu-item>
        <md-menu slot="menu"></md-menu>
      </md-sub-menu>
    `;
  }
  get itemParent() { // Overrides the default (which is the first content child.
    return this.shadow$('md-menu');
  }
  get copyContent() {
    return this.content.innerHTML;
  }
  get user() {
    return App?.url.searchParams.get('user') || this.myUsers[0] || '';
  }
  get userEffect() {
    //console.log(`user set to ${this.user} among ${this.myUsers}. FIXME: Set user button image; distinguish in our menu.`);
    App.resetUrl({user: this.user});
    return true;
  }
  get myUsers() { // List of alts. Initially from local storage and then set when adding accounts.
    let found = JSON.parse(localStorage.getItem('myUsers') || '[]'); //fixme? "Alice", "Bob", "Carol"]');
    return found;
  }
  get myUsersEffect() { // Update the local storage and setkeys() hwen the myUsers changes.
    localStorage.setItem('myUsers', JSON.stringify(this.myUsers));
    this.setKeys(this.myUsers);
    return true;
  }
  afterInitialize() {
    super.afterInitialize();
    if (!App) console.warn("No App has been set for use by SwitchUser.");
    if (!this.user) {
      if (!this.myUsers.length) console.warn("No user has been set."); // Could be first time.
      return;
    }
    if (!this.myUsers.includes(this.user)) {
      if (!App.addUserScreen) console.warn("No AddUser facility.");
      return;
    }
  }
}
SwitchUser.register();

export class AppFirstuse extends MDElement {
  isFirstUse = true;
  storageKey = 'seenFirstUse';
  wasSeen() { return !!localStorage.getItem(this.storageKey); }
  setSeen() { localStorage.setItem(this.storageKey, true); return true; }
  get seen() {
    return this.wasSeen();
  }
  get seenEffect() {
    if (this.seen === this.wasSeen()) return true;
    if (this.seen) return this.setSeen();
    localStorage.clear();
    App.resetUrl(Object.fromEntries(App.url.searchParams.entries())); // Leaving hash.
    return true;
  }
}
AppFirstuse.register();

export class SecurityQuestionSelection extends MDElement {
  static get formAssociated() { return true; } // Mark as form-associated
  get label() {
    return 'security question';
  }
  get index() {
    return Array.from(this.parentElement.querySelectorAll(`security-question-selection`)).indexOf(this);
  }
  get indexEffect() {
    this.shadow$(`md-select-option:nth-of-type(${this.index + 1})`).setAttribute('selected', 'selected');
    return true;
  }
  get name() {
    const name = 'q' + this.index;
    this.setAttribute('name', name);
    return name;
  }
  get template() {
    return `
      <md-outlined-select required label="${this.label}" name="${this.name}">
         <md-select-option value="0"><div slot="headline">What is your quest?</div></md-select-option>
         <md-select-option value="1"><div slot="headline">What is your favorite color?</div></md-select-option>
         <md-select-option value="2"><div slot="headline">What is the capital of Assyria?</div></md-select-option>
         <md-select-option value="3"><div slot="headline">What is the airspeed velocity of an unladen swallow?</div></md-select-option>
         <md-select-option value="4"><div slot="headline">How do you feel about these questions?</div></md-select-option>
      </md-outlined-select>
     `;
  }
  get styles() {
    return `md-outlined-select { width: 100%; }`;
  }
}
SecurityQuestionSelection.register();

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
	    myUsers = App?.switchUserScreen?.myUsers,
	    stored = await fetch(path, {
	      body: JSON.stringify(profile),
	      method: 'POST',
	      headers: {"Content-Type": "application/json"}
	    });
      if (!stored.ok) return console.error(stored.statusText);
      localStorage.setItem(this.tag, key);
      myUsers.push(this.tag);
      App?.switchUserScreen?.set('myUsers', myUsers);
      App?.resetUrl({user: this.tag});
      //this.profile = Object.fromEntries(new FormData(event.target));
      return null;
    });
  }
  get template() {
    return `
	  <section>
	    <slot name="headline" slot="headline"></slot>
	    <form method="dialog" slot="content" id="form">
              <slot></slot>
              <md-outlined-text-field required
                   autocapitalize="words"
                   autocomplete="username"
                   minlength="1" maxlength="60"
                   label="user name" name="username"
                   placeholder="visible to others"></md-outlined-text-field>
              <div class="avatar">
		<div>
		  Avatar
		  <md-outlined-button disabled>Use photo <i>not implemented</i></md-outlined-button>
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
              <md-filled-button type="submit" form="form"> <!-- cannot be a fab -->
                 Go
                 <material-icon slot="icon">login</material-icon>
              </md-filled-button>
	    </div>
	  </section>
          <dialog>
            <div slot="content">
              <md-outlined-text-field>
              <md-outlined-text-field>
            </div>
          </dialog>
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

export class AddUser extends MDElement {
  isAddUser = true;
  get template() {
    return `
      <p>Authorize <user-chooser></user-chooser> on this machine.</p>
      <p>Right now, this just authorizes every request. Yes, you can steal someone's account right now! <b>Please don't.</b></p>
      <p>
        Later on, this will give the user a choice (if applicable):
        <ol>
          <li>Answering their security questions</li>
          <li>Sending a message to the app already installed on another device or browser, asking them to confirm authorization.</li>
        </ol>
      </p>
    `;
  }
}
AddUser.register();

export class ChooserButton extends MenuButton {
  // Usage: call this.setKeys(list-of-users);
  get button() {
    return null;
  }
  get choice() {
    return "";
  }
  get choiceEffect() {
    if (!this.button) return null;
    return this.button.textContent = this.choice;
  }
  afterInitialize() {
    const button = document.createElement('md-outlined-button');
    this.button = button;
    this.append(button);
    this.addEventListener('close-menu', event => {
      event.stopPropagation();
      this.choice = event.detail.initiator.dataset.key;
    });
    super.afterInitialize();
  }
  get styles() {
    return `:host { vertical-align: bottom; position: relative; }`;
  }
}
ChooserButton.register();

export class UserChooser extends ChooserButton {
  get choice() {
    return App?.url.searchParams.get('user');
  }
  afterInitialize() {
    super.afterInitialize();
    fetch(`/persist/user/list.json`)
      .then(response => response.json())
      .then(json => this.setKeys(json)); // FIXME: when can/should this be re-run?
  }
}
UserChooser.register();
