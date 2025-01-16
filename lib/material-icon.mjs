import { MDElement } from './md-element.mjs';

export class MaterialIcon extends MDElement {
  get template() {
    return `
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
      <md-icon part="icon" class="material-icons"><slot></slot></md-icon>
    `;
  }
}
MaterialIcon.register();
