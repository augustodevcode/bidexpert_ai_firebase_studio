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
        <label>Type:</label>
        <input type="text" name="type" value={selectedElement.type} readOnly />
      </div>
      {Object.keys(selectedElement.properties).map((key) => (
        <div key={key}>
          <label>{key}:</label>
          <input
            type="text"
            name={key}
            value={selectedElement.properties[key]}
            onChange={handlePropertyChanged}
          />
        </div>
      ))}
    </div>
  );
};

export default PropertiesPanel;
