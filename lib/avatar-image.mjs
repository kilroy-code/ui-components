import { MDElement, App } from './md-element.mjs';
const { File, FileReader } = window;

export class AvatarImage extends MDElement {
  static fileData(fileObject) { // Return a data url, or empty string if fileObject is falsy.
    if (!fileObject) return '';
    const reader = new FileReader();
    const promise = new Promise(resolve => reader.onload = event => resolve(event.target.result));
    reader.readAsDataURL(fileObject);
    return promise;
  }

  get model() {
    return App.userCollection[App.user] || null;
  }
  get url() { // Can be data url or empty, in which case title should be supplied.
    let picture = this.model?.picture;
    if (typeof(picture) === 'string') return picture;
    return this.constructor.fileData(picture);
  }
  get title() {
    return this.model?.username || this.model?.title || '';
  }
  get size() {
    return this.model?.size || 40;
  }
  get titleEffect() {
    return this.shadow$('avatar-jdenticon').title = this.title;
  }
  get urlEffect() {
    let url = this.url;
    if (!  /^(data:|http|\.\/)/.test(url)) url = App.getPictureURL(url);
    this.shadow$('img')?.setAttribute('src', url);
    return true;
  }
  get sizeEffect() {
    this.style.setProperty('--avatar-size', `${this.size}pt`);
    this.shadow$('avatar-jdenticon').size = this.size;
    return this.size;
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
      img { border-radius: 50%; object-fit: cover; }
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
