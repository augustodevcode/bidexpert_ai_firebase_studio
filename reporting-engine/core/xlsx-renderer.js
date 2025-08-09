import ExcelJS from 'exceljs';
import fs from 'fs';

export const render = async (reportDefinition) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  worksheet.addRow([reportDefinition.title]);

  reportDefinition.pages.forEach((page) => {
    page.sections.forEach((section) => {
      section.elements.forEach((element) => {
        if (element.type === 'text') {
          worksheet.addRow([element.properties.text]);
        }
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  fs.writeFileSync('report.xlsx', buffer);

  return buffer;
};
