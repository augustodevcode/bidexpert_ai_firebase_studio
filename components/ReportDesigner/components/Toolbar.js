import React from 'react';
import { useDrag } from 'react-dnd';

const DraggableToolbarItem = ({ type }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'toolbar-element',
    item: { type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move' }}>
      {type}
    </div>
  );
};

const Toolbar = () => {
  return (
    <div>
      <h3>Toolbar</h3>
      <DraggableToolbarItem type="text" />
      <DraggableToolbarItem type="image" />
      <DraggableToolbarItem type="chart" />
      <DraggableToolbarItem type="table" />
    </div>
  );
};

export default Toolbar;
