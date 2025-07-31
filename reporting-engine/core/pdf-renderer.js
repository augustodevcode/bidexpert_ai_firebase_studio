import PDFDocument from 'pdfkit';
import fs from 'fs';

export const render = (reportDefinition) => {
  const doc = new PDFDocument();
  const stream = doc.pipe(fs.createWriteStream('report.pdf'));

  doc.fontSize(25).text(reportDefinition.title, {
    align: 'center',
  });

  doc.end();

  return stream;
};
