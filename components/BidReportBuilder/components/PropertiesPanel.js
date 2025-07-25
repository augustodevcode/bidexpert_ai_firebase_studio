import React from 'react';

const PropertiesPanel = ({ selectedElement }) => {
  if (!selectedElement) {
    return (
      <div>
        <h3>Properties</h3>
        <p>Select an element to see its properties.</p>
      </div>
    );
  }

  return (
    <div>
      <h3>Properties</h3>
      <p>ID: {selectedElement.id}</p>
      <p>Type: {selectedElement.type}</p>
      {/* Add more properties here */}
    </div>
  );
};

export default PropertiesPanel;
