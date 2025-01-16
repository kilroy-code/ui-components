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

  activateKey(key) { // Make ONLY the specified tab active. (It is allowed for key to not be among the tabs.
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
    // One might think we would do this on 'change', but md-tabs does not generate that event when clicked on when nothing is active.
    this.viewParent.addEventListener('click', event => {
      // Synthesize the same event we would get by selecting a menu-button item.
      this.dispatchEvent(new CustomEvent('close-menu', {detail: {initiator: event.target}, bubbles: true, composed: true}));
    });
  }

}
MenuTabs.register();
