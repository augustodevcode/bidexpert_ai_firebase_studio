'use client';
import React from 'react';
import { useDrop } from 'react-dnd';

const ReportDesigner = () => {
  const [, drop] = useDrop(() => ({
    accept: 'variable',
    drop: (item) => console.log('Dropped:', item),
  }));

  return (
    <div ref={drop} className="h-full w-full border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">Área de Design do Relatório</p>
    </div>
  );
};

export default ReportDesigner;
