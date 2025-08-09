import React from 'react';

const PropertiesPanel = ({ selectedElement, onElementPropertyChanged }) => {
  if (!selectedElement) {
    return (
      <div>
        <h3>Properties</h3>
        <p>Select an element to see its properties.</p>
      </div>
    );
  }

  const handlePropertyChanged = (e) => {
    onElementPropertyChanged(selectedElement, e.target.name, e.target.value);
  };

  return (
    <div>
      <h3>Properties</h3>
      <div>
        <label>ID:</label>
        <input type="text" name="id" value={selectedElement.id} readOnly />
      </div>
      <div>
        <label>Type:</label>
        <input type="text" name="type" value={selectedElement.type} readOnly />
      </div>
      <div>
        <label>Text:</label>
        <input
          type="text"
          name="text"
          value={selectedElement.text || ''}
          onChange={handlePropertyChanged}
        />
      </div>
      {/* Add more properties here */}
    </div>
  );
};

export default PropertiesPanel;
