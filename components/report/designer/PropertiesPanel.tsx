// components/report/designer/PropertiesPanel.tsx
import React from 'react';
import { ReportElement, TextElement, TableElement, ChartElement } from './types/report';
import { useData } from './contexts/DataContext';

interface PropertiesPanelProps {
  selectedElement: ReportElement | null;
  onUpdateElement: (id: string, updates: Partial<ReportElement>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElement, onUpdateElement }) => {
  const { dataSources } = useData();

  if (!selectedElement) {
    return <div>Select an element to edit properties</div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onUpdateElement(selectedElement.id, { [name]: value });
  };

    const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onUpdateElement(selectedElement.id, { [name]: parseFloat(value) || 0 }); // Parse to number
    };

    const handleStyleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onUpdateElement(selectedElement.id, {
            styles: {
                ...(selectedElement.styles || {}),
                [name]: value,
            },
        });
    };


  const handleColumnMappingChange = (index: number, field: string, value: string) => {
      if (selectedElement?.type === 'table') {
          const updatedColumns = [...(selectedElement as TableElement).columns];
          updatedColumns[index] = { ...updatedColumns[index], [field]: value };
          onUpdateElement(selectedElement.id, { columns: updatedColumns });
      }
  };

    const handleAddColumn = () => {
        if (selectedElement?.type === 'table') {
            const updatedColumns = [...(selectedElement as TableElement).columns, { field: '', label: '' }];
            onUpdateElement(selectedElement.id, { columns: updatedColumns });
        }
    };

    const handleDeleteColumn = (index: number) => {
        if (selectedElement?.type === 'table') {
            const updatedColumns = (selectedElement as TableElement).columns.filter((_, i) => i !== index);
            onUpdateElement(selectedElement.id, { columns: updatedColumns });
        }
    };


  // Render common properties (position and size)
    const commonProperties = (
        <div>
            <h4>Common Properties</h4>
             <div>
                <label>X:</label>
                <input type="number" name="x" value={selectedElement.x} onChange={handleNumberInputChange} />
            </div>
            <div>
                <label>Y:</label>
                <input type="number" name="y" value={selectedElement.y} onChange={handleNumberInputChange} />
            </div>
             <div>
                <label>Width:</label>
                <input type="number" name="width" value={selectedElement.width} onChange={handleNumberInputChange} />
            </div>
            <div>
                <label>Height:</label>
                <input type="number" name="height" value={selectedElement.height} onChange={handleNumberInputChange} />
            </div>
        </div>
    );

    // Render basic styling properties
    const basicStyleProperties = (
         <div>
             <h4>Basic Styles</h4>
             <div>
                <label>Color:</label>
                <input type="text" name="color" value={selectedElement.styles?.color || ''} onChange={handleStyleChange} />
            </div>
             <div>
                <label>Background Color:</label>
                <input type="text" name="backgroundColor" value={selectedElement.styles?.backgroundColor || ''} onChange={handleStyleChange} />
            </div>
             <div>
                <label>Border:</label>
                <input type="text" name="border" value={selectedElement.styles?.border || ''} onChange={handleStyleChange} />
            </div>
         </div>
    );


  // Render different property editors based on element type
  switch (selectedElement.type) {
    case 'text':
      const textElement = selectedElement as TextElement;
      return (
        <div>
          <h3>Text Properties</h3>
          {commonProperties}
            {basicStyleProperties}
          <div>
            <label>Content:</label>
            <textarea
              name="content"
              value={textElement.content}
              onChange={handleInputChange}
            />
          </div>
        </div>
      );
    case 'table':
      const tableElement = selectedElement as TableElement;
        const selectedDataSource = dataSources.find(ds => ds.id === tableElement.dataSourceId);
      return (
        <div>
          <h3>Table Properties</h3>
           {commonProperties}
            {basicStyleProperties}
          <div>
            <label>Data Source:</label>
              <select name="dataSourceId" value={tableElement.dataSourceId} onChange={handleInputChange}>
                <option value="">Select Data Source</option>
                  {dataSources.map(ds => (
                      <option key={ds.id} value={ds.id}>{ds.name}</option>
                  ))}
              </select>
          </div>
            {selectedDataSource && (
                <div>
                    <h4>Columns</h4>
                    {tableElement.columns.map((col, index) => (
                        <div key={index} style={{ border: '1px solid #eee', padding: '4px', marginBottom: '4px' }}>
                            <div>
                                <label>Label:</label>
                                <input
                                    type="text"
                                    value={col.label}
                                    onChange={(e) => handleColumnMappingChange(index, 'label', e.target.value)}
                                />
                            </div>
                            <div>
                                <label>Field:</label>
                                <select
                                    value={col.field}
                                    onChange={(e) => handleColumnMappingChange(index, 'field', e.target.value)}
                                >
                                    <option value="">Select Field</option>
                                    {/* Assuming sample data objects have consistent keys */}
                                    {selectedDataSource.data && selectedDataSource.data.length > 0 &&
                                        Object.keys(selectedDataSource.data[0]).map(field => (
                                            <option key={field} value={field}>{field}</option>
                                        ))
                                    }
                                </select>
                            </div>
                             <button onClick={() => handleDeleteColumn(index)}>Delete Column</button>
                        </div>
                    ))}
                    <button onClick={handleAddColumn}>Add Column</button>
                </div>
            )}
        </div>
      );
       case 'chart':
             return (
                 <div>
                     <h3>Chart Properties</h3>
                      {commonProperties}
                    {basicStyleProperties}
                     {/* Add chart-specific properties */}
                      <div>
                         <label>Chart Type:</label>
                          <select name="chartType" value={(selectedElement as ChartElement).chartType || ''} onChange={handleInputChange}>
                             <option value="">Select Chart Type</option>
                              <option value="bar">Bar</option>
                              <option value="line">Line</option>
                              <option value="pie">Pie</option>
                          </select>
                     </div>
                     <div>
                         <label>Data Source:</label>
                          <select name="dataSourceId" value={(selectedElement as ChartElement).dataSourceId || ''} onChange={handleInputChange}>
                             <option value="">Select Data Source</option>
                              {dataSources.map(ds => (
                                  <option key={ds.id} value={ds.id}>{ds.name}</option>
                              ))}
                          </select>
                     </div>
                 </div>
             );
    default:
      return <div>Properties for {selectedElement.type}</div>;
  }
};

export default PropertiesPanel;