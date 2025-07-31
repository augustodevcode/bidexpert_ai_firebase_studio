import React from 'react';
import { useDrop } from 'react-dnd';
import { TextComponent } from '../../../reporting-engine/components/text';
import { ChartComponent } from '../../../reporting-engine/components/chart';
import { TableComponent } from '../../../reporting-engine/components/table';

const DesignSurface = ({ reportDefinition, onSelectElement }) => {
  const [, drop] = useDrop(() => ({
    accept: 'toolbar-element',
    drop: (item) => onSelectElement(item),
  }));

  const renderElement = (element) => {
    switch (element.type) {
      case 'text':
        return new TextComponent(element.properties).render();
      case 'chart':
        return new ChartComponent(element.properties).render();
      case 'table':
        return new TableComponent(element.properties).render();
      default:
        return null;
    }
  };

  return (
    <div
      ref={drop}
      style={{
        width: '100%',
        height: '500px',
        border: '1px solid black',
        position: 'relative',
      }}
    >
      {reportDefinition.pages[0].sections[0].elements.map((element, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: element.properties.x,
            top: element.properties.y,
            width: element.properties.width,
            height: element.properties.height,
            border: '1px solid gray',
          }}
          onClick={() => onSelectElement(element)}
        >
          {renderElement(element)}
        </div>
      ))}
    </div>
  );
};

export default DesignSurface;
