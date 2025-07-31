import fs from 'fs';

export const render = (reportDefinition) => {
  let content = `${reportDefinition.title}\n\n`;

  reportDefinition.pages.forEach((page) => {
    page.sections.forEach((section) => {
      section.elements.forEach((element) => {
        if (element.type === 'text') {
          content += `${element.properties.text}\n`;
        }
      });
    });
  });

  fs.writeFileSync('report.txt', content);

  return content;
};
