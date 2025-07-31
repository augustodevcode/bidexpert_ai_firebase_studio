import { ReportComponent } from './base';

export class TableComponent extends ReportComponent {
  render(renderer) {
    renderer.table(this.properties.data, this.properties);
  }
}
