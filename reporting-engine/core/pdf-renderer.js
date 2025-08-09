import PDFDocument from 'pdfkit';
import fs from 'fs';
import { TextComponent } from '../components/text';

export const render = (reportDefinition) => {
  const doc = new PDFDocument();
  const stream = doc.pipe(fs.createWriteStream('report.pdf'));

  doc.fontSize(25).text(reportDefinition.title, {
    align: 'center',
  });

  reportDefinition.pages.forEach((page) => {
    page.sections.forEach((section) => {
      section.elements.forEach((element) => {
        if (element.type === 'text') {
          const component = new TextComponent(element.properties);
          component.render(doc);
        }
      });
    });
  });

  doc.end();

  return stream;
};
