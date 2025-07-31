import { render as renderPdf } from './pdf-renderer';
import { render as renderHtml } from './html-renderer';

export const render = (reportDefinition, format) => {
  switch (format) {
    case 'pdf':
      return renderPdf(reportDefinition);
    case 'html':
      return renderHtml(reportDefinition);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};
