import { MDElement } from './md-element.mjs';
import { AuthorizeUser } from './authorize-user.mjs';

export class CreateUser extends MDElement {
  get template() {
    return `<edit-user><slot></slot><slot name="afterSecurity" slot="afterSecurity"></slot></edit-user>`;
  }
  validate() {
    return true;
  }
  activate() {
    const editElement = this.shadow$('edit-user');
    editElement.tag = undefined;
  }
  async onaction(form) {
    const component = this.findParentComponent(form),
	  tag = await component?.tag;
    await AuthorizeUser.adopt(tag);
  }
}
CreateUser.register();
