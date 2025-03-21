import { ListItems } from './list-items.mjs';

export class LiveList extends ListItems {
  get tags() {
    return this.collection?.liveTags || [];
  }
  get activeEffect() { // Keep viewParent children's active attribute consistent with our value.
    let active = this.active;
    for (let transformer of this.transform.transformers) {
      if (transformer.dataset.key === active) {
	transformer.view.setAttribute('active', 'active');
      } else {
	transformer.view.removeAttribute('active');
      }
    }
    return true;
  }
}
LiveList.register();
