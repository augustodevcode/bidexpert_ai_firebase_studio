// components/report/designer/DesignCanvas.tsx
import React from 'react';
import { Report, ReportElement, TextElement, TableElement } from './types/report';

interface DesignCanvasProps {
  report: Report;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<ReportElement>) => void;
}

const DesignCanvas: React.FC<DesignCanvasProps> = ({ report, onSelectElement, onUpdateElement }) => {
  const renderElement = (element: ReportElement) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      top: element.y,
      left: element.x,
      width: element.width,
      height: element.height,
      border: '1px dashed blue', // Indicate selectable element
      cursor: 'pointer',
    };

    const handleClick = () => {
      onSelectElement(element.id);
    };

    switch (element.type) {
      case 'text':
        const textElement = element as TextElement;
        return (
          <div key={element.id} style={style} onClick={handleClick}>
            {textElement.content}
          </div>
        );
      case 'table':
        const tableElement = element as TableElement;
        return (
          <div key={element.id} style={style} onClick={handleClick}>
            Table: {tableElement.dataSourceId}
          </div>
        );
      case 'chart':
        const chartElement = element as ChartElement;
        return (
          <div key={element.id} style={style} onClick={handleClick}>
            Chart: {chartElement.chartType}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="design-canvas"
      style={{ position: 'relative', width: '100%', height: '500px', border: '1px solid black', overflow: 'hidden' }}
      onClick={() => onSelectElement(null)} // Deselect when clicking canvas
    >
      {report.elements.map(renderElement)}
    </div>
  );
};

export default DesignCanvas;