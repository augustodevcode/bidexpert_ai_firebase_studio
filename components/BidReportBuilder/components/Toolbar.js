import React from 'react';

const Toolbar = ({ onAddElement, onSaveReport, onLoadReport, onExportReport }) => {
  return (
    <div>
      <h3>Toolbar</h3>
      <button onClick={() => onAddElement('Table')}>Add Table</button>
      <button onClick={() => onAddElement('Chart')}>Add Chart</button>
      <button onClick={() => onAddElement('TextBox')}>Add Text Box</button>
      <button onClick={() => onAddElement('Image')}>Add Image</button>
      <button onClick={() => onAddElement('RichText')}>Add Rich Text</button>
      <hr />
      <button onClick={onSaveReport}>Save Report</button>
      <button onClick={onLoadReport}>Load Report</button>
      <hr />
      <button onClick={() => onExportReport('pdf')}>Export to PDF</button>
      <button onClick={() => onExportReport('xlsx')}>Export to Excel</button>
      <button onClick={() => onExportReport('docx')}>Export to Word</button>
      <button onClick={() => onExportReport('pptx')}>Export to PowerPoint</button>
    </div>
  );
};

export default Toolbar;
