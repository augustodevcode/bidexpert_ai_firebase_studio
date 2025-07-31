import React from 'react';
import { useDrop } from 'react-dnd';

const DesignSurface = ({ reportDefinition, onSelectElement }) => {
  const [, drop] = useDrop(() => ({
    accept: 'toolbar-element',
    drop: (item) => onSelectElement(item),
  }));

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
          {element.type}
        </div>
      ))}
    </div>
  );
};

export default DesignSurface;
