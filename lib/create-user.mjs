import { MDElement } from './md-element.mjs';
import { AuthorizeUser } from './authorize-user.mjs';

export class CreateUser extends MDElement {
  get template() {
    return `<edit-user><slot></slot></edit-user>`;
  }
  async onaction(form) {
    const component = this.findParentComponent(form),
	  tag = component?.tag;
    await AuthorizeUser.adopt(tag);
  }
}
CreateUser.register();
