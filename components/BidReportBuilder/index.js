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
      const report = designer.GetReport();
      const control = designer.CreateControl(elementType, report);
      report.bands.detail.controls.add(control);
    }
  };

  const handleSelectionChanged = (sender, e) => {
    setSelectedElement(e.selected);
  };

  const handleSelectDataSource = (dataSource) => {
    if (designerRef.current && selectedElement) {
      const designer = designerRef.current.instance;
      const report = designer.GetReport();
      const control = report.getControlById(selectedElement.id);
      if (control) {
        control.dataSource = dataSource;
      }
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

  const handleElementPropertyChanged = (element, propertyName, propertyValue) => {
    if (designerRef.current) {
      const designer = designerRef.current.instance;
      const report = designer.GetReport();
      const control = report.getControlById(element.id);
      if (control) {
        control[propertyName] = propertyValue;
      }
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
          <PropertiesPanel selectedElement={selectedElement} onElementPropertyChanged={handleElementPropertyChanged} />
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
