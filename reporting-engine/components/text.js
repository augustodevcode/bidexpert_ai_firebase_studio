import { ReportComponent } from './base';

export class TextComponent extends ReportComponent {
  render(renderer) {
    renderer.text(this.properties.text, this.properties);
  }
}
