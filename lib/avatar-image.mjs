import { MDElement, App } from './md-element.mjs';

export class AvatarImage extends MDElement {
  get model() {
    return App.userCollection[App.user] || null;
  }
  get url() { // Can be data url or empty, in which case title should be supplied.
    return this.model?.picture || '';
  }
  get title() {
    return this.model?.username || this.model?.title || '';
  }
  get jdenticon() {
    return this.shadow$('avatar-jdenticon');
  }
  get jdenticonSize() {
    return 40;
  }
  get titleEffect() {
    return this.jdenticon.title = this.title;
  }
  get urlEffect() {
    let url = this.url;
    if (!  /^(data:|http|\.\/)/.test(url)) url = App.getPictureURL(url);
    this.shadow$('img')?.setAttribute('src', url);
    return true;
  }
  sizeEffect() {
    return this.jdenticon.size = this.jdenticonSize;
  }
  get template() {
    return `
       <div class="avatar">
         <img></img>
         <avatar-jdenticon></avatar-jdenticon>
         <material-icon>person_off</material-icon>
       </div>
    `;
  }
  get styles() {
    return `
      material-icon { display: inline-block; }
      img[src=""],
      img:not([src=""]) + avatar-jdenticon,
      avatar-jdenticon:not([hasTitle]),
      img:not([src=""]) ~ material-icon,
      avatar-jdenticon[hasTitle] ~ material-icon {
        display: none;
      }
      img { border-radius: 50%; }
      div, img, avatar-jdenticon, material-icon, material-icon::part(icon) { height: 100%; width: 100%; }
      :host {
        display: inline-block;
        height: var(--avatar-size, 40px);
        width: var(--avatar-size, 40px);
      }
   `;
  }
}
AvatarImage.register();
