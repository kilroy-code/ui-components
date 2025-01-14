import { BaseCollectionTransform, BaseTransformer } from './base-collection-transform.mjs';
const { CustomEvent } = window;

export class TabTransformer extends BaseTransformer {
  get template() {
    return `<md-primary-tab part="tab"></md-primary-tab>`;
  }
}
TabTransformer.register();

export class MenuTabs extends BaseCollectionTransform {
  get transformerTag() {
    return 'tab-transformer';
  }
  get template() {
    return `<md-tabs part="tabs"></md-tabs>`;
  }
  get viewParent() {
    return this.shadow$('md-tabs');
  }
  get transformers() {
    return this.transform.transformers;
  }
  get visibleScreenKeys() {
    return this.transformers.map(e => e.dataset.key);
  }

  activateKey(key) {
    let index = 0, transformers = this.transformers;
    for (const tab of this.viewParent.tabs) {
      // It is possible to call this before the md-primary-tab[data-key] is set by TabTransformer.sideEffect.
      // So we get the dataset.key from the corresponding model.
      // Alternatively, we could go next tick, but that would be awkward to debug.
      tab.active = key === transformers[index++].dataset.key;
    }
  }
  afterInitialize() {
    super.afterInitialize();
    this.viewParent.addEventListener('change', event => {
      this.dispatchEvent(new CustomEvent('close-menu', {detail: {initiator: event.target.activeTab}, bubbles: true, composed: true}));
    });
  }

  get visibleEffect() {
    // We don't have tabs children yet (wait for next tick, but collect the required values now in this dynamic extent.
    const {transformers, visibleScreenKeys, viewParent} = this;
    setTimeout(() => {
      for (const tab of viewParent.tabs) {
	const isVisible = visibleScreenKeys.includes(tab.dataset.key);
	tab.style.display = isVisible ? '' : 'none';
      }
    });
    return true;
  }
}
MenuTabs.register();
