import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DesignSurface from './components/DesignSurface';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';

const ReportDesigner = () => {
  const [reportDefinition, setReportDefinition] = useState({
    title: 'New Report',
    pages: [
      {
        sections: [
          {
            elements: [],
          },
        ],
      },
    ],
  });
  const [selectedElement, setSelectedElement] = useState(null);

  const handleAddElement = (elementType) => {
    const newElement = {
      type: elementType,
      properties: {},
    };
    const newReportDefinition = { ...reportDefinition };
    newReportDefinition.pages[0].sections[0].elements.push(newElement);
    setReportDefinition(newReportDefinition);
  };

  const handleSelectElement = (element) => {
    setSelectedElement(element);
  };

  const handleElementPropertyChanged = (element, propertyName, propertyValue) => {
    const newReportDefinition = { ...reportDefinition };
    const elementToUpdate = newReportDefinition.pages[0].sections[0].elements.find(
      (e) => e === element
    );
    elementToUpdate.properties[propertyName] = propertyValue;
    setReportDefinition(newReportDefinition);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '200px', marginRight: '20px' }}>
          <Toolbar onAddElement={handleAddElement} />
        </div>
        <div style={{ flex: 1 }}>
          <DesignSurface
            reportDefinition={reportDefinition}
            onSelectElement={handleSelectElement}
          />
        </div>
        <div style={{ width: '300px', marginLeft: '20px' }}>
          <PropertiesPanel
            selectedElement={selectedElement}
            onElementPropertyChanged={handleElementPropertyChanged}
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default ReportDesigner;
