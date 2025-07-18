// components/report/designer/DesignCanvas.tsx
import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { Report, ReportElement, TextElement, TableElement, ChartElement } from './types/report';
import { v4 as uuidv4 } from 'uuid';

interface DesignCanvasProps {

  report: Report;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<ReportElement>) => void;
}

const DesignCanvas: React.FC<DesignCanvasProps> = ({ report, onSelectElement, onUpdateElement }) => {
    const [, drop] = useDrop(() => ({
        accept: ['text', 'table', 'chart'], // Accept elements from toolbar
        drop: (item: any, monitor) => {
            const clientOffset = monitor.getClientOffset();
            const canvasRect = (document.querySelector('.design-canvas') as HTMLElement)?.getBoundingClientRect();

            if (clientOffset) {
                if (canvasRect) {
                    const x = clientOffset.x - canvasRect.left;
                    const y = clientOffset.y - canvasRect.top;

                    const newElement: any = {
                        id: uuidv4(), // Generate a unique ID for the new element
                        type: item.type,
                        x,
                        y,
                        width: 150, // Default size
                        height: 100,
                        ...(item.type === 'text' && { content: 'New Text' }),
                        ...(item.type === 'table' && { dataSourceId: '', columns: [] }),
                        ...(item.type === 'chart' && { dataSourceId: '', chartType: 'bar' }),
                    };
                    // We call onUpdateElement to add the new element to the report state
                    onUpdateElement(newElement.id, newElement);
                }
             }
            return undefined;
        },
    }));
  const renderElement = (element: ReportElement) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      top: element.y,
      left: element.x,
      width: element.width,
      height: element.height,
      border: '1px dashed blue',
      padding: '4px', // Added padding for better visualization
      cursor: 'move', // Indicate draggable
      overflow: 'hidden', // Prevent content overflowing during drag
    };

    const handleClick = () => {
      onSelectElement(element.id);
    };

    const [{ isDragging }, drag] = useDrag(() => ({
      type: element.type,
      item: { id: element.id, type: element.type, x: element.x, y: element.y },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
        end: (item, monitor) => {
            const dropResult = monitor.getDropResult() as { x: number; y: number } | null;
                // Update position based on drop result from canvas
                onUpdateElement(item.id as string, { x: dropResult.x, y: dropResult.y });
            }

          // Handle drop if needed, though position update is done via onUpdateElement
        }
      },
    }));

    const draggableStyle = {
        ...style,
        opacity: isDragging ? 0.5 : 1,
        border: isDragging ? '1px dashed green' : '1px dashed blue',
    };

      switch (element.type) {
          case 'text':
              const textElement = element as TextElement;
              return (<div ref={drag} key={element.id} style={draggableStyle} onClick={handleClick}>
                  {textElement.content}
              </div>);

          case 'table':
              const tableElement = element as TableElement;
              return (<div ref={drag} key={element.id} style={draggableStyle} onClick={handleClick}>
                  Table: {tableElement.dataSourceId}
              </div>);

          case 'chart':
              const chartElement = element as ChartElement;
              return (<div ref={drag} key={element.id} style={draggableStyle} onClick={handleClick}>
                  Chart: {chartElement.chartType}
              </div>);
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