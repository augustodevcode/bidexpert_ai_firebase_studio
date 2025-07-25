import React, { useState, useEffect, useRef } from 'react';
import ReportDesigner from './components/ReportDesigner';
import AIPanel from './components/AIPanel';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import DataSourceManager from './components/DataSourceManager';
import PreviewPanel from './components/PreviewPanel';
import styles from './styles/ReportBuilder.css';

const BidReportBuilder = () => {
  const [reports, setReports] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [reportUrl, setReportUrl] = useState('');
  const designerRef = useRef();

  useEffect(() => {
    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
        if (data.length > 0) {
          setReportUrl(data[0].id);
        }
      });
  }, []);

  const handleAddElement = (elementType) => {
    if (designerRef.current) {
      const designer = designerRef.current.instance;
      // This is a placeholder for the actual implementation
      // You will need to use the DevExpress Report Designer API to add elements
      console.log(`Adding ${elementType} to the designer`);
    }
  };

  const handleSelectionChanged = (sender, e) => {
    setSelectedElement(e.selected);
  };

  const handleSelectDataSource = (dataSource) => {
    if (designerRef.current && selectedElement) {
      const designer = designerRef.current.instance;
      // This is a placeholder for the actual implementation
      // You will need to use the DevExpress Report Designer API to bind the data source
      console.log(`Binding data source ${dataSource.name} to element ${selectedElement.id}`);
    }
  };

  const handleReportChanged = (sender, e) => {
    setReportUrl(e.report.url);
  };

  const handleGetAIAssistance = async (request) => {
    if (designerRef.current) {
      const designer = designerRef.current.instance;
      const report = designer.GetReport();
      const reportJson = JSON.stringify(report.serialize());

      return await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, report: reportJson }),
      });
    }
  };

  return (
    <div className={styles.container}>
      <h1>Bid Report Builder</h1>
      <div style={{ display: 'flex' }}>
        <div style={{ width: '200px', marginRight: '20px' }}>
          <DataSourceManager onSelectDataSource={handleSelectDataSource} />
          <Toolbar onAddElement={handleAddElement} />
        </div>
        <div style={{ flex: 1 }}>
          <ReportDesigner ref={designerRef} onSelectionChanged={handleSelectionChanged} onReportChanged={handleReportChanged} />
        </div>
        <div style={{ width: '300px', marginLeft: '20px' }}>
          <PropertiesPanel selectedElement={selectedElement} />
          <AIPanel onGetAIAssistance={handleGetAIAssistance} />
        </div>
      </div>
      <div>
        <h2>Reports</h2>
        <ul>
          {reports.map((report) => (
            <li key={report.id} onClick={() => setReportUrl(report.id)}>
              {report.title}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <PreviewPanel reportUrl={reportUrl} />
      </div>
    </div>
  );
};

export default BidReportBuilder;
