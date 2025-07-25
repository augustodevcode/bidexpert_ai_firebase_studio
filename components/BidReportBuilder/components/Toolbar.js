import React from 'react';

const Toolbar = ({ onAddElement, onSaveReport, onLoadReport }) => {
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
    </div>
  );
};

export default Toolbar;
