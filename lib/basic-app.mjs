import { Rule } from '@kilroy-code/rules';
import { MDElement } from './md-element.mjs';
import { ListDivider } from './list-divider.mjs';
import { LiveCollection } from './live-collection.mjs';
const { URL } = window;

export class BasicApp extends MDElement {
  constructor() {
    super();
    MDElement.App = window.App = this;
  }
  getParameter(key) {
    const stringOrNull = this.getUrlParameter(key);
    if (!stringOrNull) return '';
    return decodeURIComponent(stringOrNull);
  }
  get screen() { // The currently displayed screen.
    return this.getParameter('screen');
  }
  get user() {
    return this.getParameter('user') || this.userCollection.liveTags[0] || '';
  }
  get userRecord() {
    return this.userCollection[this.user] || null;
  }
  getPictureURL(string) {
    if (!string) return '';
    if (/^(data:|http|\.\/)/.test(string)) return string;
    return `images/${string}`; // A reasonable arrangement, but apps will likely override.
  }
  get setUser() {
    console.warn("Please set setUser property.");
    return false;
  }
  createUserTag(editUserComponent) { // Can be overriden by applications.
    return editUserComponent.title;
  }
  findUser(properties) { // Can be overwritten by applications if they have a more complete picture of things elsewhere.
    return this.userCollection.knownTags.find(tag => {
      const record = this.userCollection[tag];
      for (let key in properties) {
	if (record[key] !== properties[key]) return false;
      }
      return true;
    });
  }
  get title() { // Priority is overriding rule, the element's attribute, the head title content, or hostname.
    return this.doc$('html > head > title')?.textContent || location.hostname;
  }
  get securityQuestions() {
    return [
      "What is your quest?",
      "What is your favorite color?",
      "What is the capital of Assyria?",
      "What is the airspeed velocity of an unladen swallow?"
    ];
  }
  get screens() {
    return Array.from(this.children).filter(s => s.getAttribute('slot') !== 'additional-header');
  }
  get defaultScreenTitle() {
    return this.screens[0]?.title || '';
  }
  get url() { // location.href, as a URL. Instead of assigning this, call resetUrl.
    return new URL(location.href);
  }
  getUrlParameter(key) {
    if (key === 'screen') return this.url.hash.slice(1);
    return this.url.searchParams.get(key);
  }
  urlWith(parameters) { // Answer a copy of url with parameters set appropriately. (E.g. screen => hash, and everything else in query params.)
    const url = new URL(this.url.href);
    for (const key in parameters) {
      const value = parameters[key];
      if (key === 'screen') url.hash = value;
      else if (!value) url.searchParams.delete(key);
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
    if (previous === next.href) return false;
    this.url = new URL(next);
    if (!updateHistory) return true;
    const params = Object.fromEntries(next.searchParams.entries());
    params.screen = next.hash.slice(1);
    history.pushState(params, this.title, next.href);
    return true;
  }
  displayScreen(title) { // Without changing url params.
    let selected = this.screens.find(screen => screen.title === title);
    if (!selected) return;
    // In this implementation, we make only the active screen visible.
    // Alternatives might, e.g., scroll down or across.
    this.screens.forEach(screen => {
      const isSelected = screen === selected;
      screen.style.display = isSelected ? '' : 'none';
      screen.toggleAttribute('active', isSelected);
    });
    // Kluge alert: surely this can be done with css somehow?
    this.shadow$('header').style.display = selected === this.firstUseScreen ? 'none' : '';
    selected.activate?.();
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
  get langEffect() { // If html[lang] is not set, set it from this.lang rule, and return whatever value is used.
    // Note: does not change html[lang] once set, even if code assigns this.lang.
    const key = 'lang';
    if (this.htmlElement.hasAttribute(key)) return this.htmlElement.getAttribute(key);
    this.htmlElement.setAttribute(key, this.lang);
    return this.lang;
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
  get screensEffect() {
    this.screens.forEach(screen => screen.dataset.key = screen.title);
    return true;
  }
  get screenEffect() { // Recononicalize url and screen.
    this.screen = undefined; // Allow it to be recomputed.
    this.shadow$('.screen-label').textContent = this.screen;
    //this.shadow$('menu-tabs').activateKey(this.screen);
    this.displayScreen(this.screen);
    return true;
  }
  // These two are usually no-ops because the referenced rule is usually changed by resetUrl, but these work from startup or if someone changes it the other way.
  get baseUserEffect() {
    return this.resetUrl({user: this.user});
  }
  onhashchange() { // Set current screen to that defined by the hash.
    this.resetUrl({screen: location.hash.slice(1)}, false);
  }
  onpopstate(event) {
    if (event.state) this.resetUrl(event.state, false);
  }
  select(key) { // main navigation.
    if (!this.screens.find(s => s.dataset.key === key)) return; // Must be from propogation of some MD event.
    this.resetUrl({screen: key});
  }
  afterInitialize() {
    const userMenuItems = this.shadow$('slot[name="user-menu"]').assignedElements();
    const additionalHeaderItems = this.shadow$('slot[name="additional-header"]').assignedElements();
    const additionalScreenItems = this.shadow$('slot[name="additional-screen"]').assignedElements();
    this.shadow$('#user').collection = new LiveCollection({
      records: userMenuItems
    });
    this.shadow$('#navigation').collection = new LiveCollection({
      records: this.screens.filter(s => !userMenuItems.includes(s) &&
				   !additionalHeaderItems.includes(s) &&
				   !additionalScreenItems.includes(s) &&
				   s !== this.firstUseScreen // for now. Too confusing, and spins besides
				  )
    });
    // this.shadow$('menu-tabs').collection = new LiveCollection({
    //   records: this.shadow$('slot:not([name]').assignedElements().filter(e => !(e instanceof ListDivider))
    // });

    super.afterInitialize();

    window.addEventListener('hashchange', event => this.onhashchange(event));
    window.addEventListener('popstate', event => this.onpopstate(event));

    const screenKeys = this.screens.map(s => s.dataset.key);
    this.addEventListener('close-menu', event => {
      this.select(event.detail.initiator.dataset.key);
    });

    if (this.directedToFirstUse()) return true;
    if (!this.screen) this.resetUrl({screen: this.screens[0].title});
    return true;
  }
  directedToFirstUse() {
    if (this.firstUseScreen?.seen) return false;
    setTimeout(() => this.displayScreen(this.firstUseScreen.title));
    return true;
  }

  alert(message, headline = '') {
    return this.dialog(this.shadow$('md-dialog:has(#alert)'), message, headline);
  }
  confirm(message, headline = '') {
    return this.dialog(this.shadow$('md-dialog:has(#confirm)'), message, headline);
  }
  dialog(dialog, message, headline) {
    dialog.querySelector('[slot="headline"]').textContent = headline;
    dialog.querySelector('form').innerHTML = message; // Accept cleansed html here?
    const resolution = new Promise(resolve => dialog.onclose = () => resolve(dialog.returnValue));
    dialog.show();
    return resolution;
  }
  findScreen(indicator) {
    return this.screens.find(screen => screen[indicator]) || null;
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
  get htmlElement() {
    return this.doc$('html');
  }
  get headElement() {
    return this.doc$('html > head');
  }
  get template() {
    return `
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link href="style.css" rel="stylesheet">
  <slot name="first-use"></slot>
  <header>
    <screen-menu-button id="navigation">
      <md-icon-button slot="button"><md-icon class="material-icons">menu</md-icon></md-icon-button>
    </screen-menu-button>
    <span>${this.title}<span class="screen-label"></span></span>
    <!-- <menu-tabs></menu-tabs>-->
    <span>
      <slot name="additional-header"></slot>
      <screen-menu-button id="user">
        <avatar-image slot="button"></avatar-imaget/>
      </screen-menu-button>
    </span>
  </header>
  <main>
    <slot name="user-menu"></slot>
    <slot name="additional-screen"></slot>
    <slot></slot>
  </main>
  <md-dialog>
    <div slot="headline"></div>
    <form slot="content" id="confirm" method="dialog"></form>
    <div slot="actions">
      <md-text-button form="confirm" value="ok" type="submit">Ok</md-text-button>
      <md-text-button form="confirm" value="cancel" type="submit">Cancel</md-text-button>
    </div>
  </md-dialog>
  <md-dialog>
    <div slot="headline"></div>
    <form slot="content" id="alert" method="dialog"></form>
    <div slot="actions">
      <md-text-button form="alert" value="ok" type="submit">Ok</md-text-button>      
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
    gap: var(--margin, 10px);
    padding: calc(var(--margin, 10px) / 2);
  }
  header > menu-tabs {
    --md-primary-tab-container-color: var(--md-sys-color-primary-container);
    --md-primary-tab-active-indicator-color: var(--md-sys-color-on-primary-container);
    --md-primary-tab-icon-color: var(--md-sys-color-on-primary-container);
  }
  header, header md-icon, header material-icon, header menu-tabs::part(tab) {
    color: var(--md-sys-color-on-primary-container);
  }
  header > #user { margin: 5px; }
  .screen-label::before { content: ": "; }
  /*
  @media (max-width:700px) { header > menu-tabs { display: none; } }
  @media (min-width:700px) { header .screen-label { display: none; } }
  */
`;
  }
}
BasicApp.register();
