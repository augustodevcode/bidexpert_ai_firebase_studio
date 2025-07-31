import { Document, Packer, Paragraph, TextRun } from 'docx';
import fs from 'fs';

export const render = (reportDefinition) => {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: reportDefinition.title,
                bold: true,
                size: 50,
              }),
            ],
            alignment: 'center',
          }),
        ],
      },
    ],
  });

  reportDefinition.pages.forEach((page) => {
    page.sections.forEach((section) => {
      section.elements.forEach((element) => {
        if (element.type === 'text') {
          doc.addSection({
            children: [
              new Paragraph({
                children: [new TextRun(element.properties.text)],
              }),
            ],
          });
        }
      });
    });
  });

  const packer = new Packer();
  const buffer = packer.toBuffer(doc);
  fs.writeFileSync('report.docx', buffer);

  return buffer;
};
