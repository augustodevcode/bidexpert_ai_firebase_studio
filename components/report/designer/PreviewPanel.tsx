// components/report/designer/PreviewPanel.tsx
import React from 'react';
import { Report, ReportElement, TextElement, TableElement } from './types/report';
import { useData } from './contexts/DataContext';

interface PreviewPanelProps {
  report: Report;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ report }) => {
  const { getDataSource } = useData();

  const renderElement = (element: ReportElement) => {
    switch (element.type) {
      case 'text':
        const textElement = element as TextElement;
        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              top: element.y,
              left: element.x,
              width: element.width,
              height: element.height,
              overflow: 'hidden', // Prevent content overflow in preview
            }}
          >
            {textElement.content}
          </div>
        );
      case 'table':
        const tableElement = element as TableElement;
        const dataSource = getDataSource(tableElement.dataSourceId);
        if (!dataSource || !dataSource.data) {
          return (
            <div
              key={element.id}
              style={{
                position: 'absolute',
                top: element.y,
                left: element.x,
                width: element.width,
                height: element.height,
                border: '1px dashed red', // Indicate missing data
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'small',
              }}
            >
              Data source "{tableElement.dataSourceId}" not found or empty
            </div>
          );
        }
        // Basic table rendering for preview
        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              top: element.y,
              left: element.x,
              width: element.width,
              height: element.height,
              overflow: 'auto', // Allow scrolling for large tables
              border: '1px solid #ddd', // Add a subtle border
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  {tableElement.columns.map(col => (
                    <th key={col.field} style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataSource.data.map((row, rowIndex) => (
                  <tr key={rowIndex} style={{ '&:nth-child(even)': { backgroundColor: '#f9f9f9' } as React.CSSProperties }}>
                    {tableElement.columns.map(col => (
                      <td key={col.field} style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {row[col.field]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'chart':
        // Chart rendering is more complex and requires a charting library
        return (
          <div
            key={element.id}
            style={{
              position: 'absolute',
              top: element.y,
              left: element.x,
              width: element.width,
              height: element.height,
              border: '1px dashed orange', // Indicate placeholder
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'small',
            }}
          >
            Chart Placeholder ({element.chartType || 'Unknown Type'})
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'auto', // Allow scrolling if the report exceeds panel size
        backgroundColor: '#fff', // White background for preview
        padding: '16px', // Add some padding
      }}
      className="preview-panel-container"
    >
      {report.elements.map(renderElement)}
    </div>
  );
};

export default PreviewPanel;