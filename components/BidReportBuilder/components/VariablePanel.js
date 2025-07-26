import React, { useState, useEffect } from 'react';
import { useDrag } from 'react-dnd';

const DraggableVariable = ({ variable }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'variable',
    item: { variable },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <li ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {variable.name}
    </li>
  );
};

const VariablePanel = () => {
  const [variables, setVariables] = useState([]);

  useEffect(() => {
    fetch('/api/variables')
      .then((res) => res.json())
      .then((data) => {
        setVariables(data);
      });
  }, []);

  return (
    <div>
      <h3>Variables</h3>
      {variables.map((group) => (
        <div key={group.group}>
          <h4>{group.group}</h4>
          <ul>
            {group.variables.map((variable) => (
              <DraggableVariable key={variable.value} variable={variable} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default VariablePanel;
