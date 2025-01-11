import { ListTransform } from './list-transform.mjs';
const { CustomEvent } = window;

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
