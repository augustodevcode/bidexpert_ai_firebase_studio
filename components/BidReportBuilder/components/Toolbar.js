import React from 'react';

const Toolbar = () => {
  const handleAddElement = (elementType) => {
    // This will be implemented later
    console.log(`Adding ${elementType}`);
  };

  return (
    <div>
      <h3>Toolbar</h3>
      <button onClick={() => handleAddElement('Table')}>Add Table</button>
      <button onClick={() => handleAddElement('Chart')}>Add Chart</button>
      <button onClick={() => handleAddElement('TextBox')}>Add Text Box</button>
      <button onClick={() => handleAddElement('Image')}>Add Image</button>
      <button onClick={() => handleAddElement('RichText')}>Add Rich Text</button>
    </div>
  );
};

export default Toolbar;
