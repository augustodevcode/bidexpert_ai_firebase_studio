export class ReportComponent {
  constructor(properties) {
    this.properties = properties;
  }

  render(renderer) {
    throw new Error('The render method must be implemented by a subclass.');
  }
}
