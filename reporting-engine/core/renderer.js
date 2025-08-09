import { render as renderPdf } from './pdf-renderer';
import { render as renderHtml } from './html-renderer';
import { render as renderDocx } from './docx-renderer';
import { render as renderXlsx } from './xlsx-renderer';
import { render as renderTxt } from './txt-renderer';

export const render = (reportDefinition, format) => {
  switch (format) {
    case 'pdf':
      return renderPdf(reportDefinition);
    case 'html':
      return renderHtml(reportDefinition);
    case 'docx':
      return renderDocx(reportDefinition);
    case 'xlsx':
      return renderXlsx(reportDefinition);
    case 'txt':
      return renderTxt(reportDefinition);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};
