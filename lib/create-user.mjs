import { MDElement } from './md-element.mjs';
import { AuthorizeUser } from './authorize-user.mjs';

export class CreateUser extends MDElement {
  get template() {
    return `<edit-user></edit-user>`;
  }
  onaction(form) {
    const component = this.findParentComponent(form),
	  tag = component?.tag;
    AuthorizeUser.adopt(tag);
  }
}
CreateUser.register();
