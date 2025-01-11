import { Rule } from '@kilroy-code/rules';
import { MDElement } from './md-element.mjs';
import { ListDivider } from './list-divider.mjs';
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
    return this.getParameter('user');
  }
  getUserModel(key = this.user) {
    return this.switchUserScreen?.getCachedModel(key);
  }
  getPictureURL(filename) {
    if (!filename) return '';
    return `images/${filename}`; // A reasonable arrangement, but apps will likely override.
  }
  getUserPictureURL(key = this.user) {
    return this.getPictureURL(this.getUserModel(key)?.picture);
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
  get avatarElement() {
    return this.shadow$('#user img');
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
    this.resetUrl({screen: location.hash.slice(1)}, false);
  }
  onpopstate(event) {
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
      //fixme else this.switchUserScreen?.set('user', key);
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
    <menu-button id="user">
     <img class="avatar"/>
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
  .avatar {
    border-radius: 50%;
    height: var(--avatar-size, 40px);
    width:  var(--avatar-size, 40px);
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
