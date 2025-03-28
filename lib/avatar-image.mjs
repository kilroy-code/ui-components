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
    const img = this.shadow$('img');
    // Subtle: if url is a promise to data, then we need to wait for it.
    // But if it WAS a promise to data and now empty, we need to make sure
    // that the old 'then' doesn't set us back to the picture.
    if (url.then) url.then(awaited => img.setAttribute('src', this.url && awaited));
    else img.setAttribute('src', url);
    return true;
  }
  get sizeEffect() {
    this.style.setProperty('--avatar-size', `${this.size}px`);
    this.shadow$('avatar-jdenticon').size = this.size;
    return this.size;
  }
  get radius() { // percent of size
    return 50;
  }
  get radiusEffect() {
    this.style.setProperty('--avatar-radius', `${this.radius}%`);
    return this.radius;
  }
  get template() {
    return `
       <div class="avatar">
         <img src=""></img>
         <avatar-jdenticon></avatar-jdenticon>
         <material-icon>person_off</material-icon>
       </div>
    `;
  }
  get styles() {
    return `
      material-icon { display: inline-block; }
      div, img, avatar-jdenticon, :host, material-icon, material-icon::part(icon) {
        height: var(--avatar-size, 40px);
        width: var(--avatar-size, 40px);
        display: inline-block;
      }
      material-icon::part(icon) { font-size: var(--avatar-size); }
      img {
        border-radius: var(--avatar-radius, 50%);
        object-fit: cover;
        background: white;
      }
      avatar-jdenticon {
        border-radius: var(--avatar-radius, 50%);
        background: white;
      }

      img[src=""],
      img:not([src=""]) + avatar-jdenticon,
      avatar-jdenticon:not([hasTitle]),
      img:not([src=""]) ~ material-icon,
      avatar-jdenticon[hasTitle] ~ material-icon {
        display: none;
      }
   `;
  }
}
AvatarImage.register();
