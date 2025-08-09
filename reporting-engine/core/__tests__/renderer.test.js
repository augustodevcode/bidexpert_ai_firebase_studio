import { render } from '../renderer';
import * as pdfRenderer from '../pdf-renderer';
import * as htmlRenderer from '../html-renderer';

vi.mock('../pdf-renderer', () => ({
  render: vi.fn(),
}));

vi.mock('../html-renderer', () => ({
  render: vi.fn(),
}));

describe('renderer', () => {
  it('should call the pdf renderer when the format is pdf', () => {
    const reportDefinition = { title: 'Test Report' };
    render(reportDefinition, 'pdf');
    expect(pdfRenderer.render).toHaveBeenCalledWith(reportDefinition);
  });

  it('should call the html renderer when the format is html', () => {
    const reportDefinition = { title: 'Test Report' };
    render(reportDefinition, 'html');
    expect(htmlRenderer.render).toHaveBeenCalledWith(reportDefinition);
  });

  it('should throw an error for unsupported formats', () => {
    const reportDefinition = { title: 'Test Report' };
    expect(() => render(reportDefinition, 'unsupported')).toThrow(
      'Unsupported format: unsupported'
    );
  });
});
